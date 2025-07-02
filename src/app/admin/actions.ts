
'use server'

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase';
import { collection, doc, updateDoc, addDoc, getDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import type { EventProposal, Event, TimetableEntry } from '@/types';

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
            eventType: 'event',
        };

        await addDoc(collection(db, "events"), newEvent);

        // Update the original request status
        await updateDoc(requestRef, {
            status: "approved",
            approvedAt: serverTimestamp(),
        });
        
        revalidatePath("/admin");
        revalidatePath("/admin/calendar");
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

export async function saveTimetableEntry(entryData: Omit<TimetableEntry, 'id'>, entryId?: string) {
    try {
        // Explicitly map fields to prevent extra data from being sent to Firestore.
        const dataToSave = {
            subject: entryData.subject,
            facultyName: entryData.facultyName,
            course: entryData.course,
            year: entryData.year,
            division: entryData.division,
            dayOfWeek: entryData.dayOfWeek,
            startTime: entryData.startTime,
            endTime: entryData.endTime,
            updatedAt: serverTimestamp(),
        };

        if (entryId) {
            // Update existing entry
            const entryRef = doc(db, "timetables", entryId);
            const { updatedAt, ...updateData } = dataToSave;
            await updateDoc(entryRef, {
                ...updateData,
                updatedAt: serverTimestamp()
            });
        } else {
            // Add new entry
            await addDoc(collection(db, "timetables"), {
                ...dataToSave,
                createdAt: serverTimestamp(),
            });
        }
        
        revalidatePath("/admin/calendar");
        return { success: true };

    } catch (error) {
        console.error("Error saving timetable entry:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function deleteTimetableEntry(entryId: string) {
    try {
        const entryRef = doc(db, "timetables", entryId);
        await deleteDoc(entryRef);
        
        revalidatePath("/admin/calendar");
        return { success: true };

    } catch (error) {
        console.error("Error deleting timetable entry:", error);
        return { success: false, error: (error as Error).message };
    }
}
