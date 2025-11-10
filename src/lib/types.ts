
export type UserRole = 'mentor' | 'student';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  email: string;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  content?: string;
  summary?: string;
  exercise?: string;
  order: number;
  quizzes?: Quiz[];
}

export type CourseCategory = 'Programming' | 'History' | 'Science' | 'Art' | 'Music' | 'Wellness' | 'Other';

export interface Course {
  id:string;
  title: string;
  description: string;
  mentorId: string;
  category: CourseCategory;
  lessons?: Lesson[];
  createdAt?: any;
  updatedAt?: any;
}

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  enrollmentDate: any; // Can be a server timestamp
  completionDate?: string;
}


export interface Quiz {
  question: string;
  options: string[];
  correctAnswer: string;
}
