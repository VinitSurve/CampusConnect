
'use server'

import { createFolder, uploadFile } from "@/lib/drive";
import type { EventProposal } from "@/types";

// This is a data preparation function that runs on the server.
// It handles the secure file uploads to Google Drive.
// It DOES NOT write to Firestore, to avoid permission errors.
export async function handleEventMediaUpload(formData: FormData, existingFolderId?: string, status?: 'draft' | 'pending') {
    try {
        const title = formData.get('title') as string;
        let googleDriveFolderId = existingFolderId;
        let photoAlbumUrl = formData.get('photoAlbumUrl') as string; // Keep existing URL if it's there

        // Create a new folder only if one doesn't already exist and a title is present
        if (!googleDriveFolderId && title) {
            const { folderId, folderUrl } = await createFolder(title);
            googleDriveFolderId = folderId; // This is the key fix - use the newly created ID immediately
            photoAlbumUrl = folderUrl;
        }
        
        // Only perform file uploads if we are submitting for review, not just saving a draft.
        if (status === 'pending' && googleDriveFolderId) {
            // Process Header and Logo
            const headerImageFile = formData.get('headerImage') as File;
            if (headerImageFile && headerImageFile.size > 0) {
                try {
                    formData.set('headerImageUrl', await uploadFile(headerImageFile, googleDriveFolderId));
                } catch (uploadError) {
                    console.error(`Header image upload failed for event "${title}":`, uploadError);
                    throw new Error(`Failed to upload the header image. Please try again or use a different image.`);
                }
            }

            const eventLogoFile = formData.get('eventLogo') as File;
            if (eventLogoFile && eventLogoFile.size > 0) {
                 try {
                    formData.set('eventLogoUrl', await uploadFile(eventLogoFile, googleDriveFolderId));
                } catch (uploadError) {
                    console.error(`Event logo upload failed for event "${title}":`, uploadError);
                    throw new Error(`Failed to upload the event logo. Please try again or use a different image.`);
                }
            }
        }
        
        const whatYouWillLearnRaw = formData.get('whatYouWillLearn') as string;
        const whatYouWillLearn = whatYouWillLearnRaw.split('\n').map(s => s.replace(/^-/, '').trim()).filter(Boolean).join('\n');
        
        const tagsRaw = formData.get('tags') as string || '';
        const tags = tagsRaw.split(',').map(tag => tag.trim()).filter(Boolean);

        // Return a clean data object for the client to save.
        const data: Partial<EventProposal> = {
            title: title,
            description: formData.get('description') as string,
            whatYouWillLearn: whatYouWillLearn,
            targetAudience: formData.getAll('targetAudience') as string[],
            keySpeakers: formData.get('keySpeakers') as string,
            equipmentNeeds: formData.get('equipmentNeeds') as string,
            budgetDetails: formData.get('budgetDetails') as string,
            location: formData.get('location') as string,
            category: formData.get('category') as string,
            registrationLink: formData.get('registrationLink') as string,
            clubId: formData.get('clubId') as string,
            clubName: formData.get('clubName') as string,
            date: formData.get('date') as string,
            time: formData.get('time') as string,
            endTime: formData.get('endTime') as string,
            headerImage: formData.get('headerImageUrl') as string || undefined,
            eventLogo: formData.get('eventLogoUrl') as string || undefined,
            googleDriveFolderId: googleDriveFolderId,
            photoAlbumUrl: photoAlbumUrl,
            tags: tags,
            allowExternals: formData.get('allowExternals') === 'true',
            facultyAdvisorIds: formData.getAll('facultyAdvisorIds') as string[],
        };
        
        return {
            success: true,
            data
        };

    } catch (error) {
        console.error("Error handling event media upload:", error);
        return { success: false, error: (error as Error).message };
    }
}
