'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getUserByEmail } from '@/lib/data'
import type { User } from '@/types'
import { mockStudent } from '@/lib/mock-data'

export async function loginWithCredentials(email: string): Promise<{ success: boolean; error?: string; user?: User }> {
  const user = await getUserByEmail(email)

  if (user) {
    // In a real app, you'd also verify the password here.
    cookies().set('userId', user.id, { httpOnly: true, path: '/' })
    return { success: true, user }
  }

  return { success: false, error: 'No user found with that email.' }
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

export async function loginOrRegisterWithGoogle(email: string, name: string, avatar: string): Promise<{ success: boolean; user: User; isNewUser: boolean }> {
  let existingUser = await getUserByEmail(email);
  const isNewUser = !existingUser;
  
  // If user doesn't exist, we use the mockStudent template.
  // This is consistent with the previous logic for demo purposes.
  // In a real app, this would be a "create user" operation.
  const user = existingUser || mockStudent;

  // In a real app with user creation, we might update the user's name/avatar from Google.
  // For this demo, we'll just use the data from our "database".
  
  cookies().set('userId', user.id, { httpOnly: true, path: '/' });
  return { success: true, user, isNewUser };
}


export async function logout() {
  cookies().set('userId', '', { maxAge: 0 })
  redirect('/')
}
