
'use server';

import { doc, updateDoc, getDoc } from 'firebase/firestore';
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
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
        throw new Error('User document not found.');
    }
    
    // Security check: Ensure the authenticated user is the owner of the document.
    if (userDoc.data().uid !== user.uid) {
        throw new Error('Permission denied: You can only update your own profile.');
    }

    // The data object to be saved.
    // This only contains the fields that can be edited from the settings page.
    const dataToSave = {
        name: data.name,
        fullName: data.name, // Keep fullName in sync with name for consistency
        email: data.email,
        username: data.username,
        mobile: data.mobile,
    };

    // Use updateDoc to merge the new data with the existing document.
    // This will only change the specified fields and leave others untouched.
    await updateDoc(userRef, dataToSave);
    
    // Revalidate paths where user data is displayed to reflect changes immediately
    revalidatePath('/admin/settings');
    revalidatePath('/dashboard/settings');
    revalidatePath('/admin');
    revalidatePath('/dashboard');

  } catch (error) {
    console.error("Error updating profile:", error);
    // Provide a more specific error message if possible
    if ((error as any).code === 7) {
       throw new Error(`Permission Denied: You do not have permission to perform this action.`);
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
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            throw new Error('User document not found.');
        }

        // Security check: Ensure the authenticated user is the owner of the document.
        if (userDoc.data().uid !== user.uid) {
            throw new Error('Permission denied: You can only update your own preferences.');
        }
        
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
