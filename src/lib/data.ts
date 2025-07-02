
'use server'

import type { Club, Event, EventProposal, User } from '@/types';
import { collection, getDocs, query, where, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export async function getEvents(): Promise<Event[]> {
  try {
    const q = query(collection(db, "events"), orderBy("date", "desc"));
    const querySnapshot = await getDocs(q);
    const events = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return { id: doc.id, ...data } as Event;
    });
    return events;
  } catch (error) {
    console.error("Error fetching events:", error);
    return [];
  }
}

export async function getEventById(id: string): Promise<Event | null> {
  try {
    const docRef = doc(db, "events", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Event;
    } else {
      console.log("No such document!");
      return null;
    }
  } catch (error) {
    console.error("Error fetching event by ID:", error);
    return null;
  }
}

export async function getClubs(): Promise<Club[]> {
  try {
    const q = query(collection(db, "clubs"), orderBy("name"));
    const querySnapshot = await getDocs(q);
    const clubs = querySnapshot.docs.map(doc => {
      const data = doc.data();
      const club: Club = {
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
      };
      return club;
    });
    return clubs;
  } catch (error) {
    console.error("Error fetching clubs:", error);
    return [];
  }
}

export async function getStudents(): Promise<User[]> {
    try {
        // Removed orderBy from the query to prevent needing a composite index.
        // We will sort the results in JavaScript instead.
        const q = query(collection(db, "users"), where("role", "==", "student"));
        const querySnapshot = await getDocs(q);
        const students = querySnapshot.docs.map(doc => {
            const data = doc.data();
            const user: User = {
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
            };
            return user;
        });

        // Sort the students by fullName alphabetically after fetching.
        students.sort((a, b) => (a.fullName || a.name).localeCompare(b.fullName || b.name));

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
      const proposal: EventProposal = {
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
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
        proposer: data.proposer,
        approvedBy: data.approvedBy,
        approvedAt: data.approvedAt?.toDate ? data.approvedAt.toDate().toISOString() : null,
        rejectedBy: data.rejectedBy,
        rejectedAt: data.rejectedAt?.toDate ? data.rejectedAt.toDate().toISOString() : null,
        rejectionReason: data.rejectionReason,
      };
      return proposal;
    });
    return requests;
  } catch (error) {
    console.error("Error fetching event proposals:", error);
    // In case of permissions error or other issues, return an empty array
    // This prevents the page from crashing.
    return [];
  }
}
