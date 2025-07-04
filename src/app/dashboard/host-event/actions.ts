
'use server'

import { createFolder, uploadFile } from "@/lib/drive";

// This is a data preparation function that runs on the server.
// It handles the secure file uploads to Google Drive.
// It DOES NOT write to Firestore, to avoid permission errors.
export async function handleEventMediaUpload(formData: FormData, existingFolderId?: string) {
    try {
        const title = formData.get('title') as string;
        let googleDriveFolderId = existingFolderId;

        // Create a new folder only if one doesn't already exist and a title is present
        if (!googleDriveFolderId && title) {
            googleDriveFolderId = await createFolder(title);
        }
        
        const rawHeaderUrl = formData.get('headerImageUrl');
        const rawLogoUrl = formData.get('eventLogoUrl');

        let headerImageUrl: string | undefined = typeof rawHeaderUrl === 'string' ? rawHeaderUrl : undefined;
        let eventLogoUrl: string | undefined = typeof rawLogoUrl === 'string' ? rawLogoUrl : undefined;


        if (googleDriveFolderId) {
            const headerImageFile = formData.get('headerImage') as File;
            if (headerImageFile && headerImageFile.size > 0) {
                headerImageUrl = await uploadFile(headerImageFile, googleDriveFolderId);
            }

            const eventLogoFile = formData.get('eventLogo') as File;
            if (eventLogoFile && eventLogoFile.size > 0) {
                eventLogoUrl = await uploadFile(eventLogoFile, googleDriveFolderId);
            }
        }
        
        const whatYouWillLearnRaw = formData.get('whatYouWillLearn') as string;
        const whatYouWillLearn = whatYouWillLearnRaw.split('\n').map(s => s.replace(/^-/, '').trim()).filter(Boolean).join('\n');
        
        const tagsRaw = formData.get('tags') as string || '';
        const tags = tagsRaw.split(',').map(tag => tag.trim()).filter(Boolean);

        // Return a clean data object for the client to save.
        return {
            success: true,
            data: {
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
                headerImage: headerImageUrl,
                eventLogo: eventLogoUrl,
                googleDriveFolderId: googleDriveFolderId,
                tags: tags,
                allowExternals: formData.get('allowExternals') === 'true',
            }
        };

    } catch (error) {
        console.error("Error handling event media upload:", error);
        return { success: false, error: (error as Error).message };
    }
}
