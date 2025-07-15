
'use server'

import type { Club, Event, EventProposal, User, TimetableEntry, SeminarBooking } from '@/types';
import { collection, getDocs, query, where, orderBy, doc, getDoc, limit, startAfter, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from './firebase';

const handleDbError = (operation: string) => {
  if (!db) {
    console.warn(`Firebase not initialized. Cannot perform: ${operation}. Returning empty data.`);
    return true;
  }
  return false;
}

export async function getAllUsers(): Promise<User[]> {
  if (handleDbError('getAllUsers')) return [];
  try {
    const q = query(collection(db, "users"));
    const querySnapshot = await getDocs(q);
    const users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    return users;
  } catch (error) {
    console.error("Error fetching all users:", error);
    return [];
  }
}

export async function getAllFaculty(): Promise<User[]> {
  if (handleDbError('getAllFaculty')) return [];
  try {
    const q = query(collection(db, "users"), where("role", "==", "faculty"));
    const querySnapshot = await getDocs(q);
    const facultyList = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return { 
            id: doc.id, 
            uid: doc.id,
            ...data 
        } as User;
    });
    
    facultyList.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    return facultyList;
  } catch (error) {
    console.error("Error fetching faculty:", error);
    return [];
  }
}

export async function getStudentById(studentId: string): Promise<User | null> {
    if (handleDbError('getStudentById')) return null;
    try {
        const docRef = doc(db, "users", studentId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists() && docSnap.data().role === 'student') {
            return { id: docSnap.id, ...docSnap.data() } as User;
        }

        return null;
    } catch (error) {
        console.error("Error fetching student by ID:", error);
        return null;
    }
}

export async function searchStudents(
  searchQuery: string,
  lastDoc: QueryDocumentSnapshot | null = null,
  pageSize: number = 10
) {
    if (handleDbError('searchStudents')) return { students: [], hasMore: false, lastDoc: null };
    
    try {
        const studentsRef = collection(db, "users");
        let q;

        const baseQuery = [
            where("role", "==", "student"),
            orderBy("name")
        ];

        if (searchQuery) {
            const capitalizedQuery = searchQuery.charAt(0).toUpperCase() + searchQuery.slice(1);
            const endQuery = capitalizedQuery + '\uf8ff';
            q = query(studentsRef, ...baseQuery, where("name", ">=", capitalizedQuery), where("name", "<=", endQuery));
        } else {
            q = query(studentsRef, ...baseQuery);
        }

        if (lastDoc) {
            q = query(q, startAfter(lastDoc));
        }

        q = query(q, limit(pageSize + 1));
        
        const snapshot = await getDocs(q);
        const hasMore = snapshot.docs.length > pageSize;
        const students = snapshot.docs.slice(0, pageSize).map(doc => ({
            id: doc.id,
            ...doc.data()
        } as User));
        
        const newLastDoc = hasMore ? snapshot.docs[pageSize - 1] : null;

        return { students, hasMore, lastDoc: newLastDoc };
    } catch (error) {
        console.error("Error searching students:", error);
        return { students: [], hasMore: false, lastDoc: null };
    }
}


export async function getEvents(): Promise<Event[]> {
  if (handleDbError('getEvents')) return [];
  try {
    const q = query(collection(db, "events"), orderBy("date", "asc"));
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
    const clubDoc = await getDoc(doc(db, 'clubs', clubId));
    if (!clubDoc.exists()) {
      console.error(`Club with id ${clubId} not found.`);
      return [];
    }
    const clubName = clubDoc.data().name;

    const q = query(collection(db, "events"), where("organizer", "==", clubName));
    const querySnapshot = await getDocs(q);
    const events = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return { id: doc.id, ...data } as Event;
    });
    
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
      const club: Club = {
        id: docSnap.id,
        name: data.name,
        description: data.description,
        image: data.image,
        tags: data.tags,
        contactEmail: data.contactEmail,
        facultyAdvisor: data.facultyAdvisor, // This is the old field
        leadId: data.leadId,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : null,
        // The new fields might not exist on old documents
        facultyAdvisorIds: data.facultyAdvisorIds || (data.facultyAdvisor ? [data.facultyAdvisor] : []),
        whatsAppGroupLink: data.whatsAppGroupLink,
        socialLinks: data.socialLinks,
        gallery: data.gallery,
        googleDriveFolderId: data.googleDriveFolderId,
      };
      return club;
    } else {
      console.log("No such club document!");
      return null;
    }
  } catch (error) {
    console.error("Error fetching club by ID:", error);
    return null;
  }
}

