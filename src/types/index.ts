export type User = {
  id: string; // Document ID from Firestore, same as uid
  uid: string; // Firebase Auth User ID
  name: string; // For component compatibility, maps to fullName
  fullName?: string;
  username?: string;
  email: string;
  mobile?: string;
  avatar: string;
  role: 'student' | 'faculty' | 'admin';
  // Student-specific
  course?: string;
  year?: string | number; // Can be string ('I', 'II') or number
  interests?: string[];
  // Faculty-specific
  department?: string;
};

export type Event = {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  date: string;
  time: string;
  location: string;
  organizer: string;
  category: string;
  image: string;
  attendees: number;
  capacity: number;
  registrationLink: string;
  status: 'upcoming' | 'past' | 'cancelled';
  gallery: string[];
  interests: string[];
};

export type Club = {
  id: string;
  name: string;
  description: string;
  image: string;
  tags: string[];
  members: number;
  contactEmail: string;
  facultyAdvisor: string;
  leadId: string;
};

export type EventProposal = {
  id: string;
  title: string;
  description?: string;
  location: string;
  category: string;
  registrationLink?: string;
  clubId?: string;
  clubName: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  createdBy: string; // UID of user
  creatorEmail: string;
  createdAt: any; // Firebase ServerTimestamp
  proposer?: string;
  // New fields for approval/rejection cycle
  approvedBy?: string;
  approvedAt?: any;
  rejectedBy?: string;
  rejectedAt?: any;
  rejectionReason?: string;
};
