
'use server';

import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

interface UpdateProfileData {
  name: string;
  email: string;
}

export async function updateUserProfile(data: UpdateProfileData) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('You must be logged in to update your profile.');
  }

  if (!data.name || !data.email) {
    throw new Error('Name and email cannot be empty.');
  }

  try {
    const userRef = doc(db, 'users', user.id);
    await updateDoc(userRef, {
      name: data.name,
      fullName: data.name, // Ensure both name fields are updated
      email: data.email,
    });
    
    // Revalidate paths where user data is displayed to reflect changes immediately
    revalidatePath('/admin/settings');
    revalidatePath('/dashboard/settings');

  } catch (error) {
    console.error("Error updating profile:", error);
    throw new Error('Failed to update profile. Please try again.');
  }
}
