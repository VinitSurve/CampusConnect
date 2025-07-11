
'use server';

import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import type { UserPreferences } from '@/types';

interface UpdateProfileData {
  name: string;
  email: string;
  username: string;
  mobile: string;
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
    
    // Create a complete data object for updating.
    // This ensures all existing fields are preserved and only the changed ones are updated.
    const dataToSave = {
        name: data.name,
        fullName: data.name, // Keep fullName in sync with name
        email: data.email,
        username: data.username,
        mobile: data.mobile,
    };

    await updateDoc(userRef, dataToSave);
    
    // Revalidate paths where user data is displayed
    revalidatePath('/admin/settings');
    revalidatePath('/dashboard/settings');
    revalidatePath('/admin');
    revalidatePath('/dashboard');

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
        
        // Merge with existing preferences to ensure no data is lost
        const newPreferences = {
            ...user.preferences,
            ...preferences
        };

        await updateDoc(userRef, {
            preferences: newPreferences,
        });

        // Revalidate paths where user data might affect UI
        revalidatePath('/admin/settings');
        revalidatePath('/dashboard/settings');

    } catch (error) {
        console.error("Error updating preferences:", error);
        throw new Error('Failed to update preferences. Please try again.');
    }
}
