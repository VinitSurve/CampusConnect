
'use server'

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase';
import { collection, doc, updateDoc, addDoc, getDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import type { EventProposal, Event, SeminarBooking } from '@/types';

export async function approveRequest(proposal: EventProposal) {
    try {
        const requestRef = doc(db, "eventRequests", proposal.id);

        // Create a new event from the proposal data
        const newEvent: Omit<Event, 'id'> = {
            title: proposal.title,
            description: proposal.description.substring(0, 100) + (proposal.description.length > 100 ? '...' : ''),
            longDescription: proposal.description,
            date: proposal.date,
            time: proposal.time || "12:00",
            location: proposal.location,
            organizer: proposal.clubName,
            category: proposal.category,
            image: 'https://placehold.co/600x400.png',
            attendees: 0,
            capacity: 100, // Default capacity
            registrationLink: proposal.registrationLink || '#',
            status: 'upcoming',
            gallery: [],
            interests: [proposal.category],
            // Pass new fields
            targetAudience: proposal.targetAudience,
            keySpeakers: proposal.keySpeakers,
            equipmentNeeds: proposal.equipmentNeeds,
            budgetDetails: proposal.budgetDetails,
            whatYouWillLearn: proposal.whatYouWillLearn,
        };

        await addDoc(collection(db, "events"), newEvent);

        // If the event is in the seminar hall, create a booking record
        if (proposal.location === 'seminar') {
            const startTime = proposal.time || "12:00";
            const [hour, minute] = startTime.split(':').map(Number);
            const endHour = hour + 1; // Assume 1 hour duration
            const endTime = `${String(endHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

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
