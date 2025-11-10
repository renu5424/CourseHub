import {initializeApp, getApp, getApps, App} from 'firebase-admin/app';
import {getAuth, Auth} from 'firebase-admin/auth';
import {getFirestore, Firestore} from 'firebase-admin/firestore';
import {firebaseConfig} from './config';

interface FirebaseAdminServices {
  app: App;
  auth: Auth;
  firestore: Firestore;
}

// This memoization is causing issues in the App Hosting environment.
// let services: FirebaseAdminServices | null = null;

export function getFirebaseAdmin(): FirebaseAdminServices {
  // if (services) {
  //   return services;
  // }

  const app = getApps().length
    ? getApp()
    : initializeApp({projectId: firebaseConfig.projectId});

  const auth = getAuth(app);
  const firestore = getFirestore(app);

  const services = {app, auth, firestore};
  return services;
}
