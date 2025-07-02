
'use server'

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase';
import { collection, doc, updateDoc, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import type { Club } from '@/types';

export async function saveClub(data: Partial<Club> & { id?: string }) {
    try {
        const { id, ...clubData } = data;
        
        // Ensure tags are an array
        if (typeof clubData.tags === 'string') {
            clubData.tags = clubData.tags.split(',').map(tag => tag.trim()).filter(Boolean);
        } else if (!Array.isArray(clubData.tags)) {
            clubData.tags = [];
        }

        if (id) {
            // Update existing club
            const clubRef = doc(db, "clubs", id);
            await updateDoc(clubRef, {
                ...clubData,
                updatedAt: serverTimestamp(),
            });
        } else {
            // Create new club
            await addDoc(collection(db, "clubs"), {
                ...clubData,
                members: 0, // Default members count
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
        }

        revalidatePath("/admin/clubs");
        return { success: true };
    } catch (error) {
        console.error("Error saving club:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function deleteClub(id: string) {
    try {
        await deleteDoc(doc(db, "clubs", id));
        revalidatePath("/admin/clubs");
        return { success: true };
    } catch (error) {
        console.error("Error deleting club:", error);
        return { success: false, error: (error as Error).message };
    }
}
