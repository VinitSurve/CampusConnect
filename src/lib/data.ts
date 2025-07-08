

'use server'

import type { Club, Event, EventProposal, User, TimetableEntry, SeminarBooking } from '@/types';
import { collection, getDocs, query, where, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

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

export async function getEventsByClubId(clubId: string): Promise<Event[]> {
  if (handleDbError('getEventsByClubId')) return [];
  try {
    // The query now fetches events without ordering to avoid the composite index requirement.
    const q = query(collection(db, "events"), where("clubId", "==", clubId));
    const querySnapshot = await getDocs(q);
    const events = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return { id: doc.id, ...data } as Event;
    });
    
    // We sort the events here in code, after fetching them.
    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return events;
  } catch (error) {
    console.error("Error fetching events by club ID:", error);
    return [];
  }
}

export async function getClubById(id: string): Promise<Club | null> {
  if (handleDbError('getClubById')) return null;
  try {
    const docRef = doc(db, "clubs", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return { id: docSnap.id, ...data } as Club;
    } else {
      console.log("No such club document!");
      return null;
    }
  } catch (error) {
    console.error("Error fetching club by ID:", error);
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
      where("status", "==", "pending")
    );
    const querySnapshot = await getDocs(q);
    const requests = querySnapshot.docs.map(doc => {
      const data = doc.data();
      // Serialize all timestamp fields to prevent passing complex objects to client components
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString();
      const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : null;
      const approvedAt = data.approvedAt?.toDate ? data.approvedAt.toDate().toISOString() : null;
      const rejectedAt = data.rejectedAt?.toDate ? data.rejectedAt.toDate().toISOString() : null;

      return { 
        ...data, 
        id: doc.id,
        createdAt,
        updatedAt,
        approvedAt,
        rejectedAt,
      } as EventProposal;
    });
    
    // Manually sort results to avoid composite index
    requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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
    );
    const querySnapshot = await getDocs(q);
    const proposals = querySnapshot.docs.map(doc => {
      const data = doc.data();
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

const createBookingObject = (
  title: string,
  organizer: string,
  location: string,
  type: string,
  startTime: string,
  endTime: string
) => ({
  title,
  organizer,
  location,
  type,
  startTime,
  endTime,
});

export async function getDayScheduleForLocation(date: Date, locationId: string): Promise<any[]> {
    if (handleDbError('getDayScheduleForLocation')) return [];

    const tzoffset = date.getTimezoneOffset() * 60000; //offset in milliseconds
    const localDate = new Date(date.getTime() - tzoffset);
    const dateStr = localDate.toISOString().slice(0, 10);
    
    const timetableDayOfWeek = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    
    const targetLocationName = locationIdToNameMap[locationId] || locationId;
    const allBookingsForDay: any[] = [];

    try {
        // --- 1. Fetch all documents relevant for the day in parallel ---
        const eventsQuery = query(collection(db, "events"), where("date", "==", dateStr));
        const seminarQuery = query(collection(db, "seminarBookings"), where("date", "==", dateStr));
        const timetableQuery = (timetableDayOfWeek > 0 && timetableDayOfWeek < 7) 
            ? query(collection(db, "timetables"), where("dayOfWeek", "==", timetableDayOfWeek))
            : null;

        const [eventsSnapshot, seminarSnapshot, timetablesSnapshot] = await Promise.all([
            getDocs(eventsQuery),
            getDocs(seminarQuery),
            timetableQuery ? getDocs(timetableQuery) : Promise.resolve(null),
        ]);

        // --- 2. Process and normalize all fetched data ---
        eventsSnapshot.forEach(doc => {
            const data = doc.data() as Event;
            if (!data.location) return;

            if (data.time) { // Timed event
                 allBookingsForDay.push(createBookingObject(
                    data.title,
                    data.organizer,
                    data.location,
                    'Event',
                    data.time,
                    data.endTime || `${String(parseInt(data.time.split(':')[0]) + 1).padStart(2, '0')}:00`
                ));
            } else { // All-day event
                allBookingsForDay.push(createBookingObject(
                    data.title,
                    data.organizer,
                    data.location,
                    'Event (All Day)',
                    '08:00',
                    '18:00'
                ));
            }
        });

        seminarSnapshot.forEach(doc => {
            const data = doc.data() as SeminarBooking;
            allBookingsForDay.push(createBookingObject(
                data.title,
                data.organizer,
                'Seminar Hall',
                'Booking',
                data.startTime,
                data.endTime
            ));
        });

        if (timetablesSnapshot) {
            timetablesSnapshot.forEach(doc => {
                const data = doc.data() as TimetableEntry;
                if (!data.location) return;
                allBookingsForDay.push(createBookingObject(
                    `${data.subject} (${data.course} ${data.year}-${data.division})`,
                    data.facultyName,
                    data.location,
                    'Lecture',
                    data.startTime,
                    data.endTime
                ));
            });
        }
        
        // --- 3. Filter the combined list by the target location ---
        const finalSchedule = allBookingsForDay.filter(booking => {
            return booking.location === targetLocationName || booking.location === locationId;
        });

        return finalSchedule;

    } catch (error) {
        console.error("Error fetching day schedule:", error);
        return [];
    }
}
