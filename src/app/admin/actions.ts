
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
        if (!proposal.date) {
            throw new Error("Cannot approve a proposal without a date.");
        }

        const requestRef = doc(db, "eventRequests", proposal.id);

        // --- NEW ROBUST TIME LOGIC ---
        const startTime = proposal.time || '09:00'; 
        const endTime = proposal.endTime || (() => {
            const [hour, minute] = startTime.split(':').map(Number);
            const endHour = hour + 1; 
            return `${String(endHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        })();
        // --- END OF NEW LOGIC ---

        const locationName = locationIdToNameMap[proposal.location] || proposal.location;

        const newEvent: Omit<Event, 'id'> = {
            title: proposal.title,
            description: proposal.description.substring(0, 100) + (proposal.description.length > 100 ? '...' : ''),
            longDescription: proposal.description,
            date: proposal.date,
            time: startTime,
            endTime: endTime,
            location: locationName,
            organizer: proposal.clubName,
            category: proposal.category,
            image: proposal.headerImage || 'https://placehold.co/600x400.png',
            headerImage: proposal.headerImage,
            eventLogo: proposal.eventLogo,
            attendees: 0,
            capacity: 100,
            registrationLink: proposal.registrationLink || '#',
            status: 'upcoming',
            gallery: [],
            tags: [...(proposal.tags || []), proposal.category].filter((value, index, self) => self.indexOf(value) === index),
            targetAudience: proposal.targetAudience,
            keySpeakers: proposal.keySpeakers,
            equipmentNeeds: proposal.equipmentNeeds,
            budgetDetails: proposal.budgetDetails,
            whatYouWillLearn: proposal.whatYouWillLearn,
            googleDriveFolderId: proposal.googleDriveFolderId,
            createdBy: proposal.createdBy,
        };

        const newEventRef = await addDoc(collection(db, "events"), newEvent);

        if (proposal.location === 'seminar') {
            const newBooking: Omit<SeminarBooking, 'id'> = {
                title: proposal.title,
                organizer: proposal.clubName,
                date: proposal.date,
                startTime: startTime,
                endTime: endTime,
            };

            await addDoc(collection(db, "seminarBookings"), {
                ...newBooking,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        }

        await updateDoc(requestRef, {
            status: "approved",
            approvedAt: serverTimestamp(),
            publishedEventId: newEventRef.id,
        });
        
        revalidatePath("/admin");
        revalidatePath("/admin/calendar");
        revalidatePath("/admin/seminar-hall");
        revalidatePath("/dashboard/host-event");
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
