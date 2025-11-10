
'use client';
import { useMemoFirebase, useCollection, useFirestore } from '@/firebase';
import { useUser } from '@/firebase/auth/use-user';
import { Course, Enrollment } from '@/lib/types';
import CourseCard from '@/components/course-card';
import { collection, query, where } from 'firebase/firestore';

export default function CoursesPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const coursesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'courses');
  }, [firestore]);
  const { data: allCourses, isLoading: coursesLoading } = useCollection<Course>(coursesQuery);

  const enrollmentsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'enrollments'), where('studentId', '==', user.uid));
  }, [firestore, user]);
  const { data: enrollments, isLoading: enrollmentsLoading } = useCollection<Enrollment>(enrollmentsQuery);

  if (coursesLoading || enrollmentsLoading || isUserLoading || !firestore) {
    return <div className="text-center">Loading courses...</div>;
  }

  const coursesWithEnrollment = allCourses?.map(course => ({
    ...course,
    isEnrolled: enrollments?.some(e => e.courseId === course.id) ?? false,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Course Catalog</h1>
        <p className="text-muted-foreground">Explore our available courses and start learning today.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coursesWithEnrollment?.map(course => (
          <CourseCard
            key={course.id}
            course={course}
            userRole="student"
            isEnrolled={course.isEnrolled}
            userId={user?.uid}
          />
        ))}
      </div>
    </div>
  );
}
