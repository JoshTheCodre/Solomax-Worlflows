'use client';

import { LayoutDashboard, Film, Users, Boxes, Calendar, BookMarked, Sparkles } from 'lucide-react';

export const adminSidebarLinks = [
  {
    href: '/admin/dashboard',
    icon: Sparkles,
    label: '✨ Dashboard',
    description: 'Overview & Analytics'
  },
  {
    href: '/admin/media',
    icon: Film,
    label: '🎬 Media',
    description: 'Manage Content'
  },
  {
    href: '/admin/team',
    icon: Users,
    label: '👥 Team',
    description: 'Manage Members'
  },
  {
    href: '/admin/tasks',
    icon: Boxes,
    label: '📦 Tasks',
    description: 'All Projects'
  }
];

export const userSidebarLinks = [
  {
    href: '/home',
    icon: LayoutDashboard,
    label: '🏠 Home',
    description: 'Your Workspace'
  },
  {
    href: '/calendar',
    icon: Calendar,
    label: '📅 Calendar',
    description: 'Schedule & Events'
  },
  {
    href: '/tasks',
    icon: BookMarked,
    label: '✅ My Tasks',
    description: 'Your Projects'
  }
];
