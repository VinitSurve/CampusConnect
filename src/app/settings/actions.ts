
'use server';

import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import type { UserPreferences } from '@/types';

// This is the data structure the form will send.
interface UpdateProfileData {
  name: string;
  username: string;
  mobile: string;
}

export async function updateUserProfile(data: UpdateProfileData) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('You must be logged in to update your profile.');
  }
  
  // This is the crucial fix. We create a clean object with ONLY the fields
  // that a user is allowed to edit according to the security rules.
  // We explicitly DO NOT include the 'role' or 'email' fields.
  const dataToSave = {
    name: data.name,
    fullName: data.name, // Keep fullName in sync with name
    username: data.username,
    mobile: data.mobile,
  };

  try {
    const userRef = doc(db, 'users', user.id);
    
    // Use the clean dataToSave object for the update.
    // This will merge with the existing document and only change these specific fields.
    await updateDoc(userRef, dataToSave);
    
    // Revalidate paths where user data is displayed to reflect changes immediately
    revalidatePath('/admin/settings');
    revalidatePath('/dashboard/settings');
    revalidatePath('/admin');
    revalidatePath('/dashboard');

  } catch (error) {
    console.error("Error updating profile:", error);
    if ((error as any).code === 'permission-denied' || (error as any).code === 7) {
       throw new Error(`Permission Denied: You do not have permission to perform this action. Your security rules may be preventing this update.`);
    }
    const errorMessage = (error instanceof Error) ? error.message : 'An unknown error occurred.';
    throw new Error(`Failed to update profile. ${errorMessage}`);
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
