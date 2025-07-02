'use server'

import { cookies } from 'next/headers'
import { getDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export async function createSession(uid: string, isNewUser: boolean = false) {
  const cookieStore = cookies()
  cookieStore.set('firebaseUid', uid, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 1 week
  })

  // For a new user, always redirect to dashboard
  if (isNewUser) {
    return '/dashboard'
  }

  const userDocRef = doc(db, 'users', uid)
  const userDoc = await getDoc(userDocRef)

  if (userDoc.exists()) {
    const userData = userDoc.data()
    if (userData.role === 'faculty') {
      return '/admin'
    }
  }

  // Default redirect for existing users
  return '/dashboard'
}

export async function logout() {
  const cookieStore = cookies()
  cookieStore.set('firebaseUid', '', { maxAge: 0 })
}
