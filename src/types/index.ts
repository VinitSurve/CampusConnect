export type User = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'student' | 'organiser' | 'faculty';
  // Student-specific
  course?: string;
  year?: number;
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
};

export type EventProposal = {
  id:string;
  title: string;
  proposer: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
};
