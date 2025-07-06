'use server';
/**
 * @fileOverview An AI flow to curate the best photos from a list of event images.
 *
 * - curateEventPhotos - A function that analyzes and selects the best photos.
 * - CurateEventPhotosInput - The input type for the function.
 * - CurateEventPhotosOutput - The output type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const CurateEventPhotosInputSchema = z.object({
  photoUrls: z.array(z.string().url()).describe('A list of URLs for the event photos.'),
});
export type CurateEventPhotosInput = z.infer<typeof CurateEventPhotosInputSchema>;

const CurateEventPhotosOutputSchema = z.object({
  curatedUrls: z
    .array(z.string().url())
    .describe('A list containing the URLs of the 4 best photos, in order of preference.'),
});
export type CurateEventPhotosOutput = z.infer<typeof CurateEventPhotosOutputSchema>;

export async function curateEventPhotos(input: CurateEventPhotosInput): Promise<CurateEventPhotosOutput> {
  // If there are 4 or fewer photos, no need to curate. Just return them.
  if (input.photoUrls.length <= 4) {
    return { curatedUrls: input.photoUrls };
  }
  return curateEventPhotosFlow(input);
}

const prompt = ai.definePrompt({
  name: 'curateEventPhotosPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: { schema: CurateEventPhotosInputSchema },
  output: { schema: CurateEventPhotosOutputSchema },
  prompt: `You are an expert photo editor for a college event website. I will provide you with a list of photos from a recent campus event. Your task is to analyze all of them and select the 4 best photos that meet the following criteria:

- **High photographic quality:** Well-lit, in focus, and good composition. Avoid blurry or poorly framed shots.
- **Represents the event's energy:** Captures the overall mood (e.g., excitement of a competition, focus of a workshop, joy of a festival).
- **Showcases key moments:** Includes photos of speakers, crowds, activities, or winners. Prioritize photos with people in them.
- **Variety:** Try to select a diverse set of photos that tell a story of the event, not 4 similar shots.

Here are the photos:
{{#each photoUrls}}
- Photo: {{media url=this}}
{{/each}}

From the list of URLs I provided, return a JSON object with a key "curatedUrls" containing an array of strings. This array must contain the exact URLs of the 4 photos you have selected as the best, in order of your preference.
`,
});


const curateEventPhotosFlow = ai.defineFlow(
  {
    name: 'curateEventPhotosFlow',
    inputSchema: CurateEventPhotosInputSchema,
    outputSchema: CurateEventPhotosOutputSchema,
  },
  async (input) => {
    const llmResponse = await prompt(input);
    return llmResponse.output!;
  }
);
