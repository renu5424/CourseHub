
'use client';

import { useUser } from '@/firebase/auth/use-user';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { UserProfile } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function StudentProfilePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'userProfiles', user.uid);
  }, [firestore, user]);
  const { data: student, isLoading: studentLoading } = useDoc<UserProfile>(userProfileRef);
  
  const getInitials = (name: string | undefined): string => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1 && names[names.length - 1]) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  if (studentLoading || isUserLoading || !firestore) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!student) {
    return <p>Student profile not found.</p>;
  }

  return (
    <div className="max-w-2xl mx-auto">
       <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-muted-foreground">View your account details.</p>
      </div>
      <Card>
        <CardContent className="p-6">
            <div className="flex items-center space-x-6">
                <Avatar className="h-24 w-24">
                    <AvatarFallback className="text-4xl">{getInitials(student.name)}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold">{student.name}</h2>
                    <p className="text-muted-foreground">{student.email}</p>
                </div>
            </div>
            <Separator className="my-6" />
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Role</p>
                    <p className="font-semibold capitalize">{student.role}</p>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
