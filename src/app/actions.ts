'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function createSession(uid: string) {
  cookies().set('firebaseUid', uid, { httpOnly: true, path: '/' })
}

export async function logout() {
  cookies().set('firebaseUid', '', { maxAge: 0 })
  redirect('/')
}
