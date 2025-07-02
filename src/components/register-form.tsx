"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, setDoc, doc, serverTimestamp } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { createSession } from "@/app/actions";

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobile: "",
    course: "",
    year: "",
    password: "",
    confirmPassword: ""
  });
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const router = useRouter();
  const { toast } = useToast();

  const validateStep1 = () => {
    const newErrors: any = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    
    if (!formData.mobile.trim()) {
      newErrors.mobile = "Mobile number is required";
    } else if (!/^\d{10}$/.test(formData.mobile)) {
      newErrors.mobile = "Mobile number must be 10 digits";
    }
    
    if (!formData.course) {
      newErrors.course = "Please select a course";
    }
    
    if (!formData.year) {
      newErrors.year = "Please select a year";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: any = {};
    
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const generateUsername = async (fullName: string) => {
    let baseName = fullName.toLowerCase().replace(/\s+/g, '');
    
    const generateRandomSuffix = () => Math.floor(Math.random() * 900) + 100;
    
    let username = `${baseName}${generateRandomSuffix()}`;
    let isUnique = false;
    let attempts = 0;
    
    while (!isUnique && attempts < 5) {
      const usernameQuery = query(
        collection(db, "users"),
        where("username", "==", username)
      );
      
      const querySnapshot = await getDocs(usernameQuery);
      
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
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    }
  };

  const prevStep = () => {
    setCurrentStep(1);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (currentStep === 1) {
      nextStep();
      return;
    }
    
    if (!validateStep2()) return;
    
    try {
      setLoading(true);
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
      
      const redirectUrl = await createSession(user.uid, true);

      toast({
        title: "Registration successful!",
      });

      window.location.href = redirectUrl;
      
    } catch (error: any) {
      console.error("Registration error:", error);
      if (error.code === 'auth/email-already-in-use') {
        setErrors({ ...errors, email: "Email already in use" });
        setCurrentStep(1); // Go back to email step
      } else {
        toast({
            title: "Registration Failed",
            description: error.message,
            variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center overflow-hidden font-sans bg-gradient-to-br from-blue-800 via-blue-900 to-indigo-900 p-4">
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated gradient orbs */}
        <div className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-r from-blue-500/20 to-indigo-500/20 blur-3xl animate-float"
          style={{ 
            top: '10%',
            right: '15%'
          }}
        ></div>
        <div className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-r from-blue-600/20 to-indigo-600/20 blur-3xl animate-float-delay"
          style={{ 
            bottom: '5%',
            left: '10%'
          }}
        ></div>
        
        {/* Subtle animated grid */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10"></div>
        
        {/* Floating particles */}
        <div className="particles absolute inset-0">
          {Array(20).fill(0).map((_, i) => (
            <div 
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full opacity-30 animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${5 + Math.random() * 10}s`
              }}
            ></div>
          ))}
        </div>
      </div>
      
      {/* Registration card */}
      <div className="relative z-10 max-w-md w-full mx-auto">
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl shadow-[0_20px_80px_-15px_rgba(0,0,0,0.4)] border border-white/10 overflow-hidden">
          {/* Card header */}
          <div className="relative h-32 bg-gradient-to-r from-blue-700/80 to-indigo-800/80 p-8 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('/noise.svg')] opacity-10"></div>
            <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-white/10 rounded-full"></div>
            <div className="absolute -bottom-16 -left-16 w-60 h-60 bg-white/10 rounded-full"></div>
            
            <div className="relative z-10">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-white text-2xl font-bold tracking-tight">Create Account</h1>
                  <p className="text-white/70 text-sm mt-1">Step {currentStep} of 2</p>
                </div>
              </div>
            </div>
          </div>

          {/* Registration form */}
          <div className="p-8 max-h-[65vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-5">
              {currentStep === 1 ? (
                // Step 1: Personal Information
                <>
                  <div className="space-y-2">
                    <label htmlFor="fullName" className="text-white text-sm block">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <input
                        id="fullName"
                        name="fullName"
                        type="text"
                        value={formData.fullName}
                        onChange={handleChange}
                        className={`bg-white/5 border ${errors.fullName ? 'border-red-500' : 'border-white/10'} text-white rounded-xl block w-full pl-10 pr-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-white/50`}
                        placeholder="Enter your full name"
                      />
                    </div>
                    {errors.fullName && <p className="text-red-400 text-xs mt-1">{errors.fullName}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-white text-sm block">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                        </svg>
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`bg-white/5 border ${errors.email ? 'border-red-500' : 'border-white/10'} text-white rounded-xl block w-full pl-10 pr-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-white/50`}
                        placeholder="Enter your email address"
                      />
                    </div>
                    {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="mobile" className="text-white text-sm block">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <input
                        id="mobile"
                        name="mobile"
                        type="tel"
                        value={formData.mobile}
                        onChange={handleChange}
                        className={`bg-white/5 border ${errors.mobile ? 'border-red-500' : 'border-white/10'} text-white rounded-xl block w-full pl-10 pr-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-white/50`}
                        placeholder="Enter your mobile number"
                      />
                    </div>
                    {errors.mobile && <p className="text-red-400 text-xs mt-1">{errors.mobile}</p>}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="course" className="text-white text-sm block">
                        Course
                      </label>
                      <select
                        id="course"
                        name="course"
                        value={formData.course}
                        onChange={handleChange}
                        className={`bg-white/5 border ${errors.course ? 'border-red-500' : 'border-white/10'} text-white rounded-xl block w-full pl-3 pr-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none`}
                      >
                        <option value="" disabled className="bg-gray-800">Select Course</option>
                        <option value="BCA" className="bg-gray-800">BCA</option>
                        <option value="BBA" className="bg-gray-800">BBA</option>
                        <option value="BAF" className="bg-gray-800">BAF</option>
                        <option value="MBA" className="bg-gray-800">MBA</option>
                      </select>
                      {errors.course && <p className="text-red-400 text-xs mt-1">{errors.course}</p>}
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="year" className="text-white text-sm block">
                        Year
                      </label>
                      <select
                        id="year"
                        name="year"
                        value={formData.year}
                        onChange={handleChange}
                        className={`bg-white/5 border ${errors.year ? 'border-red-500' : 'border-white/10'} text-white rounded-xl block w-full pl-3 pr-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none`}
                      >
                        <option value="" disabled className="bg-gray-800">Select Year</option>
                        <option value="I" className="bg-gray-800">I</option>
                        <option value="II" className="bg-gray-800">II</option>
                        <option value="III" className="bg-gray-800">III</option>
                      </select>
                      {errors.year && <p className="text-red-400 text-xs mt-1">{errors.year}</p>}
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={nextStep}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg transition-colors mt-8"
                  >
                    Continue
                  </button>
                </>
              ) : (
                // Step 2: Password
                <>
                  <div className="space-y-2">
                    <label htmlFor="password" className="text-white text-sm block">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <input
                        id="password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`bg-white/5 border ${errors.password ? 'border-red-500' : 'border-white/10'} text-white rounded-xl block w-full pl-10 pr-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-white/50`}
                        placeholder="Create a password"
                      />
                    </div>
                    {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="text-white text-sm block">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={`bg-white/5 border ${errors.confirmPassword ? 'border-red-500' : 'border-white/10'} text-white rounded-xl block w-full pl-10 pr-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-white/50`}
                        placeholder="Confirm your password"
                      />
                    </div>
                    {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
                  </div>
                  
                  <div className="text-white/70 text-sm p-3 bg-blue-900/20 rounded-lg mt-4">
                    <p className="flex items-start">
                      <svg className="h-5 w-5 text-blue-400 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>We'll auto-generate a unique username for you based on your name. You can change it later in settings.</span>
                    </p>
                  </div>
                  
                  <div className="flex space-x-3 mt-8">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="w-1/3 py-3 px-4 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-2/3 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg transition-colors disabled:opacity-70"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating...
                        </div>
                      ) : (
                        "Create Account"
                      )}
                    </button>
                  </div>
                </>
              )}
            </form>

            {/* Sign in link */}
            <div className="mt-8 pt-6 border-t border-white/20 text-center">
              <p className="text-white text-sm">
                Already have an account?{" "}
                <Link href="/" className="text-white font-medium hover:text-blue-300 transition-colors">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
        
        {/* Card reflection effect */}
        <div className="mt-1 w-full h-8 bg-gradient-to-b from-white/5 to-transparent rounded-full blur-sm"></div>
      </div>
      
      {/* Footer/Branding */}
      <div className="absolute bottom-4 left-0 right-0 text-center text-white text-xs">
        CampusMeet © {new Date().getFullYear()}
      </div>
    </div>
  );
}

    