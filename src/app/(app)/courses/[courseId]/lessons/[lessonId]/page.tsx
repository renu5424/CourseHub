
'use client';
import { notFound, useParams } from 'next/navigation';
import { LessonView } from './lesson-view';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, orderBy } from 'firebase/firestore';
import { Course, Lesson } from '@/lib/types';

export default function LessonPage() {
  const params = useParams();

  if (!params) {
    notFound();
  }

  const courseId = params.courseId as string;
  const lessonId = params.lessonId as string;
  const firestore = useFirestore();

  const courseRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'courses', courseId);
  }, [firestore, courseId]);
  const { data: course, isLoading: courseLoading } = useDoc<Course>(courseRef);

  const lessonRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'courses', courseId, 'lessons', lessonId);
  }, [firestore, courseId, lessonId]);
  const { data: lesson, isLoading: lessonLoading } = useDoc<Lesson>(lessonRef);
  
  const lessonsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'courses', courseId, 'lessons'), orderBy('order'));
  }, [firestore, courseId]);
  const { data: allLessons, isLoading: lessonsLoading } = useCollection<Lesson>(lessonsQuery);


  if (courseLoading || lessonLoading || lessonsLoading) {
    return <div className="text-center">Loading lesson...</div>;
  }

  if (!course || !lesson) {
    notFound();
  }

  const lessonIndex = allLessons?.findIndex(l => l.id === lesson.id) ?? -1;
  const prevLesson = lessonIndex > 0 ? allLessons![lessonIndex - 1] : null;
  const nextLesson = (allLessons && lessonIndex < allLessons.length - 1) ? allLessons[lessonIndex + 1] : null;

  return <LessonView course={course} lesson={lesson} prevLesson={prevLesson} nextLesson={nextLesson} />;
}
