'use server'

import { allUsers, mockClubs, mockEvents, mockEventProposals, usersById } from './mock-data';
import type { Club, Event, EventProposal, User } from '@/types';

// Simulate a database delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function getUsers(): Promise<User[]> {
  await delay(100);
  return allUsers;
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  await delay(50);
  return allUsers.find(user => user.email === email);
}

export async function getUserById(userId: string): Promise<User | undefined> {
  await delay(50);
  return usersById[userId];
}

export async function createUser(userData: Omit<User, 'id' | 'avatar'>): Promise<User> {
  await delay(100);
  const existingUser = await getUserByEmail(userData.email);
  if (existingUser) {
    throw new Error('User with this email already exists.');
  }

  const newUser: User = {
    id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    ...userData,
    avatar: 'https://placehold.co/100x100.png',
    // Assign default values for optional fields if not provided
    ...(userData.role === 'student' && {
        course: userData.course || 'Undeclared',
        year: userData.year || 1,
        interests: userData.interests || [],
    }),
    ...(userData.role === 'faculty' && {
        department: userData.department || 'General Studies'
    })
  };

  allUsers.push(newUser);
  usersById[newUser.id] = newUser;

  return newUser;
}


export async function getEvents(): Promise<Event[]> {
  await delay(200);
  return mockEvents;
}

export async function getEventById(id: string): Promise<Event | undefined> {
  await delay(100);
  return mockEvents.find(event => event.id === id);
}

export async function getClubs(): Promise<Club[]> {
  await delay(200);
  return mockClubs;
}

export async function getEventProposals(): Promise<EventProposal[]> {
  await delay(150);
  return mockEventProposals;
}
