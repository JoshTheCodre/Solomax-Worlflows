'use client';

import { Sidebar } from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

export default function DashboardLayout({ children }) {
  console.log('DashboardLayout rendering'); // Debug log
  return (
    <div className="container mx-auto">
      <div className="flex min-h-screen bg-gray-50">
        <div className="w-1/5 bg-white border-r">
          <div className="sticky top-0 h-screen overflow-y-auto">
            <Sidebar />
          </div>
        </div>
        <div className="w-4/5 flex flex-col">
          <div className="sticky top-0 z-20 bg-white border-b">
            <Navbar />
          </div>
          <main className="flex-1 p-8">
            <div className="max-w-[1200px]">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
