
'use server'

import { createFolder, uploadFile } from "@/lib/drive";
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import type { Event } from '@/types';


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
            }
        };

    } catch (error) {
        console.error("Error handling event media upload:", error);
        return { success: false, error: (error as Error).message };
    }
}


const locationIdToNameMap: { [key: string]: string } = {
  'lab401': 'Lab 401',
  'lab402': 'Lab 402',
  'lab503': 'Lab 503',
  'seminar': 'Seminar Hall'
};

export async function createFacultyEvent(eventData: any) {
    try {
        if (!db) {
            throw new Error("Database not initialized");
        }
        if (!eventData.date) {
            throw new Error("Cannot create an event without a date.");
        }

        const startTime = eventData.time || '09:00';
        const endTime = eventData.endTime || (() => {
            const [hour, minute] = startTime.split(':').map(Number);
            const endHour = hour + 1;
            return `${String(endHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        })();
        
        const locationName = locationIdToNameMap[eventData.location] || eventData.location;

        const newEvent: Omit<Event, 'id'> = {
            title: eventData.title,
            description: eventData.description.substring(0, 100) + (eventData.description.length > 100 ? '...' : ''),
            longDescription: eventData.description,
            date: eventData.date,
            time: startTime,
            endTime: endTime,
            location: locationName,
            organizer: eventData.clubName, // For faculty, this is their name
            category: eventData.category,
            image: eventData.headerImage || 'https://placehold.co/600x400.png',
            headerImage: eventData.headerImage,
            eventLogo: eventData.eventLogo,
            attendees: 0,
            capacity: 100,
            registrationLink: eventData.registrationLink || '#',
            status: 'upcoming',
            gallery: [],
            tags: [...(eventData.tags || []), eventData.category].filter((value:any, index:any, self:any) => self.indexOf(value) === index),
            targetAudience: eventData.targetAudience,
            keySpeakers: eventData.keySpeakers,
            equipmentNeeds: eventData.equipmentNeeds,
            budgetDetails: eventData.budgetDetails,
            whatYouWillLearn: eventData.whatYouWillLearn,
            googleDriveFolderId: eventData.googleDriveFolderId,
            createdBy: eventData.createdBy,
        };

        await addDoc(collection(db, "events"), newEvent);

        if (eventData.location === 'seminar') {
            const newBooking = {
                title: eventData.title,
                organizer: eventData.clubName,
                date: eventData.date,
                startTime: startTime,
                endTime: endTime,
            };

            await addDoc(collection(db, "seminarBookings"), {
                ...newBooking,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        }
        
        // Revalidate all relevant paths
        revalidatePath("/admin");
        revalidatePath("/admin/calendar");
        revalidatePath("/admin/seminar-hall");
        revalidatePath("/dashboard");
        revalidatePath("/dashboard/calendar");
        revalidatePath("/dashboard/events");
        revalidatePath("/");

        return { success: true };

    } catch (error) {
        console.error("Error creating faculty event:", error);
        return { success: false, error: (error as Error).message };
    }
}
