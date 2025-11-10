
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, Firestore } from 'firebase/firestore';
import { useMemo, type DependencyList } from 'react';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (!(globalThis as any)._firebaseApp) {
    (globalThis as any)._firebaseApp = initializeApp(firebaseConfig);
  }
  const firebaseApp = (globalThis as any)._firebaseApp;
  return getSdks(firebaseApp);
}

export function getSdks(firebaseApp: FirebaseApp): {
  firebaseApp: FirebaseApp,
  auth: Auth,
  firestore: Firestore
} {
  const firestore = getFirestore(firebaseApp);
  const auth = getAuth(firebaseApp);
  
  if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR) {
    // These weird looking host names are the port-forwarded domains that the
    // Google Cloud Workstation provides.
    const host = process.env.NEXT_PUBLIC_EMULATOR_HOST || "localhost";
    console.log(`Connecting to emulators on //${host}`);
    connectFirestoreEmulator(firestore, host, 8080);
    connectAuthEmulator(auth, `http://${host}:9099`, {disableWarnings: true});
  }

  return {
    firebaseApp,
    auth,
    firestore,
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './auth/use-user';

// IMPORTANT! You must memoize the return value of this function, or you will cause an infinite render loop.
// A common pattern is to use React.useMemo:
// const memoizedRef = useMemoFirebase(() => collection(firestore, 'my-collection'), [firestore]);
// Here is a full example of using it with useCollection:
//
// const { data: myData } = useCollection(
//   useMemoFirebase(
//     () => (firestore ? query(collection(firestore, 'my-collection')) : null),
//     [firestore]
//   )
// );
export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | null {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(factory, deps);
}
