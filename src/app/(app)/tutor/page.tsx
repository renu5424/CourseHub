'use client';

import { AiTutor } from '@/components/ai-tutor';

export default function TutorPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">AI Tutor</h1>
        <p className="text-muted-foreground">
          Have a question? Ask our AI tutor for help on any topic.
        </p>
      </div>
      <AiTutor lessonContent="" />
    </div>
  );
}
