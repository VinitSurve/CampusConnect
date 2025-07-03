
'use server'

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase';
import { collection, doc, updateDoc, addDoc, getDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import type { EventProposal, Event, SeminarBooking } from '@/types';
import { deleteFolder } from '@/lib/drive';

// Add a map for location IDs to names
const locationIdToNameMap: { [key: string]: string } = {
  'lab401': 'Lab 401',
  'lab402': 'Lab 402',
  'lab503': 'Lab 503',
  'seminar': 'Seminar Hall'
};

export async function approveRequest(proposal: EventProposal) {
    try {
        const requestRef = doc(db, "eventRequests", proposal.id);

        // Convert location ID to name for display consistency
        const locationName = locationIdToNameMap[proposal.location] || proposal.location;

        // Create a new event from the proposal data
        const newEvent: Omit<Event, 'id'> = {
            title: proposal.title,
            description: proposal.description.substring(0, 100) + (proposal.description.length > 100 ? '...' : ''),
            longDescription: proposal.description,
            date: proposal.date,
            time: proposal.time || "12:00",
            endTime: proposal.endTime,
            location: locationName, // Use the mapped name
            organizer: proposal.clubName,
            category: proposal.category,
            image: proposal.headerImage || 'https://placehold.co/600x400.png',
            headerImage: proposal.headerImage,
            eventLogo: proposal.eventLogo,
            attendees: 0,
            capacity: 100, // Default capacity
            registrationLink: proposal.registrationLink || '#',
            status: 'upcoming',
            gallery: [],
            tags: [...(proposal.tags || []), proposal.category].filter((value, index, self) => self.indexOf(value) === index),
            // Pass new fields
            targetAudience: proposal.targetAudience,
            keySpeakers: proposal.keySpeakers,
            equipmentNeeds: proposal.equipmentNeeds,
            budgetDetails: proposal.budgetDetails,
            whatYouWillLearn: proposal.whatYouWillLearn,
            googleDriveFolderId: proposal.googleDriveFolderId,
        };

        await addDoc(collection(db, "events"), newEvent);

        // Check for the seminar hall using the ID from the proposal
        if (proposal.location === 'seminar') {
            const newBooking: Omit<SeminarBooking, 'id'> = {
                title: proposal.title,
                organizer: proposal.clubName,
                date: proposal.date,
                startTime: proposal.time || "12:00",
                endTime: proposal.endTime || (() => {
                    const startTime = proposal.time || "12:00";
                    const [hour, minute] = startTime.split(':').map(Number);
                    const endHour = hour + 1;
                    return `${String(endHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                })(),
            };

            await addDoc(collection(db, "seminarBookings"), {
                ...newBooking,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        }

        // Update the original request status
        await updateDoc(requestRef, {
            status: "approved",
            approvedAt: serverTimestamp(),
        });
        
        revalidatePath("/admin");
        revalidatePath("/admin/calendar");
        revalidatePath("/admin/seminar-hall"); // Revalidate new page
        return { success: true };

    } catch (error) {
        console.error("Error approving request:", error);
        return { success: false, error: (error as Error).message };
    }
}


export async function rejectRequest(proposalId: string, reason: string) {
    try {
        if (!reason.trim()) {
            throw new Error("Rejection reason cannot be empty.");
        }

        const requestRef = doc(db, "eventRequests", proposalId);
        const requestSnap = await getDoc(requestRef);

        if (!requestSnap.exists()) {
            throw new Error("Proposal not found.");
        }

        const requestData = requestSnap.data() as EventProposal;

        // If there's a drive folder, delete it.
        if (requestData.googleDriveFolderId) {
            await deleteFolder(requestData.googleDriveFolderId);
        }

        await updateDoc(requestRef, {
            status: "rejected",
            rejectionReason: reason,
            rejectedAt: serverTimestamp(),
        });

        revalidatePath("/admin");
        return { success: true };

    } catch (error) {
        console.error("Error rejecting request:", error);
        return { success: false, error: (error as Error).message };
    }
}
