
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
  template: z.string().optional().describe('The type of template the user started with, e.g., "speaker_session". This should heavily influence the category.'),
});
export type GenerateEventDetailsInput = z.infer<typeof GenerateEventDetailsInputSchema>;

const GenerateEventDetailsOutputSchema = z.object({
  description: z.string().describe('A clear, engaging, and exciting summary for the event, around 300 characters long.'),
  category: z.enum(['Academic', 'Cultural', 'Technical', 'Sports', 'Workshop', 'Social', 'Networking', 'Guest Speaker']).describe('The single best category for the event.'),
  whatYouWillLearn: z.string().describe('A bulleted list of 3-5 key takeaways or skills that attendees will learn, with each point starting with a hyphen.'),
  tags: z.array(z.string()).describe('A list of 3-5 relevant keywords or tags for the event to help with discoverability.'),
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
Based on the event title "{{title}}", generate the following details.

{{#if template}}
The user started from a "{{template}}" template. Use this as a strong hint for the category and content. For example, a "speaker_session" should likely have the "Guest Speaker" category.
{{/if}}

1.  **description**: A clear, engaging, and exciting summary, around 300 characters. Highlight what makes the event unique or fun. Do not include date, time, or location details.
2.  **category**: Choose the single best category from this list: Academic, Cultural, Technical, Sports, Workshop, Social, Networking, Guest Speaker.
3.  **whatYouWillLearn**: A bulleted list of 3-5 key takeaways or skills that attendees will learn. Phrase them as actionable learning outcomes. Start each point with a hyphen.
4.  **tags**: A list of 3-5 single-word or short-phrase tags that will help students discover the event (e.g., "AI", "Machine Learning", "Career", "Guest Speaker", "Python", "Music").

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
    try {
        const llmResponse = await prompt(input);
        if (!llmResponse.output) {
            throw new Error('The AI model did not return the expected output. Please try again.');
        }
        return llmResponse.output;
    } catch (error: any) {
        console.error("AI Generation Error in Flow:", error);
        if (error.message && (error.message.includes('503') || error.message.toLowerCase().includes('overloaded'))) {
            throw new Error('The AI service is currently busy. Please try again in a moment.');
        }
        throw new Error('An unexpected error occurred while generating event details.');
    }
  }
);
