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
import { Checkbox } from "@/components/ui/checkbox"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Icons } from "@/components/icons"
import { Fingerprint, Lock, Mail, Eye, EyeOff } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { allUsers, mockStudent } from "@/lib/mock-data"
import { auth } from "@/lib/firebase"

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
  remember: z.boolean().optional(),
})

export default function AuthenticationPage() {
  const [showPassword, setShowPassword] = React.useState(false)
  const [loginError, setLoginError] = React.useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
  })

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setLoginError(null);
    const user = allUsers.find(u => u.email === values.email);

    if (user) {
        // In a real app, you'd also verify the password.
        // For this demo, we're just matching the email.
        try {
            const formData = new FormData();
            formData.append('userId', user.id);
            
            const response = await fetch('/api/login', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                toast({ title: "Login Successful", description: `Welcome back, ${user.name}!` });
                router.push("/dashboard");
                router.refresh(); // Ensure layout re-renders with new user state
            } else {
                setLoginError("Login failed. Please check your credentials.");
            }
        } catch (error) {
            setLoginError("An unexpected error occurred.");
        }
    } else {
      setLoginError("No user found with that email.");
    }
  }

  async function handleGoogleSignIn() {
    setLoginError(null);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;

      // Find user in our mock data by email
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
          toast({ title: "Login Successful", description: welcomeMessage });
          router.push("/dashboard");
          router.refresh(); 
      } else {
          setLoginError("Login failed. Please try again.");
      }
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      setLoginError("Failed to sign in with Google. Please try again.");
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
                <h2 className="text-2xl font-semibold">Sign in to your account</h2>
            </div>

            <div className="rounded-2xl border border-border/20 bg-card/40 p-8 shadow-2xl backdrop-blur-lg">
                {loginError && (
                    <Alert variant="destructive" className="mb-6 bg-red-900/40 border-red-500/30 text-red-200">
                         <AlertDescription>{loginError}</AlertDescription>
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
                        <div className="flex items-center justify-between">
                            <FormField
                                control={form.control}
                                name="remember"
                                render={({ field }) => (
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl>
                                            <Checkbox id="remember" checked={field.value} onCheckedChange={field.onChange} className="border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:border-primary"/>
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

                        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 text-base">
                            Sign in
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
