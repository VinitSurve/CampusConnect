

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
    
    const dateStr = format(date, 'yyyy-MM-dd');
    const jsDayOfWeek = date.getDay();
    const locationName = locationIdToNameMap[locationId] || locationId;

    try {
        const eventPromise = getDocs(query(collection(db, "events"), where("date", "==", dateStr)));
        
        const timetablePromise = jsDayOfWeek > 0 && jsDayOfWeek < 7 
            ? getDocs(query(collection(db, "timetables"), where("dayOfWeek", "==", jsDayOfWeek)))
            : Promise.resolve({ docs: [] });
            
        const seminarPromise = getDocs(query(collection(db, "seminarBookings"), where("date", "==", dateStr)));

        const [eventsSnapshot, timetablesSnapshot, seminarSnapshot] = await Promise.all([
            eventPromise,
            timetablePromise,
            seminarPromise,
        ]);
        
        const allPotentialBookings: any[] = [];

        // Process events
        eventsSnapshot.forEach(doc => {
            const data = doc.data() as Event;
            if (!data.date) return;

            const bookingToAdd: any = { ...data, type: 'Event' };

            if (!data.time) { // All-day event
                bookingToAdd.startTime = '08:00';
                bookingToAdd.endTime = '18:00';
            } else {
                bookingToAdd.startTime = data.time;
                // If no endTime, default to one hour after startTime
                bookingToAdd.endTime = data.endTime || (() => {
                    const [hour, minute] = data.time.split(':').map(Number);
                    const endHour = hour + 1;
                    return `${String(endHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                })();
            }
            allPotentialBookings.push(bookingToAdd);
        });

        // Process timetables
        timetablesSnapshot.forEach(doc => {
            const data = doc.data() as TimetableEntry;
            allPotentialBookings.push({ 
                title: `${data.subject} (${data.course} ${data.year}-${data.division})`, 
                startTime: data.startTime, 
                endTime: data.endTime, 
                organizer: data.facultyName, 
                type: 'Lecture', 
                location: data.location 
            });
        });

        // Process seminar bookings
        seminarSnapshot.forEach(doc => {
            const data = doc.data() as SeminarBooking;
            allPotentialBookings.push({ ...data, type: 'Booking', location: 'Seminar Hall' });
        });

        // Final robust filter
        return allPotentialBookings.filter(booking => {
            const eventLocation = booking.location;
            return eventLocation === locationName || eventLocation === locationId;
        });

    } catch (error) {
        console.error("Error fetching day schedule:", error);
        if ((error as any).code === 'failed-precondition') {
            console.error(
                `Firestore composite index required. Please check the browser console for a link to create the index.`
            );
        }
        return [];
    }
}
