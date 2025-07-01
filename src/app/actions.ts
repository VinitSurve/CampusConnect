'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getUserByEmail } from '@/lib/data'
import type { User } from '@/types'
import { mockStudent } from '@/lib/mock-data'

export async function loginWithCredentials(email: string) {
  const user = await getUserByEmail(email)

  if (!user) {
    throw new Error('Login failed. Please check your credentials.')
  }

  // In a real app, you'd also verify the password here.
  cookies().set('userId', user.id, { httpOnly: true, path: '/' })
  
  if (user.role === 'faculty') {
    redirect('/admin')
  } else {
    redirect('/dashboard')
  }
}

export async function registerWithCredentials(values: any): Promise<{success: boolean, error?: string}> {
    const userExists = await getUserByEmail(values.email);

    if (userExists) {
        return { success: false, error: "An account with this email already exists. Please sign in." };
    }
    
    // In a real app, you would create the user here and persist it.
    // Since we can't write to our mock data, we'll just simulate success.
    console.log("New user would be registered:", values);
    return { success: true }
}

export async function loginOrRegisterWithGoogle(email: string, name: string, avatar: string) {
  const existingUser = await getUserByEmail(email);

  if (!existingUser) {
    // With a real database, we would create a new user here.
    // With static mock data, we can't create a new user that will be found on the next request.
    // Throwing an error is clearer than the previous buggy behavior of mapping all new users to a single mock student.
    throw new Error("This Google account is not in our system. Please register with email and password first.");
  }

  // If user exists, log them in.
  cookies().set('userId', existingUser.id, { httpOnly: true, path: '/' });
  
  if (existingUser.role === 'faculty') {
    redirect('/admin');
  } else {
    redirect('/dashboard');
  }
}


export async function logout() {
  cookies().set('userId', '', { maxAge: 0 })
  redirect('/')
}
