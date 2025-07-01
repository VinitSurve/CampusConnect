'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getUserByEmail, createUser } from '@/lib/data'
import type { User } from '@/types'

export async function login(email: string) {
  try {
    const user = await getUserByEmail(email);

    if (!user) {
      return { success: false, error: "User not found. Please register." };
    }
    
    cookies().set('userId', user.id, { httpOnly: true, path: '/' })

    const redirectTo = user.role === 'faculty' ? '/admin' : '/dashboard';
    return { success: true, redirectTo };
  } catch (error) {
    console.error("Login failed:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function register(name: string, email: string, role: 'student' | 'faculty') {
    try {
        const existingUser = await getUserByEmail(email);
        if (existingUser) {
            return { success: false, error: "An account with this email already exists." };
        }

        const newUser = await createUser({ name, email, role });
        
        cookies().set('userId', newUser.id, { httpOnly: true, path: '/' });

        const redirectTo = newUser.role === 'faculty' ? '/admin' : '/dashboard';
        return { success: true, redirectTo };
    } catch (error) {
        console.error("Registration failed:", error);
        const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred during registration.";
        return { success: false, error: errorMessage };
    }
}

export async function loginOrRegisterWithGoogle(name: string, email: string) {
    try {
        let user = await getUserByEmail(email);

        if (!user) {
            // New Google user, register them as a student by default
            user = await createUser({ name, email, role: 'student' });
        }

        cookies().set('userId', user.id, { httpOnly: true, path: '/' });

        const redirectTo = user.role === 'faculty' ? '/admin' : '/dashboard';
        return { success: true, redirectTo };
    } catch (error) {
        console.error("Google auth action failed:", error);
        return { success: false, error: "An unexpected error occurred." };
    }
}


export async function logout() {
  cookies().set('userId', '', { maxAge: 0 })
  redirect('/')
}
