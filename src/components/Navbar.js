'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { BellIcon, Settings, User, LogOut, Plus } from 'lucide-react';
import useAuthStore from '@/lib/store';
import { Button } from '@/components/ui/button';
import { AddTaskModal } from './AddTaskModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NotificationBell } from './NotificationBell';

export default function Navbar() {
  console.log('Navbar rendering'); // Debug log
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  
  console.log('Current user in Navbar:', user); // Debug log

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (!user) return null;

  const isAdmin = user.role === 'admin';
  
  const getPageTitle = () => {
    console.log('Current pathname:', pathname); // Debug log
    if (pathname === '/admin/dashboard') return 'Dashboard Overview';
    if (pathname === '/admin/tasks') return 'Task Management';
    if (pathname === '/admin/team') return 'Team Management';
    if (pathname === '/admin/media') return 'Media Library';
    if (pathname.includes('/tasks/')) return 'Task Details';
    if (pathname === '/home') return 'Solomax'; // Changed from 'My Workspace'
    if (pathname === '/tasks') return 'My Tasks';
    if (pathname === '/media') return 'Media';
    if (pathname === '/team') return 'Team';
    return 'Dashboard';
  };
  
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <nav className="border-b bg-white sticky top-0 z-50">
      <div className="flex h-16 items-center px-8">
        <div className="flex items-center gap-2">
          <div>
            <div className="flex items-center gap-1">
              <h1 className="text-lg font-bold text-gray-900">{getTimeBasedGreeting()}</h1>
              <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-md font-medium">v1.0</span>
            </div>
            <p className="text-xs text-gray-500">{getPageTitle()} {isAdmin ? '• Admin' : '• User'}</p>
          </div>
        </div>
        <div className="ml-auto flex items-center space-x-4">
          {/* Create Task Button - Only visible to admins */}
          {isAdmin && (
            <AddTaskModal>
              <Button size="sm" className="mr-2">
                <Plus className="h-4 w-4 mr-1" /> New Task
              </Button>
            </AddTaskModal>
          )}

          {/* Notification Bell */}
          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10 ring-2 ring-blue-500/10">
                  <AvatarImage src={user.photoURL} alt={user.email} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    {user.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none text-gray-900">
                    {user.name || 'User'}
                  </p>
                  <p className="text-xs leading-none text-gray-500">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>{isAdmin ? 'Admin Settings' : 'Settings'}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout}
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
