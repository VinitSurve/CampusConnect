
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

        // Create a new folder for the event gallery for both drafts and submissions if needed
        if (!googleDriveFolderId && title) {
            try {
                const { folderId, folderUrl } = await createFolder(title);
                googleDriveFolderId = folderId;
                photoAlbumUrl = folderUrl;
            } catch (folderError) {
                console.error(`Folder creation failed for "${title}":`, folderError);
                // Continue without failing - we'll just not have a folder for the gallery
            }
        }
        
        // Process media files regardless of status - for both drafts and submissions
        // Header and Logo images are uploaded to the shared ASSETS folder, not the event-specific gallery folder.
        const assetsFolderId = process.env.GOOGLE_DRIVE_ASSETS_FOLDER_ID;
        if (assetsFolderId) {
            
            // Process Event Logo
            const eventLogoFile = formData.get('eventLogo') as File;
            if (eventLogoFile && eventLogoFile.size > 0) {
                 try {
                    if (!(eventLogoFile instanceof File)) {
                        console.error("Event logo is not a valid File object:", eventLogoFile);
                        throw new Error("Invalid event logo file format");
                    }
                    // Upload to the shared assets folder
                    const eventLogoUrl = await uploadFile(eventLogoFile, assetsFolderId);
                    formData.set('eventLogoUrl', eventLogoUrl);
                } catch (uploadError: any) {
                    console.error(`Event logo upload failed for event "${title}":`, uploadError);
                    if (status === 'pending') {
                        throw new Error(`Failed to upload the event logo: ${uploadError.message}`);
                    }
                }
            }
        } else {
            console.warn("GOOGLE_DRIVE_ASSETS_FOLDER_ID is not set. Header and logo uploads will be skipped.");
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
