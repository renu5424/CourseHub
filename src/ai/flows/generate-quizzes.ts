'use server';

/**
 * @fileOverview Quiz generation flow.
 *
 * - generateQuizzes - A function that generates multiple-choice quizzes based on lesson content.
 * - GenerateQuizzesInput - The input type for the generateQuizzes function.
 * - GenerateQuizzesOutput - The return type for the generateQuizzes function.
 */

import {getAi} from '@/ai/genkit';
import {z} from 'zod';

const GenerateQuizzesInputSchema = z.object({
  lessonContent: z
    .string()
    .describe('The content of the lesson to generate quizzes from.'),
  difficulty: z
    .enum(['easy', 'medium', 'hard'])
    .describe('The difficulty level of the quiz.'),
  numQuestions: z
    .number()
    .default(10)
    .describe('The number of questions to generate.'),
});
export type GenerateQuizzesInput = z.infer<typeof GenerateQuizzesInputSchema>;

const GenerateQuizzesOutputSchema = z.object({
  quizzes: z.array(
    z.object({
      question: z.string().describe('The quiz question.'),
      options: z.array(z.string()).describe('The possible answers.'),
      correctAnswer: z.string().describe('The correct answer to the question.'),
    })
  ),
});
export type GenerateQuizzesOutput = z.infer<typeof GenerateQuizzesOutputSchema>;

export async function generateQuizzes(input: GenerateQuizzesInput): Promise<GenerateQuizzesOutput> {
  return generateQuizzesFlow(input);
}

const prompt = getAi().definePrompt({
  name: 'generateQuizzesPrompt',
  input: {schema: GenerateQuizzesInputSchema},
  output: {schema: GenerateQuizzesOutputSchema},
  model: 'googleai/gemini-1.5-flash-latest',
  prompt: `You are a quiz generator. Your task is to create a unique, engaging, and challenging multiple-choice quiz based on the provided lesson content.

  Follow these instructions precisely:
  1.  **Analyze Content:** Carefully review the provided lesson content.
  2.  **Set Difficulty:** The quiz's difficulty MUST strictly match the requested level: {{{difficulty}}}.
      -   **Easy:** Questions should be straightforward, testing basic recall and definitions.
      -   **Medium:** Questions should require some interpretation or connection of concepts.
      -   **Hard:** Questions should demand deep understanding, application, or synthesis of information.
  3.  **Number of Questions:** Generate exactly {{{numQuestions}}} questions.
  4.  **Format:** Each question must have a clear question, a list of plausible options, and one single correct answer.

  Lesson Content:
  {{{lessonContent}}}

  Now, generate the quiz in the required JSON format.`,
});

const generateQuizzesFlow = getAi().defineFlow(
  {
    name: 'generateQuizzesFlow',
    inputSchema: GenerateQuizzesInputSchema,
    outputSchema: GenerateQuizzesOutputSchema,
  },
  async (input: GenerateQuizzesInput) => {
    const {output} = await prompt(input);
    return output!;
  }
);
