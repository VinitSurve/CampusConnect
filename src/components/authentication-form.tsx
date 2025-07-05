
"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, auth, firebase_error } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { 
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  type User as FirebaseUser
} from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { createSession } from "@/app/actions";
import { AlertCircle } from "lucide-react";

function FirebaseErrorDisplay() {
  if (!firebase_error) return null;
  
  return (
    <div className="mb-6 px-4 py-3 bg-red-800/40 border border-red-500/50 rounded-lg backdrop-blur-sm">
      <div className="flex items-start">
        <AlertCircle className="h-5 w-5 text-red-300 mr-3 mt-0.5" />
        <div>
          <h3 className="text-white font-semibold">Configuration Error</h3>
          <pre className="text-red-200 text-sm mt-1 whitespace-pre-wrap font-sans">{firebase_error.message}</pre>
        </div>
      </div>
    </div>
  )
}

export default function AuthenticationForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (!auth) {
      setIsLoading(false);
      return;
    }
    const checkRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          await handleSuccessfulLogin(result.user);
        } else {
          setIsLoading(false);
        }
      } catch (error: any) {
        console.error("Google Sign-In redirect error:", error);
        toast({ title: "Sign-In Error", description: "Failed to sign in with Google. Please try again.", variant: "destructive" });
        setIsLoading(false);
      }
    };

    checkRedirectResult();
  }, [toast, router]);

  const isFacultyEmail = (email: string) => {
    const facultyEmails = [
      "ujwala@gmail.com",
      "e.reed@university.edu"
    ];
    return facultyEmails.includes(email);
  };

  const handleSuccessfulLogin = async (user: FirebaseUser) => {
    if (!db || !auth) {
      toast({ title: "Configuration Error", description: "Firebase is not configured correctly.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    
    const { uid, email, displayName } = user;

    if (!email) {
      toast({ title: "Login Error", description: "Email not available from your Google account.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    const userDocRef = doc(db, "users", uid);
    const userDoc = await getDoc(userDocRef);

    const isNewUser = !userDoc.exists();

    if (isNewUser) {
      await setDoc(userDocRef, {
        uid: uid,
        email,
        name: displayName || 'New User',
        fullName: displayName || 'New User',
        role: isFacultyEmail(email) ? "faculty" : "student",
        createdAt: serverTimestamp(),
      });
    }

    const redirectUrl = await createSession(uid, isNewUser);
    router.push(redirectUrl);
  };

  const handleGoogleLogin = async () => {
    if (!auth) {
       toast({ title: "Configuration Error", description: "Firebase is not configured correctly. Cannot use Google Sign-In.", variant: "destructive" });
      return;
    }
    const provider = new GoogleAuthProvider();
    try {
      setIsLoading(true);
      await signInWithRedirect(auth, provider);
    } catch (err) {
      console.error("Google login failed:", err);
      toast({ title: "Sign-In Error", description: "Failed to sign in with Google. Please try again.", variant: "destructive" });
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl flex items-center">
          <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </div>
      </div>
    );
  }

  return (
     <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
            <div className="backdrop-blur-xl bg-white/10 rounded-3xl shadow-[0_20px_80px_-15px_rgba(0,0,0,0.4)] border border-white/10 overflow-hidden">
                 <div className="relative h-40 bg-gradient-to-r from-blue-700/80 to-indigo-800/80 p-8 overflow-hidden">
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
                <div className="p-8">
                     <h2 className="text-white text-2xl font-semibold mb-2">Welcome!</h2>
                     <p className="text-white/70 mb-6">Sign in or create an account with your Google account to continue.</p>
                     <FirebaseErrorDisplay />
                     <button onClick={handleGoogleLogin} disabled={isLoading || !!firebase_error} className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3.5 rounded-xl shadow-lg transition-all duration-300 relative overflow-hidden" aria-label="Sign in with Google">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                        <span className="text-white">Continue with Google</span>
                    </button>
                </div>
            </div>
            <div className="text-center text-white text-xs mt-4">
                CampusConnect © {new Date().getFullYear()}
            </div>
        </div>
    </div>
  );
}
