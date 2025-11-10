import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Course } from '@/lib/types';
import CourseCard from '@/components/course-card';

interface CourseListProps {
  title: string;
  courses: Course[];
  userId?: string;
}

export function CourseList({ title, courses, userId }: CourseListProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">{title}</h2>
      {courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <CourseCard key={course.id} course={course} userRole="student" userId={userId} />
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center border-dashed">
          <CardHeader>
            <CardTitle>Nothing here yet!</CardTitle>
            <CardDescription>
              {title.includes('Enrolled') 
                ? 'Browse the course catalog to find something new to learn.'
                : 'Complete a course to see it here.'}
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </section>
  );
}
