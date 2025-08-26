'use client';

import { Geist, Geist_Mono } from "next/font/google";

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import useAuthStore from '@/lib/store';
import { ToastContainer } from 'react-toastify';
import { TaskNotificationsProvider } from '@/hooks/useTaskNotifications';
import { MediaUploadWrapper } from '@/components/MediaUploadWrapper';
import 'react-toastify/dist/ReactToastify.css';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const protectedRoutes = ['/home', '/admin/dashboard', '/admin/tasks', '/tasks', '/team', '/media'];
const adminRoutes = ['/admin/dashboard', '/admin/tasks'];

export default function RootLayout({ children }) {
  useEffect(() => {
    // Initialize auth listener when the app starts
    const unsubscribe = useAuthStore.getState().initializeAuth();
    return () => unsubscribe();
  }, []);

  return (
    <html lang="en">
      <head>
        <title>Solomax • Youtube Workflow Management</title>
        <meta name="description" content="A comprehensive Youtube workflow management system for teams to collaborate, track, and manage projects efficiently" />
        <meta name="keywords" content="workflow, tasks, project management, team collaboration, Solomax, Youtube" />
        <meta name="author" content="Solomax Studios" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <TaskNotificationsProvider>
          <MediaUploadWrapper>
            <ClientLayout>
              {children}
            </ClientLayout>
          </MediaUploadWrapper>
        </TaskNotificationsProvider>
        <ToastContainer />
      </body>
    </html>
  );
}

function ClientLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuthStore();

  useEffect(() => {
    if (!loading) {
      console.log('Auth state update:', { 
        user, 
        pathname, 
        hasDbEntry: !!user,
        isApproved: user?.isApproved 
      }); // Debug log

      // If route is protected and user is not logged in
      if (protectedRoutes.includes(pathname) && !user) {
        console.log('Redirecting to login - protected route, no user'); // Debug log
        router.replace('/');
        return;
      }

      // Check for admin routes
      if (pathname.startsWith('/admin')) {
        if (user?.role !== 'admin') {
          console.log('Non-admin user attempting to access admin route:', pathname);
          router.replace('/home');
          return;
        }
      }

      // Redirect non-admin users attempting to access admin routes to home
      if (adminRoutes.includes(pathname) && user?.role !== 'admin') {
        console.log('Redirecting to home - admin route, non-admin user');
        router.replace('/home');
        return;
      }

      // Redirect logged-in users from root to appropriate dashboard
      if (pathname === '/') {
        if (user) {
          console.log('Redirecting from root - user found:', user.role);
          if (user.role === 'admin') {
            router.replace('/admin/dashboard');
          } else {
            router.replace('/home');
          }
        }
      }

      // Redirect admin users from /home to admin dashboard
      if (pathname === '/home' && user?.role === 'admin') {
        router.replace('/admin/dashboard');
        return;
      }
    }
  }, [pathname, user, loading, router]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-gray-500">Loading...</p>
      </div>
    </div>;
  }

  return children;
}
