
'use client';
import Link from 'next/link';
import { useUser } from '@/firebase/auth/use-user';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import CourseCard from '@/components/course-card';
import { collection, query, where } from 'firebase/firestore';
import { Course } from '@/lib/types';

export default function MentorDashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const coursesQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'courses'), where('mentorId', '==', user.uid));
  }, [user, firestore]);
  const { data: courses, isLoading: coursesLoading } = useCollection<Course>(coursesQuery);

  if (coursesLoading || isUserLoading || !firestore) {
    return <div>Loading your courses...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Mentor Dashboard</h1>
        <p className="text-muted-foreground">Manage your courses and engage with your students.</p>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Your Courses</h2>
        <Button asChild>
          <Link href="/mentor/courses/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Course
          </Link>
        </Button>
      </div>

      {courses && courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <CourseCard key={course.id} course={course} userRole="mentor" />
          ))}
        </div>
      ) : (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <CardHeader>
            <CardTitle>No courses yet</CardTitle>
            <CardDescription>Start by creating your first course to share your knowledge.</CardDescription>
          </CardHeader>
          <Button asChild className="mt-4">
            <Link href="/mentor/courses/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create First Course
            </Link>
          </Button>
        </Card>
      )}
    </div>
  );
}
