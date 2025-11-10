
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';
import { Icons } from '@/components/icons';
import { UserProfile } from '@/lib/types';
import { LayoutDashboard, BookCopy, PlusCircle, Users } from 'lucide-react';

interface MainNavProps extends React.HTMLAttributes<HTMLElement> {
  userProfile: UserProfile | null;
}

export function MainNav({ className, userProfile, ...props }: MainNavProps) {
  const pathname = usePathname();
  const role = userProfile?.role;

  const mentorRoutes = [
    { href: '/mentor', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/mentor/courses/new', label: 'New Course', icon: PlusCircle },
  ];

  const studentRoutes = [
    { href: '/student', label: 'My Dashboard', icon: LayoutDashboard },
    { href: '/courses', label: 'All Courses', icon: BookCopy },
    { href: '/tutor', label: 'Tutor', icon: Icons.diksha },
  ];

  const routes = role === 'mentor' ? mentorRoutes : studentRoutes;
  const homeHref = role ? `/${role}` : '/';

  return (
    <nav className={cn('flex items-center space-x-4 lg:space-x-6', className)} {...props}>
      <Link href={homeHref} className="mr-6 flex items-center space-x-2">
        <Icons.logo className="h-6 w-6 text-primary" />
        <span className="hidden font-bold sm:inline-block">CourseHub</span>
      </Link>
      {routes.map(route => (
        <Link
          key={route.href}
          href={route.href}
          className={cn(
            'text-sm font-medium transition-colors hover:text-primary flex items-center gap-2',
            pathname === route.href ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          <route.icon className="h-4 w-4" />
          {route.label}
        </Link>
      ))}
    </nav>
  );
}
