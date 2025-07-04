
'use server'

import type { Club, Event, EventProposal, User } from '@/types';
import { collection, getDocs, query, where, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { format } from 'date-fns';


const handleDbError = (operation: string) => {
  if (!db) {
    console.warn(`Firebase not initialized. Cannot perform: ${operation}. Returning empty data.`);
    return true;
  }
  return false;
}

export async function getEvents(): Promise<Event[]> {
  if (handleDbError('getEvents')) return [];
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
  if (handleDbError('getEventById')) return null;
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
  if (handleDbError('getClubs')) return [];
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
    if (handleDbError('getStudents')) return [];
    try {
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
        students.sort((a, b) => (a.fullName || a.name).localeCompare(b.fullName || b.name));
        return students;
    } catch (error) {
        console.error("Error fetching students:", error);
        return [];
    }
}

export async function getEventProposals(): Promise<EventProposal[]> {
  if (handleDbError('getEventProposals')) return [];
  try {
    const q = query(
      collection(db, "eventRequests"),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    const requests = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return { 
        ...data, 
        id: doc.id,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString()
      } as EventProposal;
    });
    return requests;
  } catch (error) {
    console.error("Error fetching event proposals:", error);
    return [];
  }
}

export async function getUserProposals(userId: string): Promise<EventProposal[]> {
  if (handleDbError('getUserProposals')) return [];
  try {
    const q = query(
      collection(db, "eventRequests"),
      where("createdBy", "==", userId)
      // Removed orderBy to prevent needing a composite index
    );
    const querySnapshot = await getDocs(q);
    const proposals = querySnapshot.docs.map(doc => {
      const data = doc.data();
      // Important: Ensure all date fields are serializable to plain strings
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString();
      const approvedAt = data.approvedAt?.toDate ? data.approvedAt.toDate().toISOString() : null;
      const rejectedAt = data.rejectedAt?.toDate ? data.rejectedAt.toDate().toISOString() : null;
      const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : null;

      return { 
        ...data, 
        id: doc.id,
        createdAt,
        approvedAt,
        rejectedAt,
        updatedAt,
      } as EventProposal;
    });

    // Sort proposals manually by date since we removed it from the query
    proposals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return proposals;
  } catch (error) {
    console.error("Error fetching user event proposals:", error);
    return [];
  }
}

const locationIdToNameMap: { [key: string]: string } = {
  'lab401': 'Lab 401',
  'lab402': 'Lab 402',
  'lab503': 'Lab 503',
  'seminar': 'Seminar Hall'
};

export async function getDayScheduleForLocation(date: Date, locationId: string): Promise<any[]> {
    if (handleDbError('getDayScheduleForLocation')) return [];
    
    const dateStr = format(date, 'yyyy-MM-dd');
    const firestoreDayOfWeek = date.getDay(); // Sunday is 0, Monday is 1, etc.
    const locationName = locationIdToNameMap[locationId] || locationId;
    let allBookings: any[] = [];

    try {
        // --- Fetch all possible bookings for the day/day-of-week AND location ---
        
        // Query for one-off events at this location on this date
        const eventsQuery = query(
            collection(db, "events"), 
            where("date", "==", dateStr), 
            where("location", "==", locationName)
        );

        // Query for recurring timetable lectures at this location on this day of the week
        const timetablesQuery = query(
            collection(db, "timetables"), 
            where("dayOfWeek", "==", firestoreDayOfWeek), 
            where("location", "==", locationName)
        );

        // Seminar bookings are only for the seminar hall and don't have a location field.
        const seminarQuery = (locationId === 'seminar') 
            ? query(collection(db, "seminarBookings"), where("date", "==", dateStr))
            : null;

        const queries = [getDocs(eventsQuery), getDocs(timetablesQuery)];
        if (seminarQuery) {
            queries.push(getDocs(seminarQuery));
        }

        const snapshots = await Promise.all(queries);

        const [eventsSnapshot, timetablesSnapshot] = snapshots;
        const seminarSnapshot = (locationId === 'seminar' && snapshots.length > 2) ? snapshots[2] : null;

        // Process events
        eventsSnapshot.forEach(doc => {
            const data = doc.data();
            allBookings.push({ title: data.title, startTime: data.time, endTime: data.endTime, organizer: data.organizer, type: 'Event' });
        });

        // Process timetable entries
        timetablesSnapshot.forEach(doc => {
            const data = doc.data();
            allBookings.push({ title: `${data.subject} (${data.course} ${data.year}-${data.division})`, startTime: data.startTime, endTime: data.endTime, organizer: data.facultyName, type: 'Lecture' });
        });
        
        // Process seminar bookings
        if (seminarSnapshot) {
            seminarSnapshot.forEach(doc => {
                const data = doc.data();
                allBookings.push({ title: data.title, startTime: data.startTime, endTime: data.endTime, organizer: data.organizer, type: 'Booking' });
            });
        }
        
        return allBookings;
    } catch (error) {
        console.error("Error fetching day schedule:", error);
        if ((error as any).code === 'failed-precondition') {
            console.error(
                `Firestore composite index required. Please check the browser console for a link to create the index. 
                This usually happens when you query on multiple fields.`
            );
        }
        return [];
    }
}
