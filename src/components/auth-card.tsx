"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Icons } from "./icons"

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
})

const registerSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
})

export default function AuthCard() {
  const [isFlipped, setIsFlipped] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", email: "", password: "" },
  })

  const handleLogin = (values: z.infer<typeof loginSchema>) => {
    console.log("Login attempt:", values)
    toast({
      title: "Login Successful",
      description: "Welcome back!",
    })
    // In a real app, you'd handle auth state here.
    // For this demo, we'll just redirect.
    router.push("/dashboard")
  }

  const handleRegister = (values: z.infer<typeof registerSchema>) => {
    console.log("Register attempt:", values)
    toast({
      title: "Registration Successful",
      description: "Your account has been created.",
    })
    router.push("/dashboard")
  }

  const flipCard = () => setIsFlipped(!isFlipped)

  return (
    <div className="w-full max-w-md" style={{ perspective: "1000px" }}>
      <div
        className={cn("relative w-full h-[480px] transition-transform duration-700")}
        style={{ transformStyle: "preserve-3d", transform: isFlipped ? "rotateY(180deg)" : "" }}
      >
        {/* Login Form (Front) */}
        <div className="absolute w-full h-full bg-card text-card-foreground rounded-xl shadow-2xl p-8" style={{ backfaceVisibility: "hidden" }}>
          <div className="flex flex-col items-center text-center mb-6">
            <Icons.logo className="h-12 w-12 text-primary" />
            <h1 className="text-2xl font-bold mt-2 font-headline">Welcome to CampusConnect</h1>
            <p className="text-muted-foreground">Sign in to continue</p>
          </div>
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              <FormField
                control={loginForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="you@university.edu" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={loginForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-accent hover:bg-accent/90">
                Log In
              </Button>
            </form>
          </Form>
          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{" "}
            <Button variant="link" className="p-0 h-auto" onClick={flipCard}>
              Sign up
            </Button>
          </p>
        </div>

        {/* Register Form (Back) */}
        <div className="absolute w-full h-full bg-card text-card-foreground rounded-xl shadow-2xl p-8" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
          <div className="flex flex-col items-center text-center mb-6">
            <Icons.logo className="h-12 w-12 text-primary" />
            <h1 className="text-2xl font-bold mt-2 font-headline">Create an Account</h1>
            <p className="text-muted-foreground">Join the community</p>
          </div>
          <Form {...registerForm}>
            <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
              <FormField
                control={registerForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="yourusername" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={registerForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="you@university.edu" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={registerForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-accent hover:bg-accent/90">
                Register
              </Button>
            </form>
          </Form>
          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Button variant="link" className="p-0 h-auto" onClick={flipCard}>
              Log in
            </Button>
          </p>
        </div>
      </div>
    </div>
  )
}
