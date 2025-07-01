'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getUserByEmail } from '@/lib/data'
import { mockStudent } from '@/lib/mock-data'
import type { User } from '@/types'

export async function createSession(email: string) {
  let user: User | undefined = await getUserByEmail(email);

  // If user does not exist in our mock data, it's a new registration.
  // Log them in as the default student to demonstrate the flow.
  if (!user) {
    console.log(`New user registered with email: ${email}. Logging in as mock student.`)
    user = mockStudent;
  }
  
  // Set the session cookie
  cookies().set('userId', user.id, { httpOnly: true, path: '/' })

  // Redirect based on role
  if (user.role === 'faculty') {
    redirect('/admin')
  } else {
    redirect('/dashboard')
  }
}


export async function logout() {
  cookies().set('userId', '', { maxAge: 0 })
  redirect('/')
}
