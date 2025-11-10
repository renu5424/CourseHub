
// tsx scripts/seed.ts
import { getApps, initializeApp, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { Course, Lesson, UserProfile } from '../src/lib/types';


if (getApps().length === 0) {
  // When running locally, initialize with a project ID to connect to the emulators.
  initializeApp({
      projectId: 'demo-project',
  });
}

const firestore = getFirestore();
const auth = getAuth();


// --- Seed Data ---

const MENTOR_UID = 'mentor-seed-user';
const STUDENT_UID = 'student-seed-user';

const seedUsers: (UserProfile & { uid: string; password?: string })[] = [
  {
    uid: MENTOR_UID,
    id: MENTOR_UID,
    name: 'Ada Lovelace',
    email: 'mentor@example.com',
    role: 'mentor',
    password: 'password123',
  },
  {
    uid: STUDENT_UID,
    id: STUDENT_UID,
    name: 'Charles Babbage',
    email: 'student@example.com',
    role: 'student',
    password: 'password123',
  },
];

const seedCourses: Omit<Course, 'id' | 'lessons'>[] = [
  {
    title: 'Introduction to Web Development',
    description: 'Learn the fundamentals of web development, including HTML, CSS, and JavaScript. This course is perfect for beginners.',
    category: 'Programming',
    mentorId: MENTOR_UID,
  },
  {
    title: 'The History of Ancient Rome',
    description: 'Explore the rise and fall of the Roman Empire, from its mythical origins to its eventual decline.',
    category: 'History',
    mentorId: MENTOR_UID,
  },
  {
    title: 'Fundamentals of Graphic Design',
    description: 'Discover the principles of graphic design and learn how to create visually appealing compositions.',
    category: 'Art',
    mentorId: MENTOR_UID,
  }
];

const seedLessons: { [courseTitle: string]: Omit<Lesson, 'id' | 'courseId'>[] } = {
  'Introduction to Web Development': [
    { title: 'HTML Basics', content: '<h1>Welcome to HTML</h1><p>This is where you learn the bones of a website.</p>', summary: 'HTML provides the basic structure of sites.', exercise: 'Create a simple HTML page with a heading and a paragraph.', order: 1 },
    { title: 'CSS for Styling', content: '<h1>Styling with CSS</h1><p>This is where you add style and design to your website.</p>', summary: 'CSS is used to style and layout web pages.', exercise: 'Style your HTML page with colors and fonts.', order: 2 },
    { title: 'JavaScript Fundamentals', content: '<h1>Intro to JavaScript</h1><p>Bring your website to life with JavaScript.</p>', summary: 'JavaScript enables interactive web pages.', exercise: 'Add an alert to a button click on your page.', order: 3 },
  ],
  'The History of Ancient Rome': [
    { title: 'The Founding of Rome', content: '<h1>The Legend of Rome</h1><p>According to legend, Rome was founded in 753 BC by twins...</p>', summary: 'Rome was founded by Romulus and Remus.', exercise: 'Write a short paragraph about the myth.', order: 1 },
    { title: 'The Roman Republic', content: '<h1>The Republic</h1><p>The Roman Republic was established in 509 BC...</p>', summary: 'Rome was a republic for almost 500 years.', exercise: 'List two key figures from the Roman Republic.', order: 2 },
    { title: 'The Roman Empire', content: '<h1>The Empire</h1><p>The Roman Empire began with Augustus in 27 BC...</p>', summary: 'The Empire marked a new era for Rome.', exercise: 'Name the first Roman Emperor.', order: 3 },
  ],
  'Fundamentals of Graphic Design': [
    { title: 'Color Theory', content: '<h1>Color Theory</h1><p>Color theory is a body of practical guidance to color mixing...</p>', summary: 'Color theory is crucial for design.', exercise: 'Create a simple color palette.', order: 1 },
    { title: 'Typography', content: '<h1>Typography</h1><p>Typography is the art and technique of arranging type...</p>', summary: 'Good typography makes text readable and appealing.', exercise: 'Choose a font pairing for a sample headline and body text.', order: 2 },
  ]
};

// --- Seeding Logic ---

async function seedAuth() {
  console.log('Seeding Firebase Authentication...');
  for (const user of seedUsers) {
    await auth.createUser({
      uid: user.uid,
      email: user.email,
      password: user.password,
      displayName: user.name,
    }).then((userRecord) => {
      console.log(`Created auth user: ${userRecord.email}`);
    }).catch((error) => {
      if (error.code === 'auth/uid-already-exists' || error.code === 'auth/email-already-exists') {
        console.log(`Auth user ${user.email} already exists.`);
      } else {
        throw error;
      }
    });
  }
  console.log('Authentication seeding complete.');
}


async function seedFirestore() {
  console.log('Seeding Firestore...');
  const batch = firestore.batch();

  // Seed User Profiles
  console.log('Seeding user profiles...');
  for (const user of seedUsers) {
    const { uid, password, ...profileData } = user;
    const profileRef = firestore.collection('userProfiles').doc(uid);
    batch.set(profileRef, profileData);
  }
  console.log('User profiles queued.');

  // Seed Courses and Lessons
  console.log('Seeding courses and lessons...');
  for (const course of seedCourses) {
    const courseRef = firestore.collection('courses').doc();
    batch.set(courseRef, { ...course, id: courseRef.id });

    const lessonsForCourse = seedLessons[course.title] || [];
    for (const lesson of lessonsForCourse) {
      const lessonRef = courseRef.collection('lessons').doc();
      batch.set(lessonRef, { ...lesson, courseId: courseRef.id, id: lessonRef.id });
    }
  }
  console.log('Courses and lessons queued.');

  // Commit batch
  await batch.commit();
  console.log('Firestore seeding complete.');
}

async function main() {
  try {
    await seedAuth();
    await seedFirestore();
    console.log('\n✅ Database has been seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

main();
