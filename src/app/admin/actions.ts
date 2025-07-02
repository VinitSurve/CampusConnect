'use server'

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase';
import { collection, doc, updateDoc, addDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import type { EventProposal, Event } from '@/types';

export async function approveRequest(proposal: EventProposal) {
    try {
        const requestRef = doc(db, "eventRequests", proposal.id);

        // Create a new event from the proposal data
        const newEvent: Omit<Event, 'id'> = {
            title: proposal.title,
            description: proposal.description || "No description provided.",
            longDescription: proposal.description || "No description provided.",
            date: proposal.date,
            time: "12:00", // Default time, can be updated later
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
        };

        await addDoc(collection(db, "events"), newEvent);

        // Update the original request status
        await updateDoc(requestRef, {
            status: "approved",
            approvedAt: serverTimestamp(),
        });
        
        revalidatePath("/admin");
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
