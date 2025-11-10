'use server';
import {getAi} from './index';
import {startFlowsServer} from '@genkit-ai/flow';

// Initialize AI and import flows first
getAi();
import './flows/diksha-ai-tutor';
import './flows/generate-lesson-content';
import './flows/generate-lesson-plan';
import './flows/generate-lesson-topics';
import './flows/generate-quizzes';

// Start the Genkit flows server
startFlowsServer({
  port: 4000,
  cors: {},
});
