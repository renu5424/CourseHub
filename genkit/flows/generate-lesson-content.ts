'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating lesson content based on a given topic.
 *
 * It includes:
 * - `generateLessonContent`: The main function to trigger the lesson content generation flow.
 * - `GenerateLessonContentInput`: The input type for the `generateLessonContent` function.
 * - `GenerateLessonContentOutput`: The output type for the `generateLessonContent` function.
 */

import {getAi} from '../index';
import {z} from 'genkit';

const GenerateLessonContentInputSchema = z.object({
  topic: z.string().describe('The topic of the lesson.'),
});
export type GenerateLessonContentInput = z.infer<typeof GenerateLessonContentInputSchema>;

const GenerateLessonContentOutputSchema = z.object({
  content: z.string().describe('The main educational content for the lesson, in raw, unescaped HTML format.'),
  summary: z.string().describe('A concise summary of the lesson content, in raw, unescaped HTML format.'),
  exercise: z.string().describe('A hands-on exercise for the student to practice the concepts, in raw, unescaped HTML format.'),
});
export type GenerateLessonContentOutput = z.infer<typeof GenerateLessonContentOutputSchema>;

export async function generateLessonContent(
  input: GenerateLessonContentInput
): Promise<GenerateLessonContentOutput> {
  return generateLessonContentFlow(input);
}

const prompt = getAi().definePrompt({
  name: 'generateLessonContentPrompt',
  input: {schema: GenerateLessonContentInputSchema},
  output: {schema: GenerateLessonContentOutputSchema},
  prompt: `You are an expert educator. Generate comprehensive lesson content for the following topic: {{{topic}}}.

  The lesson content should be engaging and informative, provided in well-structured, raw HTML format. Do not escape HTML tags.
  Also provide a short summary of the lesson, also in raw HTML.
  Finally, create a hands-on exercise that allows a student to apply what they've learned. The exercise should be returned as clean, legible, and well-formatted raw HTML, using tags like <p>, <ol>, <ul>, <li>, and <strong> appropriately to ensure it is easy to read and follow. Do not escape the HTML tags.`,
});

const generateLessonContentFlow = getAi().defineFlow(
  {
    name: 'generateLessonContentFlow',
    inputSchema: GenerateLessonContentInputSchema,
    outputSchema: GenerateLessonContentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
