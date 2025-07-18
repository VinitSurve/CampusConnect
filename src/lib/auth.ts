
import { cookies } from 'next/headers'
import type { User, UserPreferences } from '@/types'
import { getDoc, doc } from 'firebase/firestore'
import { db } from './firebase'

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = cookies()
  const uid = cookieStore.get('firebaseUid')?.value
  
  if (!uid) {
    return null
  }
  
  if (!db) {
    // Firebase is not initialized, cannot fetch user.
    // This happens if credentials are not in .env
    return null;
  }
  
  const userDocRef = doc(db, "users", uid);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) {
    // Cannot set cookie here in a read-only context.
    // Invalid cookies will be overwritten on next successful login.
    return null;
  }
  
  const data = userDoc.data();
  const defaultPreferences: UserPreferences = {
    emailNotifications: true,
    weeklyDigest: false,
    clubUpdates: true,
    dataAnalytics: false,
    personalization: false,
  };

  // Map Firestore data to our User type, providing defaults for compatibility
  return {
    id: userDoc.id,
    uid: userDoc.id,
    name: data.fullName || data.name || "User",
    fullName: data.fullName,
    email: data.email,
    role: data.role || 'student',
    course: data.course,
    year: data.year,
    username: data.username,
    mobile: data.mobile,
    avatar: data.avatar || 'https://placehold.co/100x100.png',
    department: data.department,
    interests: data.interests || [],
    preferences: { ...defaultPreferences, ...data.preferences },
  } as User;
}
