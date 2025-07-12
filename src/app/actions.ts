
'use server'

import { cookies } from 'next/headers'
import { getDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { getCurrentUser } from '@/lib/auth'
import type { User } from '@/types'

// A small utility function to introduce a delay
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export async function createSession(uid: string, isNewUser: boolean = false) {
  const cookieStore = cookies()
  cookieStore.set('firebaseUid', uid, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 1 week
  })
  
  // This is the key fix. If it's a new user, we wait a moment
  // to ensure the Firestore user document write has time to complete
  // before we read it for the role-based redirect.
  if (isNewUser) {
    await delay(2000); // 2-second delay
  }

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
