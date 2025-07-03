import type { User, Event, Club, EventProposal } from '@/types';

export const mockStudent: User = {
  id: 'user-student',
  uid: 'user-student',
  name: 'Alex Johnson',
  email: 'alex.j@university.edu',
  avatar: 'https://placehold.co/100x100.png',
  role: 'student',
  course: 'Computer Science',
  year: 3,
  interests: ['technology', 'music', 'gaming', 'sustainability'],
};

export const mockOrganiser: User = {
  id: 'user-organiser',
  uid: 'user-organiser',
  name: 'Ben Carter',
  email: 'ben.c@university.edu',
  avatar: 'https://placehold.co/100x100.png',
  role: 'student', // Organiser is a student who is a club lead
  course: 'Event Management',
  year: 2,
  interests: ['social', 'planning', 'music', 'community'],
};

export const mockFaculty: User = {
    id: 'user-faculty',
    uid: 'user-faculty',
    name: 'Dr. Evelyn Reed',
    email: 'e.reed@university.edu',
    avatar: 'https://placehold.co/100x100.png',
    role: 'faculty',
    department: 'Computer Science'
};

export const mockUjwalaFaculty: User = {
    id: 'user-faculty-ujwala',
    uid: 'user-faculty-ujwala',
    name: 'Ujwala',
    email: 'ujwala@gmail.com',
    avatar: 'https://placehold.co/100x100.png',
    role: 'faculty',
    department: 'Engineering'
};

// Changed to `let` to allow adding new users during registration
export let allUsers: User[] = [mockStudent, mockOrganiser, mockFaculty, mockUjwalaFaculty];

// Changed to `let` to allow adding new users during registration
export let usersById: Record<string, User> = {
  [mockStudent.id]: mockStudent,
  [mockOrganiser.id]: mockOrganiser,
  [mockFaculty.id]: mockFaculty,
  [mockUjwalaFaculty.id]: mockUjwalaFaculty,
};

export const mockEvents: Event[] = [
  {
    id: 'event-1',
    title: 'Annual Hackathon 2024',
    description: 'Join us for 24 hours of coding, innovation, and fun.',
    longDescription: 'The Annual Hackathon is back! This year, we challenge you to build projects that address sustainability goals. Mentors from top tech companies will be available. Food, drinks, and swag provided. All skill levels welcome.',
    date: '2024-10-26',
    time: '18:00',
    location: 'lab401',
    organizer: 'CS Club',
    category: 'Technology',
    image: 'https://placehold.co/600x400.png',
    attendees: 88,
    capacity: 150,
    registrationLink: '#',
    status: 'upcoming',
    gallery: ['https://placehold.co/400x300.png', 'https://placehold.co/400x300.png', 'https://placehold.co/400x300.png'],
    tags: ['technology', 'coding', 'innovation', 'sustainability']
  },
  {
    id: 'event-2',
    title: 'Music Fest on the Green',
    description: 'Live bands, food trucks, and good vibes.',
    longDescription: 'End the semester with a bang! Our annual Music Fest features talented local and student bands. Bring a blanket, relax on the green, and enjoy the music. Food trucks will offer a variety of delicious options.',
    date: '2024-09-15',
    time: '14:00',
    location: 'seminar',
    organizer: 'Student Life Office',
    category: 'Music',
    image: 'https://placehold.co/600x400.png',
    attendees: 450,
    capacity: 1000,
    registrationLink: '#',
    status: 'upcoming',
    gallery: [],
    tags: ['music', 'social', 'food']
  },
  {
    id: 'event-3',
    title: 'Career Fair: Tech & Engineering',
    description: 'Meet recruiters from top companies in the industry.',
    longDescription: 'Looking for an internship or a full-time job? Don\'t miss this opportunity to connect with recruiters from leading tech and engineering firms. Bring your resume and dress professionally. Pre-registration is recommended.',
    date: '2024-11-05',
    time: '10:00',
    location: 'University Gymnasium',
    organizer: 'Career Services',
    category: 'Career',
    image: 'https://placehold.co/600x400.png',
    attendees: 0,
    capacity: 2000,
    registrationLink: '#',
    status: 'upcoming',
    gallery: [],
    tags: ['career', 'technology', 'engineering', 'networking']
  },
    {
    id: 'event-4',
    title: 'Guest Lecture: AI Ethics',
    description: 'A talk by Dr. Anya Sharma on the future of AI.',
    longDescription: 'Join us for an insightful lecture by renowned AI researcher Dr. Anya Sharma. She will discuss the ethical implications of artificial intelligence and its growing impact on society. A Q&A session will follow the talk.',
    date: '2024-10-29',
    time: '16:00',
    location: 'seminar',
    organizer: 'Philosophy Department',
    category: 'Academic',
    image: 'https://placehold.co/600x400.png',
    attendees: 120,
    capacity: 250,
    registrationLink: '#',
    status: 'upcoming',
    gallery: [],
    tags: ['technology', 'AI', 'ethics', 'academic']
  },
];


