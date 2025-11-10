import { Course, Lesson, Enrollment, UserProfile } from './types';
import {
  Firestore,
  Timestamp,
  WriteBatch
} from 'firebase-admin/firestore';
import { getFirebaseAdmin } from '@/firebase/server';

function getDb() {
    return getFirebaseAdmin().firestore;
}

// --- Course Functions ---

export const getCourses = async (): Promise<Course[]> => {
  const firestore = getDb();
  const coursesCol = firestore.collection('courses');
  const courseSnapshot = await coursesCol.get();
  const courseList = courseSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
  return courseList;
};

export const getCourseById = async (id: string): Promise<Course | undefined> => {
  const firestore = getDb();
  const courseDocRef = firestore.doc(`courses/${id}`);
  const courseSnap = await courseDocRef.get();
  if (courseSnap.exists) {
    const courseData = { id: courseSnap.id, ...courseSnap.data() } as Course;
    // get lessons subcollection
    const lessonsCol = firestore.collection('courses').doc(id).collection('lessons');
    const lessonsSnapshot = await lessonsCol.get();
    const lessons = lessonsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lesson));
    courseData.lessons = lessons; // Attach lessons to the course object
    return courseData;
  }
  return undefined;
};

export const addCourse = async (courseData: Omit<Course, 'id'>): Promise<string> => {
  const firestore = getDb();
  const batch = firestore.batch();
  const courseRef = firestore.collection('courses').doc();
  
  const { lessons, ...courseDetails } = courseData;

  const newCourse = {
    ...courseDetails,
    id: courseRef.id,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  batch.set(courseRef, newCourse);

  if (lessons && lessons.length > 0) {
    lessons.forEach((lesson, index) => {
      const lessonRef = courseRef.collection('lessons').doc();
      const newLesson: Omit<Lesson, 'id'> & { id: string } = {
        ...lesson,
        id: lessonRef.id,
        courseId: courseRef.id,
        order: index + 1,
        content: lesson.content || '',
        summary: lesson.summary || '',
        exercise: lesson.exercise || '',
      };
      batch.set(lessonRef, newLesson);
    });
  }

  await batch.commit();
  return courseRef.id;
};

export const updateCourse = async (courseId: string, courseData: { title: string; description: string; category: Course['category']; lessons: {id?:string; title: string}[] }) => {
    const firestore = getDb();
    const batch = firestore.batch();
    const courseRef = firestore.collection('courses').doc(courseId);

    // Update course details
    const { title, description, category, lessons } = courseData;
    batch.update(courseRef, { title, description, category, updatedAt: Timestamp.now() });

    // Handle lessons
    const lessonsRef = courseRef.collection('lessons');
    const existingLessonsSnap = await lessonsRef.get();
    const existingLessonIds = new Set(existingLessonsSnap.docs.map(doc => doc.id));

    const updatedLessonIds = new Set();

    for (let i = 0; i < lessons.length; i++) {
        const lesson = lessons[i];
        if (lesson.id) { // Existing lesson
            updatedLessonIds.add(lesson.id);
            if (existingLessonIds.has(lesson.id)) {
                const lessonRef = lessonsRef.doc(lesson.id);
                batch.update(lessonRef, { title: lesson.title, order: i + 1 });
            }
        } else { // New lesson
            const newLessonRef = lessonsRef.doc();
            const newLessonData = {
                id: newLessonRef.id,
                title: lesson.title,
                courseId: courseId,
                order: i + 1,
                content: '',
                summary: '',
                exercise: ''
            };
            batch.set(newLessonRef, newLessonData);
        }
    }
    
    // Delete lessons that were removed
    for (const lessonId of existingLessonIds) {
        if (!updatedLessonIds.has(lessonId)) {
            const lessonRef = lessonsRef.doc(lessonId);
            batch.delete(lessonRef);
        }
    }

    await batch.commit();
};


export const getMentorCourses = async (mentorId: string): Promise<Course[]> => {
    const firestore = getDb();
    const coursesCol = firestore.collection('courses');
    const q = coursesCol.where("mentorId", "==", mentorId);
    const courseSnapshot = await q.get();
    const courses: Course[] = [];
    for (const docSnap of courseSnapshot.docs) {
      const course = { id: docSnap.id, ...docSnap.data() } as Course;
      const lessonsCol = firestore.collection('courses').doc(docSnap.id).collection('lessons');
      const lessonsSnapshot = await lessonsCol.get();
      const lessons = lessonsSnapshot.docs.map(lessonDoc => ({ id: lessonDoc.id, ...lessonDoc.data() } as Lesson));
      courses.push({ ...course, lessons });
    }
    return courses;
}

// --- Enrollment Functions ---

export const getStudentEnrollments = async (userId: string): Promise<Enrollment[]> => {
    const firestore = getDb();
    const enrollmentsCol = firestore.collection('enrollments');
    const q = enrollmentsCol.where("studentId", "==", userId);
    const snapshot = await q.get();
    return snapshot.docs.map(doc => {
        const data = doc.data();
        const enrollmentDate = data.enrollmentDate instanceof Timestamp ? data.enrollmentDate.toDate().toISOString() : data.enrollmentDate;
        return { id: doc.id, ...data, enrollmentDate } as Enrollment;
    });
}

export const getMentorEnrollments = async (mentorId: string): Promise<Enrollment[]> => {
    const firestore = getDb();
    const coursesCol = firestore.collection('courses');
    const mentorCoursesQuery = coursesCol.where("mentorId", "==", mentorId);
    const coursesSnapshot = await mentorCoursesQuery.get();
    const courseIds = coursesSnapshot.docs.map(doc => doc.id);

    if (courseIds.length === 0) {
        return [];
    }

    const enrollmentsCol = firestore.collection('enrollments');
    const enrollmentsQuery = enrollmentsCol.where("courseId", "in", courseIds);
    const enrollmentsSnapshot = await enrollmentsQuery.get();
    
    return enrollmentsSnapshot.docs.map(doc => {
        const data = doc.data();
         const enrollmentDate = data.enrollmentDate instanceof Timestamp ? data.enrollmentDate.toDate().toISOString() : data.enrollmentDate;
        return { id: doc.id, ...data, enrollmentDate } as Enrollment;
    });
}


export const enrollStudentInCourse = async (userId: string, courseId: string): Promise<Enrollment | undefined> => {
    const db = getDb();
    const enrollmentsCol = db.collection('enrollments');
    const q = enrollmentsCol.where("studentId", "==", userId).where("courseId", "==", courseId);
    const snapshot = await q.get();

    if (!snapshot.empty) {
        throw new Error("You are already enrolled in this course.");
    }
    
    const studentRef = db.doc(`userProfiles/${userId}`);
    const courseRef = db.doc(`courses/${courseId}`);
    
    const [studentSnap, courseSnap] = await Promise.all([studentRef.get(), courseRef.get()]);
    
    if (!studentSnap.exists || !courseSnap.exists) {
        throw new Error("Student or Course not found.");
    }
    
    const newEnrollmentRef = enrollmentsCol.doc();
    const newEnrollmentData: Omit<Enrollment, 'id' | 'enrollmentDate' > = {
        studentId: userId,
        courseId: courseId,
    };

    await newEnrollmentRef.set({
        ...newEnrollmentData,
        id: newEnrollmentRef.id,
        enrollmentDate: Timestamp.now()
    });
    
    return {
        ...newEnrollmentData,
        id: newEnrollmentRef.id,
        enrollmentDate: new Date().toISOString()
    };
}


export const updateLesson = async (courseId: string, lessonId: string, lesson: Partial<Lesson>) => {
    const firestore = getDb();
    const lessonRef = firestore.collection('courses').doc(courseId).collection('lessons').doc(lessonId);
    await lessonRef.update(lesson);
};
