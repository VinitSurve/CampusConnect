'use server';
/**
 * @fileOverview A flow to generate key takeaways for an event.
 *
 * - generateEventTakeaways - A function that generates a list of what attendees will learn.
 * - GenerateEventTakeawaysInput - The input type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateEventTakeawaysInputSchema = z.object({
  title: z.string().describe('The title of the event.'),
  description: z.string().describe('The description of the event.'),
});
export type GenerateEventTakeawaysInput = z.infer<typeof GenerateEventTakeawaysInputSchema>;

export async function generateEventTakeaways(input: GenerateEventTakeawaysInput): Promise<string> {
  return generateEventTakeawaysFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateEventTakeawaysPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: { schema: GenerateEventTakeawaysInputSchema },
  // No output schema means the output is a string
  prompt: `You are an expert event curriculum designer for a college campus.
Based on the event title "{{title}}" and its description "{{description}}", generate a bulleted list of 3-5 key takeaways or skills that attendees will learn.
Phrase them as actionable learning outcomes.
For example:
- Learn to build a full-stack application
- Understand the core principles of AI ethics
- Discover new networking strategies

Format the output as a simple text list, with each point starting with a hyphen. Do not include any preamble or titles.
`,
});

const generateEventTakeawaysFlow = ai.defineFlow(
  {
    name: 'generateEventTakeawaysFlow',
    inputSchema: GenerateEventTakeawaysInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const llmResponse = await prompt(input);
    return llmResponse.text;
  }
);
