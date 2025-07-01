"use client"

import * as React from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Icons } from "@/components/icons"
import { Fingerprint, Lock, Mail, Eye, EyeOff } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { auth } from "@/lib/firebase"
import { login, loginOrRegisterWithGoogle } from "@/app/actions"

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
  remember: z.boolean().optional(),
})

export default function AuthenticationForm() {
  const [showPassword, setShowPassword] = React.useState(false)
  const [authError, setAuthError] = React.useState<string | null>(null)
  const [isPending, startTransition] = React.useTransition();
  const { toast } = useToast()

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
  })

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setAuthError(null)
    startTransition(async () => {
      try {
        // 1. Sign in with Firebase
        await signInWithEmailAndPassword(auth, values.email, values.password);
        
        // 2. Create session in our system
        const session = await login(values.email)
        if (session.success && session.redirectTo) {
          toast({ title: "Login Successful!" })
          window.location.href = session.redirectTo;
        } else {
          // Use the error from the server action if available
          throw new Error(session.error || "Session creation failed.")
        }
      } catch (error: any) {
        if (error.code) {
            switch(error.code) {
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    setAuthError("Invalid email or password. Please try again.");
                    break;
                default:
                    setAuthError("An unknown error occurred during login.");
                    break;
            }
        } else if (error instanceof Error) {
          setAuthError(error.message)
        } else {
          setAuthError("An unknown error occurred.")
        }
      }
    })
  }

  async function handleGoogleSignIn() {
    setAuthError(null);
    startTransition(async () => {
        const provider = new GoogleAuthProvider();
        try {
          // 1. Sign in with Google via Firebase
          const result = await signInWithPopup(auth, provider);
          const googleUser = result.user;

          if (googleUser && googleUser.email && googleUser.displayName) {
            // 2. Login or Register user in our system and create session
            const sessionResult = await loginOrRegisterWithGoogle(googleUser.displayName, googleUser.email);
            if (sessionResult.success && sessionResult.redirectTo) {
              toast({ title: "Signed in with Google!" });
              window.location.href = sessionResult.redirectTo;
            } else {
              throw new Error(sessionResult.error || "Session creation failed after Google Sign-In.");
            }
          } else {
            throw new Error("Could not retrieve user information from Google.");
          }
        } catch (error: any) {
          if (error.code === 'auth/popup-closed-by-user') {
            return;
          }
          console.error("Google Sign-In Error:", error);
          if (error instanceof Error) {
            setAuthError(error.message);
          } else {
            setAuthError("Failed to sign in with Google. Please try again.");
          }
        }
    });
  }

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-br from-[hsl(var(--secondary))] to-[hsl(var(--background))] p-4">
        <div className="w-full max-w-md">
            <div className="mb-8 text-center text-foreground">
                <div className="inline-flex items-center justify-center gap-3 mb-4">
                    <div className="bg-primary/10 p-2 rounded-lg">
                        <Fingerprint className="h-8 w-8 text-primary"/>
                    </div>
                    <h1 className="text-3xl font-bold">CampusConnect</h1>
                </div>
                <h2 className="text-2xl font-semibold">Sign in to your account</h2>
            </div>

            <div className="rounded-2xl border border-border/20 bg-card/40 p-8 shadow-2xl backdrop-blur-lg">
                {authError && (
                    <Alert variant="destructive" className="mb-6 bg-red-900/40 border-red-500/30 text-red-200">
                         <AlertDescription>{authError}</AlertDescription>
                    </Alert>
                )}

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-muted-foreground">Email</FormLabel>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                        <Input 
                                            type="email" 
                                            placeholder="Enter your email" 
                                            className="bg-input border-border/50 pl-10 text-foreground placeholder:text-muted-foreground" 
                                            {...field} 
                                            disabled={isPending}
                                        />
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-muted-foreground">Password</FormLabel>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Enter your password"
                                            className="bg-input border-border/50 pl-10 pr-10 text-foreground placeholder:text-muted-foreground"
                                            {...field}
                                            disabled={isPending}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            disabled={isPending}
                                        >
                                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex items-center justify-between">
                            <FormField
                                control={form.control}
                                name="remember"
                                render={({ field }) => (
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl>
                                            <Checkbox id="remember" checked={field.value} onCheckedChange={field.onChange} className="border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:border-primary" disabled={isPending}/>
                                        </FormControl>
                                        <label htmlFor="remember" className="text-sm font-medium text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            Remember me
                                        </label>
                                    </FormItem>
                                )}
                            />
                            <Link href="#" className="text-sm text-primary/80 hover:text-primary hover:underline">
                                Forgot password?
                            </Link>
                        </div>

                        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 text-base" disabled={isPending}>
                            {isPending && <Icons.logo className="mr-2 h-4 w-4 animate-spin" />}
                            Sign in
                        </Button>
                    </form>
                </Form>
                
                <div className="my-6 flex items-center">
                    <div className="flex-grow border-t border-border/30"></div>
                    <span className="mx-4 flex-shrink text-sm text-muted-foreground">OR</span>
                    <div className="flex-grow border-t border-border/30"></div>
                </div>

                <Button variant="outline" className="w-full bg-transparent border-border/40 hover:bg-input text-foreground" onClick={handleGoogleSignIn} disabled={isPending}>
                     {isPending && <Icons.logo className="mr-2 h-4 w-4 animate-spin" />}
                    Continue with Google
                </Button>

                <p className="mt-8 text-center text-sm text-muted-foreground">
                    Don't have an account?{" "}
                    <Link href="/register" className="font-medium text-primary/80 hover:text-primary hover:underline">
                        Register here
                    </Link>
                </p>
            </div>
            <p className="mt-8 text-center text-sm text-muted-foreground">CampusConnect © 2024</p>
        </div>
    </main>
  )
}
