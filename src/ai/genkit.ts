'use server';

import {genkit, type Genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

let ai: Genkit;

export function getAi() {
  if (ai) {
    return ai;
  }

  const plugins = [];
  if (process.env.GEMINI_API_KEY) {
    plugins.push(googleAI({apiKey: process.env.GEMINI_API_KEY}));
  } else {
    console.warn(
      'GEMINI_API_KEY is not set. AI features will not be available.'
    );
  }

  ai = genkit({
    plugins,
  });

  return ai;
}
