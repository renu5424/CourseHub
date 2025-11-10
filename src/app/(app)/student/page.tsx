
'use client';
import { useUser } from '@/firebase/auth/use-user';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { CourseList } from './course-list';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Course, Enrollment, UserProfile } from '@/lib/types';
import { useEffect, useState } from 'react';
import { useDoc } from '@/firebase/firestore/use-doc';
import { doc } from 'firebase/firestore';


export default function StudentDashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [completedCourses, setCompletedCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'userProfiles', user.uid);
  }, [firestore, user]);
  const { data: student, isLoading: studentLoading } = useDoc<UserProfile>(userProfileRef);

  const enrollmentsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'enrollments'), where('studentId', '==', user.uid));
  }, [firestore, user]);
  const { data: enrollments, isLoading: enrollmentsLoading } = useCollection<Enrollment>(enrollmentsQuery);

  useEffect(() => {
    async function fetchCourses() {
      if (!firestore || !enrollments) {
        if(!enrollmentsLoading){
            setLoading(false);
        }
        return;
      }

      setLoading(true);
      
      const courseIds = enrollments.map(e => e.courseId);
      if (courseIds.length === 0) {
        setEnrolledCourses([]);
        setCompletedCourses([]);
        setLoading(false);
        return;
      }
      
      const coursesCol = collection(firestore, 'courses');
      
      const coursePromises = [];
      // Firestore 'in' queries are limited to 30 items
      for (let i = 0; i < courseIds.length; i += 30) {
          const batchIds = courseIds.slice(i, i + 30);
          const coursesQuery = query(coursesCol, where('id', 'in', batchIds));
          coursePromises.push(getDocs(coursesQuery));
      }
      
      const courseSnapshots = await Promise.all(coursePromises);
      const allCourses = courseSnapshots.flatMap(snapshot => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course)));
      
      const enrolled = allCourses.filter(course =>
        enrollments.some(e => e.courseId === course.id && !e.completionDate)
      );
      
      const completed = allCourses.filter(course =>
        enrollments.some(e => e.courseId === course.id && e.completionDate)
      );
      
      setEnrolledCourses(enrolled);
      setCompletedCourses(completed);
      setLoading(false);
    };

    if (!enrollmentsLoading && firestore) {
        fetchCourses();
    }
  }, [enrollments, firestore, enrollmentsLoading]);

  if (loading || enrollmentsLoading || studentLoading || isUserLoading || !firestore) {
    return <div className="text-center">Loading your dashboard...</div>;
  }
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">My Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {student?.name}! Continue your learning journey.</p>
      </div>

      <CourseList title="Enrolled Courses" courses={enrolledCourses} userId={user?.uid} />
      <CourseList title="Completed Courses" courses={completedCourses} userId={user?.uid} />
    </div>
  );
}
