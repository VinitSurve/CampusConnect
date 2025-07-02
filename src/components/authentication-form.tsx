
"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { 
  signInWithEmailAndPassword, 
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  createUserWithEmailAndPassword,
  type User as FirebaseUser
} from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { createSession } from "@/app/actions";
import AnimatedParticles from "./animated-particles";
import Link from "next/link";

export default function AuthenticationForm() {
  const [isFlipped, setIsFlipped] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // --- Login State & Handlers ---
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // --- Register State & Handlers ---
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobile: "",
    course: "",
    year: "",
    password: "",
    confirmPassword: ""
  });
  const [registerErrors, setRegisterErrors] = useState<any>({});
  const [registerLoading, setRegisterLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // New state to handle redirect check
  const [isCheckingRedirect, setIsCheckingRedirect] = useState(true);

  useEffect(() => {
    const checkRedirectResult = async () => {
      try {
        setGoogleLoading(true);
        const result = await getRedirectResult(auth);
        if (result) {
          // User has successfully signed in via redirect.
          await handleSuccessfulLogin(result.user);
        }
      } catch (error: any) {
        // Handle specific errors if necessary, e.g., auth/account-exists-with-different-credential
        console.error("Google Sign-In redirect error:", error);
        if (error.code !== 'auth/no-redirect-operation') {
          setLoginError("Failed to sign in with Google. Please try again.");
        }
      } finally {
        setIsCheckingRedirect(false); // Finished checking, show the form
        setGoogleLoading(false);
      }
    };

    checkRedirectResult();
  }, []);


  const handleSuccessfulLogin = async (user: FirebaseUser) => {
      const userDocRef = doc(db, "users", user.uid);
      let userDoc = await getDoc(userDocRef);

      if (!userDoc.exists() && user.email) {
         // If user signs in with Google for the first time
         const isFaculty = isFacultyEmail(user.email);
         await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            email: user.email,
            name: user.displayName,
            fullName: user.displayName,
            role: isFaculty ? "faculty" : "student",
            createdAt: serverTimestamp()
          });
      }
      
      await createSession(user.uid);
      router.refresh();
  }

  const handleTraditionalLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      setLoginError("");
      setLoginLoading(true);

      const userCredential = await signInWithEmailAndPassword(auth, identifier, password);
      await createSession(userCredential.user.uid);
      router.refresh();

    } catch (err) {
      console.error("Login error:", err);
      setLoginError("Failed to sign in. Please check your credentials.");
    } finally {
      setLoginLoading(false);
    }
  };

  const isFacultyEmail = (email: string) => {
    const facultyEmails = [
      "ujwala@gmail.com",
      "e.reed@university.edu"
    ];
    return facultyEmails.includes(email);
  };
  
  // Updated Google Login to use redirect
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      setLoginError("");
      setGoogleLoading(true);
      await signInWithRedirect(auth, provider);
      // The page will now redirect to Google. The result is handled by the useEffect.
    } catch (err) {
      console.error("Google login failed:", err);
      setLoginError("Failed to sign in with Google. Please try again.");
      setGoogleLoading(false);
    }
  };

  // --- Register Logic ---
  const validateStep1 = () => {
    const newErrors: any = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email is invalid";
    if (!formData.mobile.trim()) newErrors.mobile = "Mobile number is required";
    else if (!/^\d{10}$/.test(formData.mobile)) newErrors.mobile = "Mobile number must be 10 digits";
    if (!formData.course) newErrors.course = "Please select a course";
    if (!formData.year) newErrors.year = "Please select a year";
    setRegisterErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: any = {};
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords don't match";
    setRegisterErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (registerErrors[name]) setRegisterErrors({ ...registerErrors, [name]: null });
  };

  const generateUsername = async (fullName: string) => {
    let baseName = fullName.toLowerCase().replace(/\s+/g, '');
    const generateRandomSuffix = () => Math.floor(Math.random() * 900) + 100;
    let username = `${baseName}${generateRandomSuffix()}`;
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 5) {
      const q = query(collection(db, "users"), where("username", "==", username));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        isUnique = true;
      } else {
        username = `${baseName}${generateRandomSuffix()}`;
        attempts++;
      }
    }
    return username;
  };

  const nextStep = () => {
    if (currentStep === 1 && validateStep1()) setCurrentStep(2);
  };

  const prevStep = () => setCurrentStep(1);

  const handleRegisterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (currentStep === 1) {
      nextStep();
      return;
    }
    if (!validateStep2()) return;
    
    setRegisterLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      const username = await generateUsername(formData.fullName);
      
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        fullName: formData.fullName,
        email: formData.email,
        mobile: formData.mobile,
        course: formData.course,
        year: formData.year,
        username,
        role: "student",
        createdAt: serverTimestamp()
      });
      
      await createSession(user.uid, true);
      toast({ title: "Registration successful!" });
      router.refresh();
      
    } catch (error: any) {
      console.error("Registration error:", error);
      if (error.code === 'auth/email-already-in-use') {
        setRegisterErrors({ ...registerErrors, email: "Email already in use" });
        setCurrentStep(1);
      } else {
        toast({ title: "Registration Failed", description: error.message, variant: "destructive" });
      }
    } finally {
      setRegisterLoading(false);
    }
  };
  
  if (isCheckingRedirect || googleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-800 via-blue-900 to-indigo-900">
        <div className="text-white text-xl flex items-center">
          <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Signing in...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center overflow-hidden font-sans bg-gradient-to-br from-blue-800 via-blue-900 to-indigo-900 p-4 [perspective:1000px]">
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-r from-blue-500/20 to-indigo-500/20 blur-3xl animate-float" style={{ top: '10%', right: '15%' }}></div>
        <div className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-r from-blue-600/20 to-indigo-600/20 blur-3xl animate-float-delay" style={{ bottom: '5%', left: '10%' }}></div>
        <AnimatedParticles />
      </div>
      
      <div className="relative z-10 max-w-md w-full mx-auto h-[740px]">
        <div className={`relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
          
          {/* LOGIN FORM (FRONT) */}
          <div className="absolute w-full h-full [backface-visibility:hidden]">
            <div className="backdrop-blur-xl bg-white/10 rounded-3xl shadow-[0_20px_80px_-15px_rgba(0,0,0,0.4)] border border-white/10 overflow-hidden transition-all duration-300 h-full flex flex-col">
              <div className="relative h-32 bg-gradient-to-r from-blue-700/80 to-indigo-800/80 p-8 overflow-hidden">
                <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-white/10 rounded-full"></div>
                <div className="absolute -bottom-16 -left-16 w-60 h-60 bg-white/10 rounded-full"></div>
                <div className="relative z-10">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" /></svg>
                    </div>
                    <h1 className="text-white text-2xl font-bold tracking-tight">CampusConnect</h1>
                  </div>
                </div>
              </div>
              <div className="p-8 flex-grow">
                <h2 className="text-white text-xl font-semibold mb-6">Sign in to your account</h2>
                {loginError && <div className="mb-6 px-4 py-3 bg-red-800/20 border border-red-500/30 rounded-lg backdrop-blur-sm"><p className="text-white text-sm">{loginError}</p></div>}
                <form onSubmit={handleTraditionalLogin} className="space-y-5">
                  <div className="space-y-2">
                    <label htmlFor="identifier" className="text-white text-sm block">Email</label>
                    <div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg></div><input id="identifier" type="email" value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="bg-white/5 border border-white/10 text-white rounded-xl block w-full pl-10 pr-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-white/50" placeholder="Enter your email" required /></div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="password" className="text-white text-sm block">Password</label>
                    <div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg></div><input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="bg-white/5 border border-white/10 text-white rounded-xl block w-full pl-10 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-white/50" placeholder="Enter your password" autoComplete="current-password" required /><div className="absolute inset-y-0 right-0 pr-3 flex items-center"><button type="button" onClick={() => setShowPassword(!showPassword)} className="text-white/70 hover:text-white focus:outline-none">{showPassword ? <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}</button></div></div>
                  </div>
                  <button type="submit" disabled={loginLoading} className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg transition-colors disabled:opacity-70">{loginLoading ? <div className="flex items-center justify-center"><svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Signing in...</div> : "Sign in"}</button>
                </form>
                <div className="relative flex items-center my-6"><div className="flex-grow border-t border-white/20"></div><span className="flex-shrink mx-4 text-white text-xs uppercase tracking-wider">Or</span><div className="flex-grow border-t border-white/20"></div></div>
                <button onClick={handleGoogleLogin} disabled={googleLoading} className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3.5 rounded-xl shadow-lg transition-all duration-300 relative overflow-hidden" aria-label="Sign in with Google">{!googleLoading ? <div className="flex items-center"><svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg><span className="text-white">Continue with Google</span></div> : <div className="flex items-center"><svg className="animate-spin h-5 w-5 text-white mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span className="text-white">Signing in...</span></div>}</button>
                <div className="mt-8 pt-6 border-t border-white/20 text-center">
                  <p className="text-white text-sm">Don't have an account?{" "}<button onClick={(e) => { e.preventDefault(); setIsFlipped(true); }} className="text-white font-medium hover:text-blue-300 transition-colors bg-transparent border-none p-0">Register here</button></p>
                </div>
              </div>
            </div>
          </div>

          {/* REGISTER FORM (BACK) */}
          <div className="absolute w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <div className="backdrop-blur-xl bg-white/10 rounded-3xl shadow-[0_20px_80px_-15px_rgba(0,0,0,0.4)] border border-white/10 overflow-hidden h-full flex flex-col">
              <div className="relative h-32 bg-gradient-to-r from-blue-700/80 to-indigo-800/80 p-8 overflow-hidden">
                <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-white/10 rounded-full"></div><div className="absolute -bottom-16 -left-16 w-60 h-60 bg-white/10 rounded-full"></div>
                <div className="relative z-10">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" /></svg></div>
                    <div><h1 className="text-white text-2xl font-bold tracking-tight">Create Account</h1><p className="text-white/70 text-sm mt-1">Step {currentStep} of 2</p></div>
                  </div>
                </div>
              </div>
              <div className="p-8 flex-grow overflow-y-auto" style={{'scrollbarWidth': 'none', '-ms-overflow-style': 'none'}}>
                <form onSubmit={handleRegisterSubmit} className="space-y-5">
                  {currentStep === 1 ? (
                    <>
                      <div className="space-y-2"><label htmlFor="fullName" className="text-white text-sm block">Full Name</label><div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></div><input id="fullName" name="fullName" type="text" value={formData.fullName} onChange={handleRegisterChange} className={`bg-white/5 border ${registerErrors.fullName ? 'border-red-500' : 'border-white/10'} text-white rounded-xl block w-full pl-10 pr-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-white/50`} placeholder="Enter your full name" /></div>{registerErrors.fullName && <p className="text-red-400 text-xs mt-1">{registerErrors.fullName}</p>}</div>
                      <div className="space-y-2"><label htmlFor="email" className="text-white text-sm block">Email Address</label><div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg></div><input id="email" name="email" type="email" value={formData.email} onChange={handleRegisterChange} className={`bg-white/5 border ${registerErrors.email ? 'border-red-500' : 'border-white/10'} text-white rounded-xl block w-full pl-10 pr-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-white/50`} placeholder="Enter your email address" /></div>{registerErrors.email && <p className="text-red-400 text-xs mt-1">{registerErrors.email}</p>}</div>
                      <div className="space-y-2"><label htmlFor="mobile" className="text-white text-sm block">Mobile Number</label><div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg></div><input id="mobile" name="mobile" type="tel" value={formData.mobile} onChange={handleRegisterChange} className={`bg-white/5 border ${registerErrors.mobile ? 'border-red-500' : 'border-white/10'} text-white rounded-xl block w-full pl-10 pr-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-white/50`} placeholder="Enter your mobile number" /></div>{registerErrors.mobile && <p className="text-red-400 text-xs mt-1">{registerErrors.mobile}</p>}</div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><label htmlFor="course" className="text-white text-sm block">Course</label><select id="course" name="course" value={formData.course} onChange={handleRegisterChange} className={`bg-white/5 border ${registerErrors.course ? 'border-red-500' : 'border-white/10'} text-white rounded-xl block w-full pl-3 pr-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none`}><option value="" disabled className="bg-gray-800">Select Course</option><option value="BCA" className="bg-gray-800">BCA</option><option value="BBA" className="bg-gray-800">BBA</option><option value="BAF" className="bg-gray-800">BAF</option><option value="MBA" className="bg-gray-800">MBA</option></select>{registerErrors.course && <p className="text-red-400 text-xs mt-1">{registerErrors.course}</p>}</div>
                        <div className="space-y-2"><label htmlFor="year" className="text-white text-sm block">Year</label><select id="year" name="year" value={formData.year} onChange={handleRegisterChange} className={`bg-white/5 border ${registerErrors.year ? 'border-red-500' : 'border-white/10'} text-white rounded-xl block w-full pl-3 pr-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none`}><option value="" disabled className="bg-gray-800">Select Year</option><option value="I" className="bg-gray-800">I</option><option value="II" className="bg-gray-800">II</option><option value="III" className="bg-gray-800">III</option></select>{registerErrors.year && <p className="text-red-400 text-xs mt-1">{registerErrors.year}</p>}</div>
                      </div>
                      <button type="button" onClick={nextStep} className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg transition-colors mt-8">Continue</button>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2"><label htmlFor="passwordReg" className="text-white text-sm block">Password</label><div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg></div><input id="passwordReg" name="password" type="password" value={formData.password} onChange={handleRegisterChange} className={`bg-white/5 border ${registerErrors.password ? 'border-red-500' : 'border-white/10'} text-white rounded-xl block w-full pl-10 pr-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-white/50`} placeholder="Create a password" /></div>{registerErrors.password && <p className="text-red-400 text-xs mt-1">{registerErrors.password}</p>}</div>
                      <div className="space-y-2"><label htmlFor="confirmPassword" className="text-white text-sm block">Confirm Password</label><div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg></div><input id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleRegisterChange} className={`bg-white/5 border ${registerErrors.confirmPassword ? 'border-red-500' : 'border-white/10'} text-white rounded-xl block w-full pl-10 pr-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-white/50`} placeholder="Confirm your password" /></div>{registerErrors.confirmPassword && <p className="text-red-400 text-xs mt-1">{registerErrors.confirmPassword}</p>}</div>
                      <div className="text-white/70 text-sm p-3 bg-blue-900/20 rounded-lg mt-4"><p className="flex items-start"><svg className="h-5 w-5 text-blue-400 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><span>We'll auto-generate a unique username for you. You can change it later in settings.</span></p></div>
                      <div className="flex space-x-3 mt-8">
                        <button type="button" onClick={prevStep} className="w-1/3 py-3 px-4 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors">Back</button>
                        <button type="submit" disabled={registerLoading} className="w-2/3 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg transition-colors disabled:opacity-70">{registerLoading ? <div className="flex items-center justify-center"><svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Creating...</div> : "Create Account"}</button>
                      </div>
                    </>
                  )}
                </form>

                {/* Sign in link */}
                <div className="mt-8 pt-6 border-t border-white/20 text-center">
                  <p className="text-white text-sm">
                    Already have an account?{" "}
                    <button onClick={(e) => { e.preventDefault(); setIsFlipped(false); }} className="text-white font-medium hover:text-blue-300 transition-colors bg-transparent border-none p-0">
                      Sign in here
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-4 left-0 right-0 text-center text-white text-xs">
          CampusConnect © {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}

    