// src/ai/flows/event-recommendation.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow for recommending campus events to students based on their interests.
 *
 * - recommendEvents - A function that takes a student's profile and returns a list of recommended events.
 * - RecommendEventsInput - The input type for the recommendEvents function.
 * - RecommendEventsOutput - The return type for the recommendEvents function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the schema for a single event
const EventSchema = z.object({
  title: z.string().describe('The title of the event.'),
  description: z.string().describe('A brief description of the event.'),
  date: z.string().describe('The date of the event (YYYY-MM-DD).'),
  time: z.string().describe('The time of the event (HH:MM).'),
  location: z.string().describe('The location of the event.'),
  interests: z.array(z.string()).describe('A list of interests related to the event.'),
});

// Define the input schema for the recommendation flow
const RecommendEventsInputSchema = z.object({
  studentProfile: z.object({
    interests: z.array(z.string()).describe('A list of the student\'s interests.'),
    pastEvents: z.array(z.string()).optional().describe('A list of the student\'s past attended events.'),
  }).describe('The student profile, including interests and past events.'),
  availableEvents: z.array(EventSchema).describe('A list of available events.'),
});

export type RecommendEventsInput = z.infer<typeof RecommendEventsInputSchema>;

// Define the output schema for the recommendation flow
const RecommendEventsOutputSchema = z.array(EventSchema).describe('A list of recommended events.');

export type RecommendEventsOutput = z.infer<typeof RecommendEventsOutputSchema>;

// Exported function to call the flow
export async function recommendEvents(input: RecommendEventsInput): Promise<RecommendEventsOutput> {
  return recommendEventsFlow(input);
}

const recommendEventsPrompt = ai.definePrompt({
  name: 'recommendEventsPrompt',
  input: {schema: RecommendEventsInputSchema},
  output: {schema: RecommendEventsOutputSchema},
  prompt: `You are an AI event recommendation system.

  Given a student profile with interests: {{studentProfile.interests}}
  and a list of available events:
  {{#each availableEvents}}
  - Title: {{this.title}}, Description: {{this.description}}, Date: {{this.date}}, Time: {{this.time}}, Location: {{this.location}}, Interests: {{this.interests}}
  {{/each}}

  Recommend a list of events that the student would be interested in, based on their interests.
  Return ONLY the events in the list provided. DO NOT MAKE UP EVENTS.
  Consider the student's past events if provided.
  The response should be a JSON array of events.
  `,
});

const recommendEventsFlow = ai.defineFlow(
  {
    name: 'recommendEventsFlow',
    inputSchema: RecommendEventsInputSchema,
    outputSchema: RecommendEventsOutputSchema,
  },
  async input => {
    const {output} = await recommendEventsPrompt(input);
    return output!;
  }
);
