
'use server';

import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import type { UserPreferences } from '@/types';

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
      fullName: data.name,
      email: data.email,
      preferences: user.preferences || {}, // Ensure preferences object exists
    });
    
    revalidatePath('/admin/settings');
    revalidatePath('/dashboard/settings');

  } catch (error) {
    console.error("Error updating profile:", error);
    throw new Error('Failed to update profile. Please try again.');
  }
}

export async function updateUserPreferences(preferences: Partial<UserPreferences>) {
    const user = await getCurrentUser();

    if (!user) {
        throw new Error('You must be logged in to update your preferences.');
    }

    try {
        const userRef = doc(db, 'users', user.id);
        await updateDoc(userRef, {
            preferences: preferences,
        });

        // Revalidate paths where user data might affect UI
        revalidatePath('/admin/settings');
        revalidatePath('/dashboard/settings');

    } catch (error) {
        console.error("Error updating preferences:", error);
        throw new Error('Failed to update preferences. Please try again.');
    }
}
