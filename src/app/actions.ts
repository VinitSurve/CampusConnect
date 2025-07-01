'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getUserByEmail } from '@/lib/data'
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

export async function registerWithCredentials(values: any) {
    const userExists = await getUserByEmail(values.email);

    if (userExists) {
        throw new Error("An account with this email already exists. Please sign in.");
    }
    
    // In a real app, you would create the user here and persist it.
    // Since we are using static mock data, we log in the user as a default student
    // to demonstrate a successful registration flow.
    console.log("New user registered, logging in as mock student:", values);
    cookies().set('userId', mockStudent.id, { httpOnly: true, path: '/' });
    redirect('/dashboard');
}

export async function loginOrRegisterWithGoogle(email: string, name: string, avatar: string) {
  let user = await getUserByEmail(email);

  if (!user) {
    // With a real database, we would create a new user here.
    // Since we are using static mock data, we will log them in as a default student.
    user = mockStudent;
  }

  // If user exists, log them in.
  cookies().set('userId', user.id, { httpOnly: true, path: '/' });
  
  if (user.role === 'faculty') {
    redirect('/admin');
  } else {
    redirect('/dashboard');
  }
}


export async function logout() {
  cookies().set('userId', '', { maxAge: 0 })
  redirect('/')
}
