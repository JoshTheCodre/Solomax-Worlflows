'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import useAuthStore from '@/lib/store';
import {
  HomeIcon,
  FilmIcon,
  UsersIcon,
  LayoutDashboardIcon,
  CheckSquareIcon,
  Settings,
  LogOut,
  User,
  FolderOpenIcon,
} from 'lucide-react';
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navigation = [
  { name: 'Home', href: '/home', icon: HomeIcon },
  { name: 'Tasks', href: '/tasks', icon: CheckSquareIcon },
  { name: 'Media', href: '/media', icon: FilmIcon },
  { name: 'Team', href: '/team', icon: UsersIcon },
  { name: 'Content Mgr', href: '/content-manager', icon: FolderOpenIcon },
];

const adminNavigation = [
  { name: 'Overview', href: '/admin/dashboard', icon: LayoutDashboardIcon },
  { name: 'Tasks', href: '/admin/tasks', icon: CheckSquareIcon },
  { name: 'Media', href: '/media', icon: FilmIcon },
  { name: 'Team', href: '/team', icon: UsersIcon },
  { name: 'Content Mgr', href: '/admin/content-manager', icon: FolderOpenIcon },
];

export function Sidebar({ className }) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  console.log('Sidebar - Current user:', user); // Debug log
  const isAdmin = user?.role === 'admin';
  const items = isAdmin ? adminNavigation : navigation;

  return (
    <div className={cn("flex flex-col h-full bg-white", className)}>
      <div className="px-6 py-6 mb-4 border-b shrink-0">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent tracking-wide font-sans">
          SOLOMAX
        </h1>
        <p className="text-sm text-black mt-1 font-medium">Youtube Workflows</p>
      </div>
      <div className="flex-1 space-y-4 px-3 overflow-y-auto">
        <nav className="space-y-2">
          {items.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center rounded-lg px-4 py-3 text-base font-semibold transition-all hover:bg-blue-50/60",
                pathname === item.href 
                  ? "bg-blue-50 text-blue-500 font-bold" 
                  : "text-black hover:text-black"
              )}
            >
              <span className="flex items-center flex-1">
                <item.icon className={cn(
                  "mr-3 h-5 w-5",
                  pathname === item.href 
                    ? "text-blue-500" 
                    : "text-black"
                )} />
                {item.name}
              </span>
              <span className="ml-auto opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-black group-hover:text-blue-500">
                →
              </span>
            </Link>
          ))}
        </nav>
      </div>
      
      <div className="mt-auto border-t pt-4 px-6">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="w-full flex justify-center space-x-3 hover:bg-blue-50 p-2 rounded-lg transition-all">
              <Avatar className="h-9 w-9 bg-gray-100 justify-center items-center">
                <User className="h-5 w-5" />
              </Avatar>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-gray-900">{user?.displayName || 'Admin User'}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" side="right" sideOffset={20}>
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
    
            <DropdownMenuItem 
              className="text-red-600 focus:text-red-700"
              onClick={logout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
