
'use server'

import { mockEvents } from './mock-data';
import type { Club, Event, EventProposal, User } from '@/types';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
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
  try {
    const q = query(collection(db, "clubs"), orderBy("name"));
    const querySnapshot = await getDocs(q);
    const clubs = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        description: data.description,
        image: data.image,
        tags: data.tags,
        members: data.members,
        contactEmail: data.contactEmail,
        facultyAdvisor: data.facultyAdvisor,
        leadId: data.leadId,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : null,
      } as Club;
    });
    return clubs;
  } catch (error) {
    console.error("Error fetching clubs:", error);
    return [];
  }
}

export async function getStudents(): Promise<User[]> {
    try {
        const q = query(collection(db, "users"), where("role", "==", "student"), orderBy("fullName", "asc"));
        const querySnapshot = await getDocs(q);
        const students = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                uid: data.uid,
                name: data.fullName || data.name || "Student",
                fullName: data.fullName,
                email: data.email,
                role: 'student',
                course: data.course,
                year: data.year,
                username: data.username,
                mobile: data.mobile,
                avatar: data.avatar,
                department: data.department,
                interests: data.interests
            } as User;
        });
        return students;
    } catch (error) {
        console.error("Error fetching students:", error);
        return [];
    }
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
        title: data.title,
        description: data.description,
        location: data.location,
        category: data.category,
        registrationLink: data.registrationLink,
        clubId: data.clubId,
        clubName: data.clubName,
        date: data.date,
        time: data.time,
        status: data.status,
        createdBy: data.createdBy,
        creatorEmail: data.creatorEmail,
        createdAt: data.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
        proposer: data.proposer,
        approvedBy: data.approvedBy,
        approvedAt: data.approvedAt?.toDate?.().toISOString() || null,
        rejectedBy: data.rejectedBy,
        rejectedAt: data.rejectedAt?.toDate?.().toISOString() || null,
        rejectionReason: data.rejectionReason,
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
