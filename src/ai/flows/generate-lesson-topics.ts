'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating lesson topics based on a course title and description.
 *
 * It exports:
 * - `generateLessonTopics`: An async function that takes a course title and returns a list of suggested lesson topics.
 * - `GenerateLessonTopicsInput`: The input type for the `generateLessonTopics` function.
 * - `GenerateLessonTopicsOutput`: The output type for the `generateLessonTopics` function.
 */

import {getAi} from '@/ai/genkit';
import {z} from 'zod';

const GenerateLessonTopicsInputSchema = z.object({
  courseTitle: z.string().describe('The title of the course.'),
  courseDescription: z.string().describe('The description of the course.'),
});
export type GenerateLessonTopicsInput = z.infer<typeof GenerateLessonTopicsInputSchema>;

const GenerateLessonTopicsOutputSchema = z.object({
  lessonTopics: z.array(z.string()).describe('A list of suggested lesson topics.'),
});
export type GenerateLessonTopicsOutput = z.infer<typeof GenerateLessonTopicsOutputSchema>;

export async function generateLessonTopics(input: GenerateLessonTopicsInput): Promise<GenerateLessonTopicsOutput> {
  return generateLessonTopicsFlow(input);
}

const prompt = getAi().definePrompt({
  name: 'generateLessonTopicsPrompt',
  input: {schema: GenerateLessonTopicsInputSchema},
  output: {schema: GenerateLessonTopicsOutputSchema},
  model: 'googleai/gemini-1.5-flash-latest',
  prompt: `You are an AI assistant designed to suggest relevant lesson topics for a course based on its title and description.

  Course Title: {{{courseTitle}}}
  Course Description: {{{courseDescription}}}

  Please suggest 5 lesson topics that would be engaging and informative for students. Return the topics as a JSON array of strings.
  Do not include any additional information other than the array. For example:
  ["Topic 1", "Topic 2", "Topic 3", "Topic 4", "Topic 5"]`,
});

const generateLessonTopicsFlow = getAi().defineFlow(
  {
    name: 'generateLessonTopicsFlow',
    inputSchema: GenerateLessonTopicsInputSchema,
    outputSchema: GenerateLessonTopicsOutputSchema,
  },
  async (input: GenerateLessonTopicsInput) => {
    const {output} = await prompt(input);
    return output!;
  }
);
