'use server'

import { mockClubs, mockEvents } from './mock-data';
import type { Club, Event, EventProposal } from '@/types';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';

// Simulate a database delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function getEvents(): Promise<Event[]> {
  await delay(200);
  return mockEvents;
}

export async function getEventById(id: string): Promise<Event | undefined> {
  await delay(100);
  return mockEvents.find(event => event.id === id);
}

export async function getClubs(): Promise<Club[]> {
  await delay(200);
  return mockClubs;
}

export async function getEventProposals(): Promise<EventProposal[]> {
  try {
    const q = query(
      collection(db, "eventRequests"),
      where("status", "==", "pending")
    );
    const querySnapshot = await getDocs(q);
    const requests = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // The form saves date as a 'YYYY-MM-DD' string
        date: data.date, 
        // Firebase timestamps need to be converted safely
        createdAt: data.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
      } as EventProposal;
    });
    return requests;
  } catch (error) {
    console.error("Error fetching event proposals:", error);
    // In case of permissions error or other issues, return an empty array
    // This prevents the page from crashing.
    return [];
  }
}
