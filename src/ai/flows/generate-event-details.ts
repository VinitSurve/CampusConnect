'use server';
/**
 * @fileOverview A flow to generate multiple event details from a title.
 *
 * - generateEventDetails - A function that generates details for an event.
 * - GenerateEventDetailsInput - The input type for the function.
 * - GenerateEventDetailsOutput - The output type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateEventDetailsInputSchema = z.object({
  title: z.string().describe('The title of the event.'),
});
export type GenerateEventDetailsInput = z.infer<typeof GenerateEventDetailsInputSchema>;

const GenerateEventDetailsOutputSchema = z.object({
  description: z.string().describe('A clear, engaging, and exciting summary for the event, around 300 characters long.'),
  category: z.enum(['Academic', 'Cultural', 'Technical', 'Sports', 'Workshop']).describe('The single best category for the event.'),
  whatYouWillLearn: z.string().describe('A bulleted list of 3-5 key takeaways or skills that attendees will learn, with each point starting with a hyphen.'),
  targetAudience: z.array(z.string()).describe('A list of suitable student groups for this event.'),
});
export type GenerateEventDetailsOutput = z.infer<typeof GenerateEventDetailsOutputSchema>;


export async function generateEventDetails(input: GenerateEventDetailsInput): Promise<GenerateEventDetailsOutput> {
  return generateEventDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateEventDetailsPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: { schema: GenerateEventDetailsInputSchema },
  output: { schema: GenerateEventDetailsOutputSchema },
  prompt: `You are an expert event planner for a college campus.
Based on the event title "{{title}}", generate the following details:

1.  **description**: A clear, engaging, and exciting summary, around 300 characters. Highlight what makes the event unique or fun. Do not include date, time, or location details.
2.  **category**: Choose the single best category from this list: Academic, Cultural, Technical, Sports, Workshop.
3.  **whatYouWillLearn**: A bulleted list of 3-5 key takeaways or skills that attendees will learn. Phrase them as actionable learning outcomes. Start each point with a hyphen.
4.  **targetAudience**: A list of suitable student groups. Choose from this list: All Students, BCA, BBA, BAF, MBA. You can select one or more.

Return the output as a JSON object.
`,
});

const generateEventDetailsFlow = ai.defineFlow(
  {
    name: 'generateEventDetailsFlow',
    inputSchema: GenerateEventDetailsInputSchema,
    outputSchema: GenerateEventDetailsOutputSchema,
  },
  async (input) => {
    const llmResponse = await prompt(input);
    return llmResponse.output!;
  }
);
