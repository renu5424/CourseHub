
'use client';
import { notFound, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookText, ArrowRight, Loader2 } from 'lucide-react';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, orderBy, where } from 'firebase/firestore';
import { Course, CourseCategory, Lesson, Enrollment } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useUser } from '@/firebase/auth/use-user';
import { useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import { enrollInCourseAction } from '@/app/actions';


const categoryColorMap: Record<CourseCategory, string> = {
  Programming: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  History: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  Science: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  Art: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  Music: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  Wellness: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  Other: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
};

export default function CoursePage() {
  const params = useParams();

  if (!params) {
    notFound();
  }

  const courseId = params.courseId as string;
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const courseRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'courses', courseId);
  }, [firestore, courseId]);
  const { data: course, isLoading: courseLoading } = useDoc<Course>(courseRef);

  const lessonsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'courses', courseId, 'lessons'), orderBy('order'));
  }, [firestore, courseId]);
  const { data: lessons, isLoading: lessonsLoading } = useCollection<Lesson>(lessonsQuery);

  const enrollmentsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'enrollments'), where('studentId', '==', user.uid), where('courseId', '==', courseId));
  }, [firestore, user, courseId]);

  const { data: enrollments, isLoading: enrollmentsLoading } = useCollection<Enrollment>(enrollmentsQuery);
  const isEnrolled = enrollments ? enrollments.length > 0 : false;
  
  if (courseLoading || lessonsLoading || enrollmentsLoading || isUserLoading || !firestore) {
    return <div className="text-center">Loading course...</div>;
  }

  if (!course) {
    notFound();
  }
  
  const handleEnroll = () => {
    if (!user) return;
    startTransition(async () => {
      const result = await enrollInCourseAction(user.uid, course.id);
      if (result.success) {
        toast({ title: 'Success', description: `You have enrolled in "${course.title}".` });
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
      }
    });
  };

  const sortedLessons = lessons ? [...lessons].sort((a,b) => a.order - b.order) : [];
  const firstLesson = sortedLessons[0];
  
  const CTAButton = () => {
    if (!firstLesson) return null;

    if (isEnrolled) {
        return (
            <Button asChild size="lg">
                <Link href={`/courses/${course.id}/lessons/${firstLesson.id}`}>
                    Continue Learning <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        );
    }

    return (
        <Button onClick={handleEnroll} disabled={isPending} size="lg">
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Enroll Now'}
        </Button>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="relative h-64 rounded-lg overflow-hidden mb-8">
        <div className={cn("absolute inset-0 flex items-center justify-center font-bold text-4xl", categoryColorMap[course.category])}>
          {course.category}
        </div>
        <div className="absolute inset-0 bg-black/50 flex flex-col justify-end p-8">
            <h1 className="text-4xl font-bold text-white">{course.title}</h1>
        </div>
      </div>
      <div className="flex justify-between items-start mb-8">
        <p className="text-lg text-muted-foreground max-w-prose">{course.description}</p>
        <CTAButton />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Course Lessons</CardTitle>
          <CardDescription>Select a lesson to begin learning.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {sortedLessons.map(lesson => (
              <li key={lesson.id}>
                <Link href={`/courses/${course.id}/lessons/${lesson.id}`}>
                    <div className="flex items-center p-4 rounded-md transition-colors hover:bg-muted">
                        <BookText className="h-5 w-5 mr-4 text-primary" />
                        <span className="flex-grow font-medium">{lesson.title}</span>
                    </div>
                </Link>
              </li>
            ))}
          </ul>
           {sortedLessons.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                    <p>Lessons are coming soon!</p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
