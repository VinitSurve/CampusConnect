"use client"

import * as React from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { GoogleAuthProvider, createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Icons } from "@/components/icons"
import { Fingerprint, Lock, Mail, Eye, EyeOff, User } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { auth } from "@/lib/firebase"
import { createSession } from "@/app/actions"

const registerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string().min(6),
  role: z.enum(["student", "faculty"], { required_error: "You must select a role." })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function RegisterForm() {
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
  const [authError, setAuthError] = React.useState<string | null>(null)
  const [isPending, startTransition] = React.useTransition();
  const { toast } = useToast()
  const router = useRouter()

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  async function onSubmit(values: z.infer<typeof registerSchema>) {
    setAuthError(null);
    startTransition(async () => {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
        if (userCredential.user && userCredential.user.email) {
            const session = await createSession(userCredential.user.email)
            if (session.success) {
              toast({ title: "Registration Successful!", description: "Welcome to CampusConnect." });
              if (session.role === 'faculty') {
                router.push('/admin');
              } else {
                router.push('/dashboard');
              }
            } else {
              throw new Error("Session creation failed after registration.")
            }
        } else {
            throw new Error("Could not retrieve user information after registration.")
        }
      } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
            setAuthError("An account with this email already exists. Please sign in.");
        } else if (error instanceof Error) {
            setAuthError(error.message);
        } else {
            setAuthError("An unknown error occurred during registration.");
        }
      }
    });
  }

  async function handleGoogleSignIn() {
    setAuthError(null);
    startTransition(async () => {
        const provider = new GoogleAuthProvider();
        try {
          const result = await signInWithPopup(auth, provider);
          const googleUser = result.user;

          if (googleUser && googleUser.email) {
            const session = await createSession(googleUser.email);
            if (session.success) {
              toast({ title: "Signed in with Google!" });
              if (session.role === 'faculty') {
                router.push('/admin')
              } else {
                router.push('/dashboard')
              }
            } else {
              throw new Error("Session creation failed after Google Sign-In.");
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
                <h2 className="text-2xl font-semibold">Create a new account</h2>
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
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-muted-foreground">Full Name</FormLabel>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                        <Input 
                                            placeholder="Enter your full name" 
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
                        <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-muted-foreground">Confirm Password</FormLabel>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                        <Input
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="Confirm your password"
                                            className="bg-input border-border/50 pl-10 pr-10 text-foreground placeholder:text-muted-foreground"
                                            {...field}
                                            disabled={isPending}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            disabled={isPending}
                                        >
                                            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                <FormLabel className="text-muted-foreground">I am a...</FormLabel>
                                <FormControl>
                                    <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="flex items-center space-x-4"
                                    >
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl>
                                        <RadioGroupItem value="student" id="student" disabled={isPending}/>
                                        </FormControl>
                                        <FormLabel htmlFor="student" className="font-normal text-muted-foreground">Student</FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl>
                                        <RadioGroupItem value="faculty" id="faculty" disabled={isPending}/>
                                        </FormControl>
                                        <FormLabel htmlFor="faculty" className="font-normal text-muted-foreground">Faculty</FormLabel>
                                    </FormItem>
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />

                        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 text-base" disabled={isPending}>
                             {isPending && <Icons.logo className="mr-2 h-4 w-4 animate-spin" />}
                            Create account
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
                    Already have an account?{" "}
                    <Link href="/" className="font-medium text-primary/80 hover:text-primary hover:underline">
                        Sign in
                    </Link>
                </p>
            </div>
            <p className="mt-8 text-center text-sm text-muted-foreground">CampusConnect © 2024</p>
        </div>
    </main>
  )
}
