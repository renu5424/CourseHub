'use server';

import { revalidatePath } from 'next/cache';
import {
  enrollStudentInCourse,
  addCourse,
  updateCourse,
  updateLesson,
} from '@/lib/data';
import { Course, Lesson } from '@/lib/types';


export async function createCourseAction(courseData: Omit<Course, 'id'> & { mentorId: string; lessons: Omit<Lesson, 'id' | 'courseId' | 'order'>[] }) {
    try {
        await addCourse(courseData);
        revalidatePath('/mentor');
        revalidatePath('/courses');
        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create course.';
        return { success: false, message };
    }
}

export async function updateCourseAction(courseId: string, courseData: { title: string; description: string; category: Course['category']; lessons: {id?:string; title: string}[] }) {
    try {
        await updateCourse(courseId, courseData);
        revalidatePath('/mentor');
        revalidatePath(`/mentor/courses/edit/${courseId}`);
        revalidatePath(`/courses/${courseId}`);
        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update course.';
        return { success: false, message };
    }
}


export async function enrollInCourseAction(userId: string, courseId: string) {
    try {
        await enrollStudentInCourse(userId, courseId);
        revalidatePath('/student');
        revalidatePath(`/courses/${courseId}`);
        revalidatePath('/enrollments');
        return { success: true, message: 'Successfully enrolled!' };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to enroll in course.';
        return { success: false, message };
    }
}

export async function updateLessonAction(courseId: string, lessonId: string, lesson: Partial<Lesson>) {
  try {
    await updateLesson(courseId, lessonId, lesson);
    revalidatePath(`/mentor/courses/${courseId}/edit`);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update lesson.';
    return { success: false, message };
  }
}
