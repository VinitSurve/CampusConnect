// Summarize the event for the user.
'use server';
/**
 * @fileOverview Summarizes an event description.
 *
 * - summarizeEvent - A function that summarizes an event description.
 * - SummarizeEventInput - The input type for the summarizeEvent function.
 * - SummarizeEventOutput - The return type for the summarizeEvent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeEventInputSchema = z.object({
  eventDescription: z.string().describe('The full description of the event.'),
});
export type SummarizeEventInput = z.infer<typeof SummarizeEventInputSchema>;

const SummarizeEventOutputSchema = z.object({
  summary: z.string().describe('A one-sentence summary of the event.'),
});
export type SummarizeEventOutput = z.infer<typeof SummarizeEventOutputSchema>;

export async function summarizeEvent(input: SummarizeEventInput): Promise<SummarizeEventOutput> {
  return summarizeEventFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeEventPrompt',
  input: {schema: SummarizeEventInputSchema},
  output: {schema: SummarizeEventOutputSchema},
  prompt: `Summarize the following event description in one sentence:\n\n{{{eventDescription}}} `,
});

const summarizeEventFlow = ai.defineFlow(
  {
    name: 'summarizeEventFlow',
    inputSchema: SummarizeEventInputSchema,
    outputSchema: SummarizeEventOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
