
'use server'

import { cookies } from 'next/headers'
import { getDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { getCurrentUser } from '@/lib/auth'
import type { User } from '@/types'

export async function createSession(uid: string, isNewUser: boolean = false) {
  const cookieStore = cookies()
  cookieStore.set('firebaseUid', uid, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 1 week
  })

  // The redirect to /setup for new users has been removed.

  const userDocRef = doc(db, 'users', uid)
  const userDoc = await getDoc(userDocRef)

  if (userDoc.exists()) {
    const userData = userDoc.data()
    if (userData.role === 'faculty') {
      return '/admin'
    }
  }

  // Default redirect for all non-faculty users to the canonical events page.
  return '/dashboard/events'
}

export async function logout() {
  const cookieStore = cookies()
  cookieStore.set('firebaseUid', '', { maxAge: 0 })
}

export async function getAuthedUser(): Promise<User | null> {
  const user = await getCurrentUser();
  return user;
}
