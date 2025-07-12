
'use server';

import { collection, query, where, getDocs, addDoc, serverTimestamp, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User } from '@/types';
import { nanoid } from 'nanoid';
import { sendFacultyInviteEmail } from '@/lib/email';
import { adminDb } from '@/lib/firebase-admin';

export async function getAllFaculty(): Promise<User[]> {
  if (!db) {
    console.error("Firebase not initialized.");
    return [];
  }
  try {
    // This function should use the standard 'db' object to respect security rules.
    // Only privileged actions like creating an invite need the adminDb.
    const q = query(collection(db, "users"), where("role", "==", "faculty"));
    const querySnapshot = await getDocs(q);
    const faculty = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    faculty.sort((a, b) => (a.name).localeCompare(b.name));
    return faculty;
  } catch (error) {
    console.error("Error fetching faculty:", error);
    return [];
  }
}

export async function inviteFaculty({ name, email }: { name: string; email: string }): Promise<{ success: boolean; error?: string }> {
    // Client-side DB for checks is fine, as it respects security rules.
    if (!db) {
        return { success: false, error: "Database service is not available." };
    }
    
    try {
        // 1. Check if user with this email already exists (using client DB)
        const userQuery = query(collection(db, "users"), where("email", "==", email), limit(1));
        const userSnapshot = await getDocs(userQuery);
        if (!userSnapshot.empty) {
            return { success: false, error: "A user with this email address already exists." };
        }

        // 2. Check for an existing, unexpired invitation (using client DB)
        const inviteQuery = query(
            collection(db, "facultyInvitations"), 
            where("email", "==", email)
        );
        const inviteSnapshot = await getDocs(inviteQuery);
        const now = new Date();
        const existingValidInvite = inviteSnapshot.docs.find(doc => {
            const data = doc.data();
            return data.expiresAt.toDate() > now && !data.used;
        });
        
        if (existingValidInvite) {
            return { success: false, error: "An active invitation for this email already exists." };
        }

        // 3. Create a new invitation using the Admin SDK to bypass security rules
        const token = nanoid(32);
        const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24-hour expiration

        await adminDb.collection("facultyInvitations").add({
            name,
            email,
            token,
            role: 'faculty',
            expiresAt: expiresAt, // Admin SDK uses JS Date objects
            createdAt: new Date(), // Admin SDK uses JS Date objects
            used: false,
        });

        // 4. Send the invitation email
        const inviteLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/invite/${token}`;
        await sendFacultyInviteEmail({ name, email, inviteLink });
        
        return { success: true };

    } catch (error: any) {
        console.error("Error inviting faculty:", error);
        return { success: false, error: error.message || "An unknown error occurred." };
    }
}
