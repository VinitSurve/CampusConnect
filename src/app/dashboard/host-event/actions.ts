
'use server'

import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createFolder, uploadFile } from "@/lib/drive";

export async function createEventProposalAction(formData: FormData) {
    const user = await getCurrentUser();
    if (!user) {
        throw new Error("You must be logged in to create an event proposal.");
    }

    const title = formData.get('title') as string;
    if (!title) {
        throw new Error("Event title is required.");
    }

    let googleDriveFolderId;
    try {
        // Create a folder in Google Drive for the event media
        googleDriveFolderId = await createFolder(title);

        let headerImageUrl: string | undefined = undefined;
        const headerImageFile = formData.get('headerImage') as File;
        if (headerImageFile && headerImageFile.size > 0) {
            headerImageUrl = await uploadFile(headerImageFile, googleDriveFolderId);
        }
        
        let eventLogoUrl: string | undefined = undefined;
        const eventLogoFile = formData.get('eventLogo') as File;
        if (eventLogoFile && eventLogoFile.size > 0) {
            eventLogoUrl = await uploadFile(eventLogoFile, googleDriveFolderId);
        }

        const proposalData = {
            title: title,
            description: formData.get('description') as string,
            whatYouWillLearn: formData.get('whatYouWillLearn') as string,
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
            createdBy: user.uid,
            creatorEmail: user.email ?? '',
            status: "pending" as const,
            createdAt: serverTimestamp(),
            headerImage: headerImageUrl,
            eventLogo: eventLogoUrl,
            googleDriveFolderId: googleDriveFolderId,
        };
        
        if (!proposalData.location || !proposalData.category || !proposalData.description || !proposalData.date || !proposalData.time) {
            throw new Error("Please fill all required fields.");
        }

        await addDoc(collection(db, "eventRequests"), proposalData);

        revalidatePath("/dashboard/events");
        redirect("/dashboard/events");

    } catch (error) {
        // If something fails (e.g., Google Drive upload), we should ideally clean up the created folder.
        // For simplicity, we'll log the error. In a production app, you might add cleanup logic here.
        console.error("Failed to create event proposal:", error);
        if (googleDriveFolderId) {
            // Attempt to clean up the created folder.
            // await deleteFolder(googleDriveFolderId);
        }
        // Re-throw or return an error message to the user
        throw new Error(`An error occurred: ${(error as Error).message}`);
    }
}
