'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const userId = formData.get('userId') as string
  if (userId) {
    cookies().set('userId', userId)
    redirect('/dashboard')
  }
}

export async function logout() {
  cookies().set('userId', '', { maxAge: 0 })
  redirect('/')
}
