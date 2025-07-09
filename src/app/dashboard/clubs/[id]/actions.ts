
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase';
import { doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { getCurrentUser } from '@/lib/auth';
import { sendWelcomeEmail } from '@/lib/email';
import type { Club } from '@/types';

export async function getMembershipStatus(clubId: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  try {
    const memberDocRef = doc(db, 'clubs', clubId, 'members', user.uid);
    const docSnap = await getDoc(memberDocRef);
    return docSnap.exists();
  } catch (error) {
    console.error("Error checking membership status:", error);
    return false;
  }
}

export async function joinClub(clubId: string): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'You must be logged in to join a club.' };
  }

  try {
    const clubRef = doc(db, 'clubs', clubId);
    const memberRef = doc(db, 'clubs', clubId, 'members', user.uid);

    let clubName = 'the club';

    await runTransaction(db, async (transaction) => {
      const clubDoc = await transaction.get(clubRef);
      if (!clubDoc.exists()) {
        throw new Error('Club not found.');
      }
      
      clubName = clubDoc.data().name;

      const memberDoc = await transaction.get(memberRef);
      if (memberDoc.exists()) {
        throw new Error('You are already a member of this club.');
      }

      // Add user to the members subcollection
      transaction.set(memberRef, {
        userId: user.uid,
        name: user.name,
        email: user.email,
        avatar: user.avatar || '',
        joinedAt: serverTimestamp(),
      });

      // Increment member count on the main club document
      transaction.update(clubRef, {
        members: (clubDoc.data().members || 0) + 1,
      });
    });

    // Send welcome email after the transaction is successful
    await sendWelcomeEmail({
        toEmail: user.email,
        userName: user.name,
        clubName: clubName
    });

    revalidatePath(`/dashboard/clubs/${clubId}`);
    return { success: true };

  } catch (error) {
    console.error('Error joining club:', error);
    return { success: false, error: (error as Error).message };
  }
}
