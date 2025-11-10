'use server';
/**
 * @fileOverview An AI tutor for providing personalized lesson support and answering general questions.
 *
 * - dikshaAITutor - A function that handles the AI tutor interaction.
 * - DikshaAITutorInput - The input type for the dikshaAITutor function.
 * - DikshaAITutorOutput - The return type for the dikshaAITutor function.
 */

import {getAi} from '@/ai/genkit';
import {z} from 'zod';

const DikshaAITutorInputSchema = z.object({
  query: z.string().describe('The user query or question.'),
  lessonContent: z.string().optional().describe('The content of the lesson for context.'),
  explanationPreference: z
    .enum(['general', 'storytelling', 'simplification', 'analogy', 'real-world-example'])
    .default('general')
    .describe(
      'The preferred explanation style (general, storytelling, simplification, analogy, or real-world-example).'
    ),
});
export type DikshaAITutorInput = z.infer<typeof DikshaAITutorInputSchema>;

const DikshaAITutorOutputSchema = z.object({
  response: z.string().describe('The AI tutor response to the query, formatted as clean, unescaped HTML.'),
});
export type DikshaAITutorOutput = z.infer<typeof DikshaAITutorOutputSchema>;

export async function dikshaAITutor(input: DikshaAITutorInput): Promise<DikshaAITutorOutput> {
  return dikshaAITutorFlow(input);
}

const prompt = getAi().definePrompt({
  name: 'dikshaAITutorPrompt',
  input: {schema: DikshaAITutorInputSchema},
  output: {schema: DikshaAITutorOutputSchema},
  model: 'googleai/gemini-1.5-flash-latest',
  prompt: `You are Diksha, an AI tutor designed to help students learn. Your goal is to provide clear, legible, and well-structured answers.

You can answer general questions and provide help with lessons. You will use the explanationPreference to determine the explanation style to use to best serve the student.

Your response MUST be formatted as clean, raw, unescaped HTML. Use tags like <h3> for titles, <p> for paragraphs, <ul> and <li> for lists, and <strong> for important terms. Do not wrap your response in markdown.

Explanation Preference: {{explanationPreference}}

{{#if lessonContent}}
Here is the lesson content for context:
{{{lessonContent}}}
{{/if}}

Question: {{query}}
`,
});

const dikshaAITutorFlow = getAi().defineFlow(
  {
    name: 'dikshaAITutorFlow',
    inputSchema: DikshaAITutorInputSchema,
    outputSchema: DikshaAITutorOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