export const mockClubs: Club[] = [
  {
    id: 'club-1',
    name: 'Computer Science Club',
    description: 'A club for students passionate about coding, development, and tech innovations. We host workshops, hackathons, and guest speaker events.',
    image: 'https://placehold.co/300x200.png',
    tags: ['Technology', 'Coding', 'Academic'],
    members: 125,
    contactEmail: 'cs.club@university.edu',
    facultyAdvisor: 'Dr. Alan Grant',
    leadId: 'user-organiser'
  },
  {
    id: 'club-2',
    name: 'Photography Club',
    description: 'Whether you use a DSLR or a smartphone, join us to explore the art of photography. We organize photo walks, workshops, and gallery visits.',
    image: 'https://placehold.co/300x200.png',
    tags: ['Arts', 'Creative', 'Hobby'],
    members: 68,
    contactEmail: 'photo.club@university.edu',
    facultyAdvisor: 'Prof. Sarah Harding',
    leadId: 'user-student' // Example, Alex can lead this
  },
  {
    id: 'club-3',
    name: 'Debate Society',
    description: 'Sharpen your public speaking and critical thinking skills. We participate in regional tournaments and host on-campus debates on current events.',
    image: 'https://placehold.co/300x200.png',
    tags: ['Public Speaking', 'Politics', 'Academic'],
    members: 45,
    contactEmail: 'debate@university.edu',
    facultyAdvisor: 'Dr. Ian Malcolm',
    leadId: ''
  },
  {
    id: 'club-4',
    name: 'Campus Green Initiative',
    description: 'A student-led group dedicated to promoting sustainability on campus. Join our recycling drives, community gardening, and awareness campaigns.',
    image: 'https://placehold.co/300x200.png',
    tags: ['Sustainability', 'Environment', 'Volunteering'],
    members: 92,
    contactEmail: 'green@university.edu',
    facultyAdvisor: 'Dr. Ellie Sattler',
    leadId: ''
  },
];


export const mockEventProposals: EventProposal[] = [
    {
        id: 'prop-1',
        title: 'Introduction to Quantum Computing Workshop',
        proposer: 'Physics Club',
        clubName: 'Physics Club',
        date: '2024-11-15',
        status: 'pending',
        location: 'lab503',
        category: 'academic',
        createdBy: 'some-user-id',
        creatorEmail: 'some-user@email.com',
        createdAt: new Date().toISOString(),
    },
    {
        id: 'prop-2',
        title: 'Annual Charity Bake Sale',
        proposer: 'Volunteer Action Group',
        clubName: 'Volunteer Action Group',
        date: '2024-12-02',
        status: 'pending',
        location: 'seminar',
        category: 'social',
        createdBy: 'some-user-id',
        creatorEmail: 'some-user@email.com',
        createdAt: new Date().toISOString(),
    },
    {
        id: 'prop-3',
        title: 'Outdoor Movie Night: Sci-Fi Classics',
        proposer: 'Film Society',
        clubName: 'Film Society',
        date: '2024-10-20',
        status: 'approved',
        location: 'Central Campus Green',
        category: 'social',
        createdBy: 'some-user-id',
        creatorEmail: 'some-user@email.com',
        createdAt: new Date().toISOString(),
    },
    {
        id: 'prop-4',
        title: 'Inter-departmental Paintball Tournament',
        proposer: 'Recreation Committee',
        clubName: 'Recreation Committee',
        date: '2024-11-09',
        status: 'rejected',
        location: 'Sports Complex',
        category: 'sports',
        createdBy: 'some-user-id',
        creatorEmail: 'some-user@email.com',
        createdAt: new Date().toISOString(),
    }
]
