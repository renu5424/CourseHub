
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a complete lesson plan for a course.
 *
 * It includes:
 * - `generateLessonPlan`: The main function to trigger the lesson plan generation flow.
 * - `GenerateLessonPlanInput`: The input type for the `generateLessonPlan` function.
 * - `GenerateLessonPlanOutput`: The output type for the `generateLessonPlan` function.
 */

import {getAi} from '../index';
import {z} from 'genkit';

const GenerateLessonPlanInputSchema = z.object({
  courseTitle: z.string().describe('The title of the course.'),
  lessonTopics: z.array(z.string()).describe('An array of lesson topics for the course.'),
});
export type GenerateLessonPlanInput = z.infer<typeof GenerateLessonPlanInputSchema>;

const GenerateLessonPlanOutputSchema = z.object({
  lessonPlan: z
    .array(
      z.object({
        topic: z.string().describe('The topic of the lesson.'),
        content: z.string().describe('The main educational content for the lesson, in raw, unescaped HTML format.'),
        summary: z.string().describe('A concise summary of the lesson content, in raw, unescaped HTML format.'),
        exercise: z.string().describe('A hands-on exercise for the student to practice the concepts, in raw, unescaped HTML format.'),
      })
    )
    .describe('An array of lessons with their generated content.'),
});
export type GenerateLessonPlanOutput = z.infer<typeof GenerateLessonPlanOutputSchema>;

export async function generateLessonPlan(
  input: GenerateLessonPlanInput
): Promise<GenerateLessonPlanOutput> {
  return generateLessonPlanFlow(input);
}

const prompt = getAi().definePrompt({
  name: 'generateLessonPlanPrompt',
  input: {schema: GenerateLessonPlanInputSchema},
  output: {schema: GenerateLessonPlanOutputSchema},
  prompt: `You are an expert educator. Your task is to generate the lesson content for a course based on its title and a list of lesson topics.

Course Title: {{{courseTitle}}}

For each of the following topics, generate comprehensive lesson content, a summary, and a hands-on exercise. The content, summary, and exercise must be in raw, unescaped HTML format. Do not escape any HTML tags.

{{#each lessonTopics}}
- {{{this}}}
{{/each}}
`,
});

const generateLessonPlanFlow = getAi().defineFlow(
  {
    name: 'generateLessonPlanFlow',
    inputSchema: GenerateLessonPlanInputSchema,
    outputSchema: GenerateLessonPlanOutputSchema,
  },
  async (input: GenerateLessonPlanInput) => {
    const {output} = await prompt(input);
    return output!;
  }
);
