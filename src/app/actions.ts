'use server'

import { cookies } from 'next/headers'
import { getDoc, doc } from 'firebase/firestore'
import { db } from './lib/firebase'

export async function createSession(uid: string, isNewUser: boolean = false) {
  const cookieStore = cookies()
  cookieStore.set('firebaseUid', uid, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7 // 1 week
  })

  // For new users, we don't need to look up their role, it's always 'student'
  if (isNewUser) {
    return '/dashboard'
  }

  // For existing users, determine redirect path based on their role
  const userDocRef = doc(db, "users", uid);
  const userDoc = await userDocRef.get();

  if (userDoc.exists()) {
    const userData = userDoc.data();
    if (userData.role === 'faculty') {
      return '/admin'
    }
  }
  
  // Default redirect for students or if doc doesn't exist (should not happen for existing users)
  return '/dashboard'
}

export async function logout() {
  const cookieStore = cookies()
  cookieStore.set('firebaseUid', '', { maxAge: 0 })
}

    