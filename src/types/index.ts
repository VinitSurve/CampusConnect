
export type UserPreferences = {
  emailNotifications: boolean;
  weeklyDigest: boolean;
  clubUpdates: boolean;
  dataAnalytics: boolean;
  personalization: boolean;
};

export type User = {
  id: string; // Document ID from Firestore, same as uid
  uid: string; // Firebase Auth User ID
  name: string; // For component compatibility, maps to fullName
  fullName?: string;
  username?: string;
  email: string;
  mobile?: string;
  avatar?: string;
  role: 'student' | 'faculty' | 'admin';
  // Student-specific
  course?: string;
  year?: string | number; // Can be string ('I', 'II') or number
  interests?: string[];
  // Faculty-specific
  department?: string;
  // New preferences object
  preferences?: UserPreferences;
};

export type Event = {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  date: string;
  time: string;
  endTime?: string;
  location: string;
  organizer: string;
  category: string;
  image: string; // Kept for legacy, headerImage is primary now
  headerImage?: string;
  eventLogo?: string;
  attendees: number;
  capacity: number;
  registrationLink: string;
  status: 'upcoming' | 'past' | 'cancelled' | 'completed';
  tags: string[];
  eventType?: 'event' | 'timetable';
  // New fields
  clubId?: string;
  targetAudience?: string[];
  keySpeakers?: string;
  equipmentNeeds?: string;
  budgetDetails?: string;
  whatYouWillLearn?: string;
  googleDriveFolderId?: string;
  photoAlbumUrl?: string; // This now holds the Google Drive Folder URL
  createdBy?: string;
  approvedBy?: string;
  allowExternals?: boolean;
  // This field is for passing fetched image URLs, not for storing in DB
  gallery?: string[];
  facultyAdvisorIds?: string[];
};

export type Club = {
  id: string;
  name: string;
  description: string;
  image: string;
  tags: string[];
  contactEmail: string;
  facultyAdvisorIds: string[];
  leadId: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  whatsAppGroupLink?: string;
  socialLinks?: {
    website?: string;
    instagram?: string;
    linkedin?: string;
  };
  gallery?: string[];
  googleDriveFolderId?: string;
};

export type EventProposal = {
  id:string;
  title: string;
  description: string;
  location: string;
  category: string;
  registrationLink: string;
  clubId?: string;
  clubName: string;
  date: string;
  time?: string;
  endTime?: string;
  status: 'pending' | 'approved' | 'rejected' | 'draft';
  createdBy: string; // UID of user
  creatorEmail: string;
  createdAt: string;
  updatedAt?: string | null;
  proposer?: string;
  // New fields for approval/rejection cycle
  approvedBy?: string;
  approvedAt?: string | null;
  rejectedBy?: string;
  rejectedAt?: string | null;
  rejectionReason?: string;
  // New fields from user request
  targetAudience?: string[];
  keySpeakers?: string;
  equipmentNeeds?: string;
  budgetDetails?: string;
  whatYouWillLearn?: string;
  headerImage?: string;
  eventLogo?: string;
  googleDriveFolderId?: string;
  photoAlbumUrl?: string;
  tags?: string[];
  publishedEventId?: string;
  allowExternals?: boolean;
  // This field is for passing fetched image URLs, not for storing in DB
  gallery?: string[];
  facultyAdvisorIds?: string[];
};

export type TimetableEntry = {
  id: string;
  course: string;
  year: string;
  division: string;
  subject: string;
  facultyName: string;
  location: string;
  dayOfWeek: number; // 1=Mon, 2=Tues, etc.
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  createdAt?: any;
  updatedAt?: any;
};

export type SeminarBooking = {
  id: string;
  title: string;
  organizer: string;
  date: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  approvedBy?: string;
  createdAt?: any;
  updatedAt?: any;
};

export type FacultyInvitation = {
  id: string;
  name: string;
  email: string;
  token: string;
  role: 'faculty';
  expiresAt: any; // Firestore Timestamp
  createdAt: any; // Firestore Timestamp
  used: boolean;
};
