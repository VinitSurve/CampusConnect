'use server';
/**
 * @fileOverview A flow to generate an event description.
 *
 * - generateEventDescription - A function that generates a description for an event.
 * - GenerateEventDescriptionInput - The input type for the generateEventDescription function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateEventDescriptionInputSchema = z.object({
  title: z.string().describe('The title of the event.'),
});
export type GenerateEventDescriptionInput = z.infer<typeof GenerateEventDescriptionInputSchema>;

export async function generateEventDescription(input: GenerateEventDescriptionInput): Promise<string> {
  return generateEventDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateEventDescriptionPrompt',
  input: { schema: GenerateEventDescriptionInputSchema },
  // No output schema means the output is a string
  prompt: `You are an expert event planner for a college campus.
Generate a clear, engaging, and exciting summary for an event titled "{{title}}".
The description should be concise, ideally under 200 characters, and encourage students to attend.
Highlight what makes the event unique or fun. Do not include date, time, or location details.
Just provide the description text, with no preamble or titles.
`,
});

const generateEventDescriptionFlow = ai.defineFlow(
  {
    name: 'generateEventDescriptionFlow',
    inputSchema: GenerateEventDescriptionInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const llmResponse = await prompt(input);
    return llmResponse.text;
  }
);
