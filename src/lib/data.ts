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
