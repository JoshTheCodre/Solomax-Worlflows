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
  Calendar,
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
  { name: 'Content Calendar', href: '/content-calendar', icon: Calendar },
];

const adminNavigation = [
  { name: 'Overview', href: '/admin/dashboard', icon: LayoutDashboardIcon },
  { name: 'Tasks', href: '/admin/tasks', icon: CheckSquareIcon },
  { name: 'Media', href: '/media', icon: FilmIcon },
  { name: 'Team', href: '/team', icon: UsersIcon },
  { name: 'Content Mgr', href: '/admin/content-manager', icon: FolderOpenIcon },
  { name: 'Content Calendar', href: '/content-calendar', icon: Calendar },
];

export function Sidebar({ className }) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  console.log('Sidebar - Current user:', user); // Debug log
  const isAdmin = user?.role === 'admin';
  const items = isAdmin ? adminNavigation : navigation;

  return (
    <div className={cn("flex flex-col bg-white border-r border-gray-200", className)} style={{ height: '100vh' }}>
      <div className="px-4 py-4 border-b border-gray-200 flex items-center" style={{ height: '64px' }}>
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent tracking-wide">
          SOLOMAX
        </h1>
      </div>
      
      <div className="flex-1 px-3 py-4 overflow-y-auto">
        <nav className="space-y-1">
          {items.map((item, index) => {
            const iconColors = [
              'text-blue-500',     // Home
              'text-green-500',    // Tasks  
              'text-purple-500',   // Media
              'text-orange-500',   // Team
              'text-red-500',      // Content Mgr
              'text-indigo-500',   // Content Calendar
            ];
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-all hover:bg-blue-50/80",
                  pathname === item.href 
                    ? "bg-blue-50 text-blue-600 font-semibold" 
                    : "text-gray-700 hover:text-gray-900"
                )}
              >
                <item.icon className={cn(
                  "mr-3 h-4 w-4 flex-shrink-0",
                  iconColors[index] || "text-gray-500"
                )} />
                <span className="truncate">{item.name}</span>
                {pathname === item.href && (
                  <div className="ml-auto w-1 h-1 bg-blue-600 rounded-full"></div>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
      
      <div className="border-t border-gray-200 p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 transition-colors">
              <Avatar className="h-8 w-8 bg-gray-100">
                <User className="h-4 w-4 text-gray-600" />
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.displayName || 'Admin User'}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" side="right" sideOffset={8}>
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
