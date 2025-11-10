
'use client';

import { Course, CourseCategory, Lesson } from '@/lib/types';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { BookOpen, Edit, CheckCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, orderBy, query } from 'firebase/firestore';

interface CourseCardProps {
  course: Course;
  userRole: 'mentor' | 'student';
  isEnrolled?: boolean;
  userId?: string;
}

const categoryColorMap: Record<CourseCategory, string> = {
  Programming: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  History: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  Science: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  Art: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  Music: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  Wellness: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  Other: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
};


export default function CourseCard({
  course,
  userRole,
  isEnrolled = false,
  userId,
}: CourseCardProps) {
  const firestore = useFirestore();

  const lessonsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'courses', course.id, 'lessons'), orderBy('order'));
  }, [firestore, course.id]);

  const { data: lessons } = useCollection<Lesson>(lessonsQuery);
  
  const linkHref = userRole === 'mentor' ? `/mentor/courses/${course.id}/edit` : `/courses/${course.id}`;

  const lesson_count = lessons?.length ?? course.lessons?.length ?? 0;

  return (
    <Card className="flex flex-col h-full overflow-hidden transition-all hover:shadow-lg">
      <Link href={linkHref} className="block">
        <div className={cn("relative flex items-center justify-center h-48 w-full font-bold text-2xl", categoryColorMap[course.category])}>
          {course.category}
        </div>
      </Link>
      <CardHeader>
        <Link href={linkHref}>
          <CardTitle className="hover:text-primary transition-colors">{course.title}</CardTitle>
        </Link>
        <CardDescription className="line-clamp-2">{course.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="text-sm text-muted-foreground flex items-center">
            <BookOpen className="h-4 w-4 mr-2" />
            <span>{lesson_count} {lesson_count === 1 ? 'Lesson' : 'Lessons'}</span>
          </div>
      </CardContent>
      <CardFooter>
        {userRole === 'mentor' && (
          <Button asChild className="w-full">
            <Link href={`/mentor/courses/${course.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" /> Manage Course
            </Link>
          </Button>
        )}
        {userRole === 'student' && (
           <Button asChild className="w-full">
             <Link href={linkHref}>
               {isEnrolled && <CheckCircle className="mr-2 h-4 w-4" />}
              {isEnrolled ? 'Continue Learning' : 'View Course'} <ArrowRight className="ml-2 h-4 w-4" />
             </Link>
           </Button>
        )}
      </CardFooter>
    </Card>
  );
}
