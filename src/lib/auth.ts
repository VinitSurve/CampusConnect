import { cookies } from 'next/headers'
import type { User } from '@/types'
import { getDoc, doc } from 'firebase/firestore'
import { db } from './firebase'


export async function getCurrentUser(): Promise<User | null> {
  const uid = cookies().get('firebaseUid')?.value
  if (!uid) {
    return null
  }
  
  const userDocRef = doc(db, "users", uid);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) {
    cookies().set('firebaseUid', '', { maxAge: 0 })
    return null;
  }
  
  const data = userDoc.data();
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
  } as User;
}
