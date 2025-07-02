"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { User } from "@/types"

const profileSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  email: z.string().email(),
  course: z.string().optional(),
  year: z.string().optional(),
})

const passwordSchema = z.object({
    currentPassword: z.string().min(6),
    newPassword: z.string().min(6),
    confirmPassword: z.string().min(6)
}).refine(data => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match",
    path: ["confirmPassword"],
})


export default function ProfileClientPage({ user }: { user: User }) {
  const { toast } = useToast()

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user.username,
      email: user.email,
      course: user.course,
      year: user.year,
    },
  })

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    }
  })

  function onProfileSubmit(values: z.infer<typeof profileSchema>) {
    console.log(values)
    toast({
      title: "Profile Updated",
      description: "Your personal information has been saved.",
    })
  }
  
  function onPasswordSubmit(values: z.infer<typeof passwordSchema>) {
    console.log(values)
    toast({
      title: "Password Changed",
      description: "Your password has been successfully updated.",
    })
    passwordForm.reset()
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Profile & Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and personal information.
        </p>
      </div>

        <Card>
            <CardHeader className="flex flex-row items-center gap-4">
                 <Avatar className="h-20 w-20">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle className="text-2xl">{user.name}</CardTitle>
                    <CardDescription>{user.role === 'student' || user.role === 'organiser' ? `${user.course} - Year ${user.year}` : `Faculty - ${user.department}`}</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="profile">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="profile">Personal Details</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                </TabsList>
                <TabsContent value="profile" className="pt-6">
                    <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-8 max-w-lg">
                        <FormField
                            control={profileForm.control}
                            name="username"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Username</FormLabel>
                                <FormControl>
                                    <Input placeholder="Your name" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={profileForm.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input placeholder="Your email" type="email" {...field} />
                                </FormControl>
                                <FormDescription>This is your login email.</FormDescription>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         {(user.role === 'student' || user.role === 'organiser') && (
                             <>
                                <FormField
                                    control={profileForm.control}
                                    name="course"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Course</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Your course of study" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={profileForm.control}
                                    name="year"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Year of Study</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Your current year" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </>
                         )}
                        <Button type="submit" className="bg-accent hover:bg-accent/90">Update Profile</Button>
                    </form>
                    </Form>
                </TabsContent>
                <TabsContent value="security" className="pt-6">
                    <Form {...passwordForm}>
                        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-8 max-w-lg">
                            <FormField
                                control={passwordForm.control}
                                name="currentPassword"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Current Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={passwordForm.control}
                                name="newPassword"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>New Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={passwordForm.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Confirm New Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="bg-accent hover:bg-accent/90">Change Password</Button>
                        </form>
                    </Form>
                </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    </div>
  )
}
