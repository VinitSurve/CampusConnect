

'use server'

import type { Club, Event, EventProposal, User, TimetableEntry, SeminarBooking } from '@/types';
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
    
    // Step 1: Prepare variables
    const dateStr = format(date, 'yyyy-MM-dd');
    const jsDayOfWeek = date.getDay(); // 0=Sun, 1=Mon, etc.
    const targetLocationName = locationIdToNameMap[locationId] || locationId;
    
    // This will hold all bookings for the ENTIRE day, which we will filter later.
    const allBookingsForDay: any[] = [];

    try {
        // Step 2: Fetch ALL data for the given day, from all sources.
        
        // Fetch events on that date.
        const eventsQuery = query(collection(db, "events"), where("date", "==", dateStr));
        const eventsSnapshot = await getDocs(eventsQuery);
        eventsSnapshot.forEach(doc => {
            const data = doc.data() as Event;
            const booking = {
                title: data.title,
                organizer: data.organizer,
                location: data.location,
                type: 'Event',
                // IMPORTANT: Normalize start/end times
                startTime: data.time || '08:00', // Default to start of day for all-day events
                endTime: data.endTime || (data.time ? `${String(parseInt(data.time.split(':')[0]) + 1).padStart(2, '0')}:00` : '18:00') // Default to end of day for all-day events
            };
            allBookingsForDay.push(booking);
        });

        // Fetch seminar bookings on that date.
        const seminarQuery = query(collection(db, "seminarBookings"), where("date", "==", dateStr));
        const seminarSnapshot = await getDocs(seminarQuery);
        seminarSnapshot.forEach(doc => {
            allBookingsForDay.push({
                ...doc.data(),
                location: 'Seminar Hall', // Implicit location
                type: 'Booking'
            });
        });

        // Fetch recurring timetable lectures for that day of the week.
        if (jsDayOfWeek > 0 && jsDayOfWeek < 7) { // Only fetch for Mon-Sat
            const timetableQuery = query(collection(db, "timetables"), where("dayOfWeek", "==", jsDayOfWeek));
            const timetablesSnapshot = await getDocs(timetableQuery);
            timetablesSnapshot.forEach(doc => {
                const data = doc.data() as TimetableEntry;
                allBookingsForDay.push({
                    title: `${data.subject} (${data.course} ${data.year}-${data.division})`,
                    organizer: data.facultyName,
                    location: data.location,
                    type: 'Lecture',
                    startTime: data.startTime,
                    endTime: data.endTime
                });
            });
        }
        
        // Step 3: Filter the combined list by the target location.
        // This is the most crucial step. It ensures we only return bookings for the selected room.
        const finalSchedule = allBookingsForDay.filter(booking => {
            const eventLocation = booking.location;
            // The location might be stored as 'seminar' or 'Seminar Hall'. We check for both.
            return eventLocation === targetLocationName || eventLocation === locationId;
        });

        return finalSchedule;

    } catch (error) {
        console.error("Error fetching day schedule:", error);
        // Add a check for the composite index error, as it's a common Firestore issue.
        if ((error as any).code === 'failed-precondition') {
            console.error(
                `Firestore composite index required. Please check the browser console for a link to create the necessary index for your queries.`
            );
        }
        return [];
    }
}
