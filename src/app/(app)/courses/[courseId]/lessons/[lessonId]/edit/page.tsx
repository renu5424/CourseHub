
'use client';
import { notFound, useParams } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Course, Lesson } from '@/lib/types';
import { EditLessonClient } from '@/app/(app)/mentor/courses/[courseId]/lessons/[lessonId]/edit/edit-lesson-client';
import { useUser } from '@/firebase/auth/use-user';

export default function EditLessonPage() {
  const params = useParams();

  if (!params) {
    notFound();
  }

  const courseId = params.courseId as string;
  const lessonId = params.lessonId as string;
  const firestore = useFirestore();
  const { isUserLoading } = useUser();

  const courseRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'courses', courseId);
  }, [firestore, courseId]);
  const { data: course, isLoading: courseLoading } = useDoc<Course>(courseRef);
  
  const lessonRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, `courses/${courseId}/lessons`, lessonId);
  }, [firestore, courseId, lessonId]);
  const { data: lesson, isLoading: lessonLoading } = useDoc<Lesson>(lessonRef);
  
  const isLoading = courseLoading || lessonLoading || isUserLoading || !firestore;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!course || !lesson) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto">
      <EditLessonClient course={course} lesson={lesson} />
    </div>
  );
}
