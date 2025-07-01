"use client"

import * as React from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Icons } from "@/components/icons"
import { Fingerprint, Lock, Mail, Eye, EyeOff, User } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { allUsers, mockStudent } from "@/lib/mock-data"
import { auth } from "@/lib/firebase"

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

export default function RegisterPage() {
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
  const [authError, setAuthError] = React.useState<string | null>(null)
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
    const userExists = allUsers.some(u => u.email === values.email);

    if (userExists) {
        setAuthError("An account with this email already exists. Please sign in.");
    } else {
        // In a real app, you would create the user here.
        // For this demo, we'll just simulate a successful registration.
        console.log("New user registered:", values);
        toast({ title: "Registration Successful!", description: "You can now sign in with your credentials." });
        router.push("/");
    }
  }

  async function handleGoogleSignIn() {
    setAuthError(null);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;

      const existingUser = allUsers.find(u => u.email === googleUser.email);
      const user = existingUser || mockStudent;
      const isNewUser = !existingUser;
      
      const formData = new FormData();
      formData.append('userId', user.id);
      
      const response = await fetch('/api/login', {
          method: 'POST',
          body: formData
      });

      if (response.ok) {
        const welcomeMessage = isNewUser
          ? `Welcome, ${googleUser.displayName}!` 
          : `Welcome back, ${user.name}!`;
        toast({ title: "Authentication Successful", description: welcomeMessage });
        if (user.role === 'faculty') {
          router.push("/admin");
        } else {
          router.push("/dashboard");
        }
        router.refresh(); 
      } else {
        setAuthError("Authentication failed. Please try again.");
      }
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      setAuthError("Failed to register with Google. Please try again.");
    }
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
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
                                        <RadioGroupItem value="student" id="student" />
                                        </FormControl>
                                        <FormLabel htmlFor="student" className="font-normal text-muted-foreground">Student</FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl>
                                        <RadioGroupItem value="faculty" id="faculty" />
                                        </FormControl>
                                        <FormLabel htmlFor="faculty" className="font-normal text-muted-foreground">Faculty</FormLabel>
                                    </FormItem>
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />

                        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 text-base">
                            Create account
                        </Button>
                    </form>
                </Form>
                
                <div className="my-6 flex items-center">
                    <div className="flex-grow border-t border-border/30"></div>
                    <span className="mx-4 flex-shrink text-sm text-muted-foreground">OR</span>
                    <div className="flex-grow border-t border-border/30"></div>
                </div>

                <Button variant="outline" className="w-full bg-transparent border-border/40 hover:bg-input text-foreground" onClick={handleGoogleSignIn}>
                    <Icons.google className="mr-2 h-5 w-5" />
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
