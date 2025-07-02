
'use server'

import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

// This is a MOCK upload function.
// In a real application, you would use a service like Firebase Storage.
async function uploadFile(file: File, type: 'header' | 'logo'): Promise<string> {
    console.log(`Simulating upload for ${file.name} as ${type}`);
    // Simulate network delay for upload
    await new Promise(resolve => setTimeout(resolve, 1000)); 

    if (type === 'header') {
        return 'https://placehold.co/2560x650.png';
    }
    if (type === 'logo') {
        return 'https://placehold.co/1080x1080.png';
    }
    return 'https://placehold.co/600x400.png';
}


export async function createEventProposalAction(formData: FormData) {
    const user = await getCurrentUser();
    if (!user) {
        throw new Error("You must be logged in to create an event proposal.");
    }
    
    let headerImageUrl: string | undefined = undefined;
    const headerImageFile = formData.get('headerImage') as File;
    if (headerImageFile && headerImageFile.size > 0) {
        headerImageUrl = await uploadFile(headerImageFile, 'header');
    }
    
    let eventLogoUrl: string | undefined = undefined;
    const eventLogoFile = formData.get('eventLogo') as File;
    if (eventLogoFile && eventLogoFile.size > 0) {
        eventLogoUrl = await uploadFile(eventLogoFile, 'logo');
    }

    const proposalData = {
        title: formData.get('title') as string,
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
    };
    
    if (!proposalData.title || !proposalData.location || !proposalData.category || !proposalData.description || !proposalData.date || !proposalData.time) {
        // This basic validation can be improved with Zod for production apps
        throw new Error("Please fill all required fields.");
    }

    await addDoc(collection(db, "eventRequests"), proposalData);

    revalidatePath("/dashboard/events");
    redirect("/dashboard/events");
}
