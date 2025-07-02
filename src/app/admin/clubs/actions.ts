
'use server'

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase';
import { collection, doc, updateDoc, addDoc, deleteDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import type { Club } from '@/types';
import { getCurrentUser } from '@/lib/auth';

export async function saveClub(data: Partial<Club> & { id?: string }) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== 'faculty') {
            return { success: false, error: "Permission Denied: User is not a faculty member." };
        }

        const { id, ...clubData } = data;
        
        if (!clubData.leadId) {
            return { success: false, error: "A club lead must be selected." };
        }

        const studentDocRef = doc(db, "users", clubData.leadId);
        const studentDoc = await getDoc(studentDocRef);

        if (!studentDoc.exists()) {
            return { success: false, error: "Selected club lead could not be found." };
        }
        const leadContactEmail = studentDoc.data().email;
         if (!leadContactEmail) {
            return { success: false, error: "The selected club lead does not have an email address." };
        }

        const dataToSave = {
            name: clubData.name || '',
            description: clubData.description || '',
            image: 'https://placehold.co/600x400.png',
            tags: [],
            contactEmail: leadContactEmail,
            facultyAdvisor: clubData.facultyAdvisor || '',
            leadId: clubData.leadId,
        };

        if (id) {
            // Update existing club
            const clubRef = doc(db, "clubs", id);
            await updateDoc(clubRef, {
                ...dataToSave,
                updatedAt: serverTimestamp(),
            });
        } else {
            // Create new club
            await addDoc(collection(db, "clubs"), {
                ...dataToSave,
                members: 0, // Default members count
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                createdBy: currentUser.uid,
            });
        }

        revalidatePath("/admin/clubs");
        return { success: true };
    } catch (error) {
        console.error("Error saving club:", error);
         if (error instanceof Error && (error.message.includes("permission") || error.message.includes("denied"))) {
             return { success: false, error: "Firestore Security Rules denied the operation. Please ensure faculty members have write permissions for the 'clubs' collection." };
        }
        return { success: false, error: (error as Error).message };
    }
}

export async function deleteClub(id: string) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== 'faculty') {
            return { success: false, error: "Permission Denied: User is not a faculty member." };
        }
        await deleteDoc(doc(db, "clubs", id));
        revalidatePath("/admin/clubs");
        return { success: true };
    } catch (error) {
        console.error("Error deleting club:", error);
        return { success: false, error: (error as Error).message };
    }
}
