
'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, useFirestore } from '@/firebase';
import { useUser } from '@/firebase/auth/use-user';
import { User as AuthUser, GoogleAuthProvider, signInWithPopup, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { User, GraduationCap, Loader2, Eye, EyeOff } from 'lucide-react';
import { Icons } from '@/components/icons';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { UserRole, UserProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { initiateEmailSignIn, initiateEmailSignUp, initiatePasswordReset } from '@/firebase/non-blocking-login';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function AuthPage() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isGooglePending, setGooglePending] = useState(false);
  const [hasCheckedRole, setHasCheckedRole] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  
  const [loginPasswordVisible, setLoginPasswordVisible] = useState(false);
  const [signupPasswordVisible, setSignupPasswordVisible] = useState(false);

  const [isForgotPassDialogOpen, setForgotPassDialogOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');


  useEffect(() => {
    if (!isUserLoading && user && !hasCheckedRole && firestore) {
      const userDocRef = doc(firestore, 'userProfiles', user.uid);
      getDoc(userDocRef).then((docSnap) => {
        if (docSnap.exists() && docSnap.data()?.role) {
          router.push(`/${docSnap.data().role}`);
        } else {
            setHasCheckedRole(true);
        }
      });
    }
  }, [user, isUserLoading, hasCheckedRole, firestore, router]);


  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(() => {
      initiateEmailSignIn(auth, loginEmail, loginPassword, toast);
    });
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(() => {
        initiateEmailSignUp(auth, signupEmail, signupPassword, toast)
        .then(userCredential => {
            if(userCredential?.user) {
                updateProfile(userCredential.user, { displayName: signupName });
            }
        });
    });
  };

  const handleGoogleSignIn = async () => {
    setGooglePending(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        console.error("Google Sign-In Error:", error);
        toast({
          variant: "destructive",
          title: "Google Sign-In Failed",
          description: "Could not sign in with Google. Please try again.",
        });
      }
    } finally {
        setGooglePending(false);
    }
  };

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(() => {
        initiatePasswordReset(auth, resetEmail, toast);
        setForgotPassDialogOpen(false);
    });
  };


  const handleRoleSelection = (selectedRole: UserRole) => {
    if (!user || !firestore) return;

    const userProfile: UserProfile = {
      id: user.uid,
      email: user.email!,
      name: user.displayName || signupName || 'New User',
      role: selectedRole,
    };

    const userDocRef = doc(firestore, 'userProfiles', user.uid);
    setDocumentNonBlocking(userDocRef, userProfile, { merge: true });
    router.push(`/${selectedRole}`);
  };

  if (isUserLoading || (user && !hasCheckedRole)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user && hasCheckedRole) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md shadow-2xl">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">Select Your Role</CardTitle>
                    <CardDescription>How will you be using CourseHub?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button onClick={() => handleRoleSelection('mentor')} className="w-full" size="lg">
                        <User className="mr-2 h-5 w-5" /> Continue as Mentor
                    </Button>
                    <Button onClick={() => handleRoleSelection('student')} className="w-full" variant="secondary" size="lg">
                        <GraduationCap className="mr-2 h-5 w-5" /> Continue as Student
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Icons.logo className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">Welcome to CourseHub</CardTitle>
          <CardDescription>आरम्भात् सिद्ध्यन्तम् | From Start to Success</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
               <Dialog open={isForgotPassDialogOpen} onOpenChange={setForgotPassDialogOpen}>
                <form onSubmit={handleLogin} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input id="login-email" type="email" placeholder="m@example.com" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2 relative">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="login-password">Password</Label>
                         <DialogTrigger asChild>
                            <Button type="button" variant="link" className="h-auto p-0 text-xs">
                                Forgot Password?
                            </Button>
                        </DialogTrigger>
                    </div>
                    <Input 
                      id="login-password" 
                      type={loginPasswordVisible ? 'text' : 'password'} 
                      required 
                      value={loginPassword} 
                      onChange={e => setLoginPassword(e.target.value)}
                      className="pr-10"
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-1 top-7 h-7 w-7 text-muted-foreground"
                      onClick={() => setLoginPasswordVisible(prev => !prev)}
                    >
                      {loginPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Button type="submit" className="w-full" disabled={isPending}>
                      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Login
                  </Button>
                </form>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Forgot Password</DialogTitle>
                        <DialogDescription>
                            Enter your email address below and we&apos;ll send you a link to reset your password.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handlePasswordReset}>
                        <div className="space-y-2">
                            <Label htmlFor="reset-email" className="sr-only">Email</Label>
                            <Input
                                id="reset-email"
                                placeholder="name@example.com"
                                required
                                type="email"
                                value={resetEmail}
                                onChange={e => setResetEmail(e.target.value)}
                            />
                        </div>
                         <DialogFooter className="mt-4">
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Send Reset Link
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
              </Dialog>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input id="signup-name" placeholder="John Doe" required value={signupName} onChange={e => setSignupName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" type="email" placeholder="m@example.com" required value={signupEmail} onChange={e => setSignupEmail(e.target.value)} />
                </div>
                <div className="space-y-2 relative">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input 
                    id="signup-password" 
                    type={signupPasswordVisible ? 'text' : 'password'} 
                    required 
                    minLength={6} 
                    value={signupPassword} 
                    onChange={e => setSignupPassword(e.target.value)}
                    className="pr-10"
                  />
                   <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-1 top-7 h-7 w-7 text-muted-foreground"
                    onClick={() => setSignupPasswordVisible(prev => !prev)}
                  >
                    {signupPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign Up
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isGooglePending}>
            {isGooglePending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Icons.google className="mr-2 h-4 w-4" />}
            Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
