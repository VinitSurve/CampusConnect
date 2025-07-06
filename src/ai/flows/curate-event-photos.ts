'use server';
/**
 * @fileOverview An AI flow to curate the best photos from a list of event images by returning their indices.
 *
 * - curateEventPhotos - A function that analyzes and selects the best photos.
 * - CurateEventPhotosInput - The input type for the function.
 * - CurateEventPhotosOutput - The output type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const CurateEventPhotosInputSchema = z.object({
  photoUrls: z.array(z.string()).describe('A list of URLs for the event photos, as data URIs.'),
});
export type CurateEventPhotosInput = z.infer<typeof CurateEventPhotosInputSchema>;

const CurateEventPhotosOutputSchema = z.object({
  curatedIndices: z
    .array(z.number())
    .describe('An array of the 0-based indices of the 4 best photos, in order of preference.'),
});
export type CurateEventPhotosOutput = z.infer<typeof CurateEventPhotosOutputSchema>;

export async function curateEventPhotos(input: CurateEventPhotosInput): Promise<CurateEventPhotosOutput> {
  // If there are 4 or fewer photos, no need to curate. Just return their indices.
  if (input.photoUrls.length <= 4) {
    return { curatedIndices: input.photoUrls.map((_, index) => index) };
  }
  return curateEventPhotosFlow(input);
}

const prompt = ai.definePrompt({
  name: 'curateEventPhotosPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: { schema: CurateEventPhotosInputSchema },
  output: { schema: CurateEventPhotosOutputSchema },
  prompt: `You are an expert photo editor for a college event website. I will provide you with a list of N photos from a recent campus event. Your task is to analyze all of them and select the 4 best photos that meet the following criteria:

- **High photographic quality:** Well-lit, in focus, and good composition. Avoid blurry or poorly framed shots.
- **Represents the event's energy:** Captures the overall mood (e.g., excitement of a competition, focus of a workshop, joy of a festival).
- **Showcases key moments:** Includes photos of speakers, crowds, activities, or winners. Prioritize photos with people in them.
- **Variety:** Try to select a diverse set of photos that tell a story of the event, not 4 similar shots.

Here are the photos:
{{#each photoUrls}}
- Photo {{index}}: {{media url=this}}
{{/each}}

From the N photos I provided, return a JSON object with a key "curatedIndices" containing an array of numbers. This array must contain the exact 0-based indices of the 4 photos you have selected as the best, in order of your preference. For example: [3, 0, 8, 5].
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
    const output = llmResponse.output;

    // Validate the AI's output. If it's invalid, return an empty array and let the client handle the fallback.
    if (!output || !Array.isArray(output.curatedIndices)) {
      console.error("AI Curation: Invalid or missing curatedIndices array in output.");
      return { curatedIndices: [] };
    }
    
    // Filter out any non-number or out-of-bounds indices from the AI's response.
    const validatedIndices = output.curatedIndices
      .filter(idx => typeof idx === 'number' && idx >= 0 && idx < input.photoUrls.length)
      .slice(0, 4); // Ensure we don't return more than 4 indices.
    
    return { curatedIndices: validatedIndices };
  }
);
