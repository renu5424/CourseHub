'use client';
import {
  Auth, // Import Auth type for type hinting
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  // Assume getAuth and app are initialized elsewhere
} from 'firebase/auth';

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  // CRITICAL: Call signInAnonymously directly. Do NOT use 'await signInAnonymously(...)'.
  signInAnonymously(authInstance).catch((error) => {
    console.error("Anonymous sign-in error", error);
  });
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string, toast: (options: any) => void): Promise<any> {
  // CRITICAL: Call createUserWithEmailAndPassword directly. Do NOT use 'await createUserWithEmailAndPassword(...)'.
  return createUserWithEmailAndPassword(authInstance, email, password)
    .catch(error => {
        toast({
            variant: "destructive",
            title: "Sign up failed",
            description: error.message,
        });
        throw error; // re-throw to be handled by caller if needed
    });
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string, toast: (options: any) => void): void {
  // CRITICAL: Call signInWithEmailAndPassword directly. Do NOT use 'await signInWithEmailAndPassword(...)'.
  signInWithEmailAndPassword(authInstance, email, password)
    .catch(error => {
        toast({
            variant: "destructive",
            title: "Login failed",
            description: error.message,
        });
    });
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}


/** Initiate password reset email (non-blocking). */
export function initiatePasswordReset(authInstance: Auth, email: string, toast: (options: any) => void): void {
    sendPasswordResetEmail(authInstance, email)
        .then(() => {
            toast({
                title: "Password Reset Email Sent",
                description: `If an account exists for ${email}, a password reset link has been sent to it.`,
            });
        })
        .catch(error => {
            toast({
                variant: "destructive",
                title: "Error Sending Reset Email",
                description: error.message,
            });
        });
}
