
'use client';

import { Course, Enrollment, Lesson } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight, FileText, BrainCircuit, BookCheck, FileQuestion, Lock, Loader2 } from 'lucide-react';
import { QuizView } from '@/components/quiz-view';
import { AiTutor } from '@/components/ai-tutor';
import { Icons } from '@/components/icons';
import { useState, useTransition } from 'react';
import { useUser } from '@/firebase/auth/use-user';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { enrollInCourseAction } from '@/app/actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface LessonViewProps {
  course: Course;
  lesson: Lesson;
  prevLesson: Lesson | null;
  nextLesson: Lesson | null;
}

export function LessonView({ course, lesson, prevLesson, nextLesson }: LessonViewProps) {
  const [activeTab, setActiveTab] = useState('content');
  const [tutorInitialQuery, setTutorInitialQuery] = useState<string | undefined>(undefined);
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const enrollmentsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'enrollments'), where('studentId', '==', user.uid), where('courseId', '==', course.id));
  }, [firestore, user, course.id]);

  const { data: enrollments, isLoading: enrollmentsLoading } = useCollection<Enrollment>(enrollmentsQuery);
  
  const isEnrolled = enrollments ? enrollments.length > 0 : false;

  const handleQuizFail = (failMessage: string) => {
    setTutorInitialQuery(failMessage);
    setActiveTab('tutor');
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
  }
  
  const GatedContentMessage = ({ showButton }: { showButton: boolean }) => (
    <Card>
      <CardContent className="flex flex-col items-center justify-center h-64 gap-4 text-center">
          <Lock className="h-12 w-12 text-muted-foreground" />
          <h3 className="text-xl font-semibold">Enroll to Unlock</h3>
          <p className="text-muted-foreground">Enroll in this course to access this feature.</p>
          {showButton && (
            <Button onClick={handleEnroll} disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enroll Now
            </Button>
          )}
      </CardContent>
    </Card>
  );


  const renderGatedContent = (component: React.ReactNode, showEnrollButton = true) => {
    if (enrollmentsLoading) {
      return (
        <Card>
          <CardContent className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      );
    }
    if (isEnrolled) {
      return component;
    }
    return <GatedContentMessage showButton={showEnrollButton} />;
  };


  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <Link href={`/courses/${course.id}`} className="text-sm text-primary hover:underline mb-2 inline-block">
          &larr; Back to {course.title}
        </Link>
        <h1 className="text-4xl font-bold">{lesson.title}</h1>
      </div>

       {!isEnrolled && !enrollmentsLoading && (
        <Alert className="mb-8 flex items-center justify-between">
          <div>
            <AlertTitle className="font-bold">You are previewing this course</AlertTitle>
            <AlertDescription>
              Enroll to track your progress and use the AI Tutor.
            </AlertDescription>
          </div>
           <Button onClick={handleEnroll} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enroll Now
            </Button>
        </Alert>
      )}


      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="content"><FileText className="mr-2 h-4 w-4" />Lesson</TabsTrigger>
          <TabsTrigger value="summary"><BookCheck className="mr-2 h-4 w-4" />Summary</TabsTrigger>
          <TabsTrigger value="exercise"><FileQuestion className="mr-2 h-4 w-4" />Exercise</TabsTrigger>
          <TabsTrigger value="quiz"><BrainCircuit className="mr-2 h-4 w-4" />Quiz</TabsTrigger>
          <TabsTrigger value="tutor"><Icons.diksha className="mr-2 h-4 w-4" />AI Tutor</TabsTrigger>
        </TabsList>
        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle>Lesson Material</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: lesson.content || '<p>No content available for this lesson.</p>' }}
              />
            </CardContent>
          </Card>
        </TabsContent>
         <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>Lesson Summary</CardTitle>
              <CardDescription>A quick recap of the key points from this lesson.</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: lesson.summary || '<p>No summary available.</p>' }}
              />
            </CardContent>
          </Card>
        </TabsContent>
         <TabsContent value="exercise">
          <Card>
            <CardHeader>
              <CardTitle>Hands-on Exercise</CardTitle>
               <CardDescription>Apply what you&apos;ve learned with this practical exercise.</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: lesson.exercise || '<p>No exercise available.</p>' }}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="quiz">
          <QuizView 
            course={course}
            nextLesson={nextLesson}
            onQuizFail={handleQuizFail}
          />
        </TabsContent>
        <TabsContent value="tutor">
          {renderGatedContent(
            <AiTutor lessonContent={lesson.content || ''} initialQuery={tutorInitialQuery} />
          )}
        </TabsContent>
      </Tabs>

      <div className="flex justify-between mt-8">
        {prevLesson ? (
          <Button asChild variant="outline">
            <Link href={`/courses/${course.id}/lessons/${prevLesson.id}`}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous: {prevLesson.title}
            </Link>
          </Button>
        ) : <div />}
        {nextLesson ? (
          <Button asChild>
            <Link href={`/courses/${course.id}/lessons/${nextLesson.id}`}>
              Next: {nextLesson.title}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        ) : <div />}
      </div>
    </div>
  );
}
