
'use server'

import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createFolder, uploadFile } from "@/lib/drive";
import type { Club } from "@/types";

interface UpdateClubResult {
    success: boolean;
    error?: string;
    updatedClubData?: Partial<Club>;
}

// This server action handles updating the club data, including media uploads.
export async function updateClubAction(
    clubId: string,
    currentClubData: Club,
    formData: FormData
): Promise<UpdateClubResult> {
    try {
        let googleDriveFolderId = currentClubData.googleDriveFolderId;
        
        // 1. Create a Google Drive folder for the club if it doesn't exist
        if (!googleDriveFolderId) {
            const { folderId } = await createFolder(`Club - ${currentClubData.name}`);
            googleDriveFolderId = folderId;
        }

        // 2. Handle cover image upload
        let imageUrl = currentClubData.image;
        const imageFile = formData.get('image') as File;
        if (imageFile && imageFile.size > 0 && googleDriveFolderId) {
            imageUrl = await uploadFile(imageFile, googleDriveFolderId);
        }

        // 3. Handle gallery image uploads
        const galleryFiles = formData.getAll('gallery') as File[];
        let newGalleryUrls: string[] = [];
        if (galleryFiles.length > 0 && googleDriveFolderId) {
            newGalleryUrls = await Promise.all(
                galleryFiles.map(file => uploadFile(file, googleDriveFolderId))
            );
        }

        // 4. Consolidate all data to be saved to Firestore
        const existingGallery = currentClubData.gallery || [];
        const galleryUrlsToDelete = JSON.parse(formData.get('galleryUrlsToDelete') as string || '[]') as string[];
        const finalGallery = existingGallery.filter(url => !galleryUrlsToDelete.includes(url)).concat(newGalleryUrls);

        const dataToUpdate: Partial<Club> = {
            name: formData.get('name') as string,
            description: formData.get('description') as string,
            image: imageUrl,
            socialLinks: {
                website: formData.get('socialLinks.website') as string,
                facebook: formData.get('socialLinks.facebook') as string,
                twitter: formData.get('socialLinks.twitter') as string,
                instagram: formData.get('socialLinks.instagram') as string,
            },
            gallery: finalGallery,
            googleDriveFolderId: googleDriveFolderId,
            updatedAt: serverTimestamp() as any, // Firestore will convert this
        };

        // 5. Update the Firestore document
        const clubRef = doc(db, "clubs", clubId);
        await updateDoc(clubRef, dataToUpdate);

        return {
            success: true,
            updatedClubData: {
                ...dataToUpdate,
                updatedAt: new Date().toISOString() // Return a serializable date
            }
        };

    } catch (error) {
        console.error("Error updating club:", error);
        return { success: false, error: (error as Error).message };
    }
}
