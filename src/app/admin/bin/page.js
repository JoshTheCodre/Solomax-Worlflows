'use client';

import { useEffect } from 'react';
import { Separator } from '@/components/ui/separator';
import { TaskBin } from '@/components/TaskBin';
import useTaskStore from '@/store/taskStore';
import useAuthStore from '@/lib/store';

export default function BinPage() {
  const { initializeListener, cleanup } = useTaskStore();
  const { user } = useAuthStore();
  
  // Initialize listener for all tasks (including deleted ones)
  useEffect(() => {
    if (user) {
      const options = {
        adminView: user.role === 'admin',
        includeBin: true,
      };
      
      const unsubscribe = initializeListener(options);
      
      return () => {
        cleanup();
      };
    }
  }, [user, initializeListener, cleanup]);

  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Recycle Bin</h1>
        <p className="text-gray-500 mt-1">
          Manage your deleted tasks. Items remain in the bin for 30 days before being permanently deleted.
        </p>
      </div>
      
      <Separator />
      
      <TaskBin />
    </div>
  );
}
