
'use server'

import { collection, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createFolder, uploadFile } from "@/lib/drive";

// Helper function to build proposal data from FormData
async function buildProposalData(formData: FormData, existingFolderId?: string) {
    const title = formData.get('title') as string;
    let googleDriveFolderId = existingFolderId;

    // Create a new folder only if one doesn't already exist
    if (!googleDriveFolderId && title) {
        googleDriveFolderId = await createFolder(title);
    }
    
    // Only proceed with uploads if we have a folder ID
    let headerImageUrl: string | undefined = formData.get('headerImageUrl') as string || undefined;
    if (googleDriveFolderId) {
        const headerImageFile = formData.get('headerImage') as File;
        if (headerImageFile && headerImageFile.size > 0) {
            headerImageUrl = await uploadFile(headerImageFile, googleDriveFolderId);
        }
    }
    
    let eventLogoUrl: string | undefined = formData.get('eventLogoUrl') as string || undefined;
    if (googleDriveFolderId) {
        const eventLogoFile = formData.get('eventLogo') as File;
        if (eventLogoFile && eventLogoFile.size > 0) {
            eventLogoUrl = await uploadFile(eventLogoFile, googleDriveFolderId);
        }
    }
    
    const whatYouWillLearnRaw = formData.get('whatYouWillLearn') as string;
    const whatYouWillLearn = whatYouWillLearnRaw.split('\n').map(s => s.replace(/^-/, '').trim()).filter(Boolean).join('\n');
    
    const tagsRaw = formData.get('tags') as string || '';
    const tags = tagsRaw.split(',').map(tag => tag.trim()).filter(Boolean);

    return {
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
        headerImage: headerImageUrl,
        eventLogo: eventLogoUrl,
        googleDriveFolderId: googleDriveFolderId,
        tags: tags,
    };
}


export async function saveDraftAction(formData: FormData) {
    const user = await getCurrentUser();
    if (!user) throw new Error("You must be logged in to save a draft.");

    const proposalId = formData.get('proposalId') as string | null;
    const googleDriveFolderId = formData.get('googleDriveFolderId') as string | undefined;

    try {
        const proposalData = await buildProposalData(formData, googleDriveFolderId);
        const dataToSave = {
            ...proposalData,
            status: 'draft' as const,
            createdBy: user.uid,
            creatorEmail: user.email ?? '',
        };

        if (proposalId) {
            // Updating an existing draft
            const docRef = doc(db, "eventRequests", proposalId);
            await updateDoc(docRef, { ...dataToSave, updatedAt: serverTimestamp() });
            revalidatePath("/dashboard/host-event");
            return { success: true, id: proposalId };
        } else {
            // Creating a new draft
            const newDocRef = await addDoc(collection(db, "eventRequests"), {
                ...dataToSave,
                createdAt: serverTimestamp(),
            });
            revalidatePath("/dashboard/host-event");
            return { success: true, id: newDocRef.id };
        }
    } catch (error) {
        console.error("Failed to save draft:", error);
        return { success: false, error: (error as Error).message };
    }
}


export async function createEventProposalAction(formData: FormData) {
    const user = await getCurrentUser();
    if (!user) throw new Error("You must be logged in to create an event proposal.");
    
    const proposalId = formData.get('proposalId') as string | null;
    const googleDriveFolderId = formData.get('googleDriveFolderId') as string | undefined;

    try {
        const proposalData = await buildProposalData(formData, googleDriveFolderId);
        
        if (!proposalData.location || !proposalData.category || !proposalData.description || !proposalData.date || !proposalData.time) {
            throw new Error("Please fill all required fields before submitting.");
        }

        const dataToSave = {
            ...proposalData,
            status: "pending" as const,
            createdBy: user.uid,
            creatorEmail: user.email ?? '',
        };

        if (proposalId) {
            // Submitting a draft
            const docRef = doc(db, "eventRequests", proposalId);
            await updateDoc(docRef, { ...dataToSave, updatedAt: serverTimestamp() });
        } else {
            // Submitting a new proposal directly
            await addDoc(collection(db, "eventRequests"), { ...dataToSave, createdAt: serverTimestamp() });
        }

    } catch (error) {
        console.error("Failed to create event proposal:", error);
        throw new Error(`An error occurred: ${(error as Error).message}`);
    }

    revalidatePath("/dashboard/events");
    revalidatePath("/dashboard/host-event");
    redirect("/dashboard/events");
}