export async function getClubByLeadId(leadId: string): Promise<Club | null> {
    if (handleDbError('getClubByLeadId')) return null;
    try {
        const q = query(collection(db, "clubs"), where("leadId", "==", leadId), limit(1));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            return { id: doc.id, ...doc.data() } as Club;
        }
        return null;
    } catch (error) {
        console.error("Error fetching club by lead ID:", error);
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
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null;
      const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : null;

      const club: Club = {
        id: doc.id,
        name: data.name,
        description: data.description,
        image: data.image,
        tags: data.tags,
        contactEmail: data.contactEmail,
        facultyAdvisor: data.facultyAdvisor,
        leadId: data.leadId,
        createdAt: createdAt,
        updatedAt: updatedAt,
        facultyAdvisorIds: data.facultyAdvisorIds || (data.facultyAdvisor ? [data.facultyAdvisor] : []),
        whatsAppGroupLink: data.whatsAppGroupLink,
        socialLinks: data.socialLinks,
        gallery: data.gallery,
        googleDriveFolderId: data.googleDriveFolderId,
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

export async function getEventProposals(facultyId: string): Promise<EventProposal[]> {
  if (handleDbError('getEventProposals')) return [];
  try {
    const q = query(
      collection(db, "eventRequests"),
      where("status", "==", "pending"),
      where("facultyAdvisorIds", "array-contains", facultyId)
    );
    const querySnapshot = await getDocs(q);
    const requests = querySnapshot.docs.map(doc => {
      const data = doc.data();
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

    const tzoffset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - tzoffset);
    const dateStr = localDate.toISOString().slice(0, 10);
    
    // JS getDay() is 0=Sun, 6=Sat. Firestore is 1=Mon, 7=Sun. We use 1-6 Mon-Sat.
    const timetableDayOfWeek = date.getDay();
    
    const targetLocationName = locationIdToNameMap[locationId] || locationId;
    const allBookingsForDay: any[] = [];

    try {
        const eventsQuery = query(
          collection(db, "events"), 
          where("date", "==", dateStr),
          where("status", "==", "upcoming"),
          where("location", "==", targetLocationName)
        );
        
        const seminarQuery = locationId === 'seminar'
            ? query(collection(db, "seminarBookings"), where("date", "==", dateStr))
            : null;

        const timetableQuery = (timetableDayOfWeek > 0 && timetableDayOfWeek < 7) 
            ? query(
                collection(db, "timetables"), 
                where("dayOfWeek", "==", timetableDayOfWeek),
                where("location", "==", targetLocationName)
              )
            : null;

        const [eventsSnapshot, seminarSnapshot, timetablesSnapshot] = await Promise.all([
            getDocs(eventsQuery),
            seminarQuery ? getDocs(seminarQuery) : Promise.resolve(null),
            timetableQuery ? getDocs(timetableQuery) : Promise.resolve(null),
        ]);

        eventsSnapshot.forEach(doc => {
            const data = doc.data() as Event;
            if (data.time) {
                 allBookingsForDay.push(createBookingObject(
                    data.title,
                    data.organizer,
                    data.location,
                    'Event',
                    data.time,
                    data.endTime || `${String(parseInt(data.time.split(':')[0]) + 1).padStart(2, '0')}:00`
                ));
            } else {
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

        if (seminarSnapshot) {
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
        }

        if (timetablesSnapshot) {
            timetablesSnapshot.forEach(doc => {
                const data = doc.data() as TimetableEntry;
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
        
        return allBookingsForDay;

    } catch (error) {
        console.error("Error fetching day schedule:", error);
        return [];
    }
}
