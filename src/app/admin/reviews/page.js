'use client';

import { useEffect } from 'react';
import { Separator } from '@/components/ui/separator';
import { TaskApprovalScreen } from '@/components/TaskApprovalScreen';
import useTaskStore from '@/store/taskStore';
import useAuthStore from '@/lib/store';

export default function ReviewsPage() {
  const { initializeListener, cleanup } = useTaskStore();
  const { user } = useAuthStore();
  
  // Initialize listener for all tasks (including pending review)
  useEffect(() => {
    if (user) {
      const options = {
        adminView: user.role === 'admin',
        includeReview: true,
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
        <h1 className="text-2xl font-bold">Task Reviews</h1>
        <p className="text-gray-500 mt-1">
          Review and approve tasks that have been submitted for approval.
        </p>
      </div>
      
      <Separator />
      
      <TaskApprovalScreen />
    </div>
  );
}
