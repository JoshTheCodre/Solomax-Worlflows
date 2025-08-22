'use client';

import { useEffect, useRef } from 'react';
import { createTasksListener } from '@/lib/listeners';
import useNotificationStore from '@/store/notificationStore';
import useAuthStore from '@/lib/store';

export function useTaskNotifications() {
  const { user } = useAuthStore();
  const { addNotification, createTaskAssignedNotification, createTaskUpdatedNotification, createTaskTransferredNotification } = useNotificationStore();
  const previousTasksRef = useRef([]);
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    if (!user || user.role === 'admin') return; // Skip for admins

    // Listen to all tasks to detect any changes
    const unsubscribe = createTasksListener((tasks) => {
      const previousTasks = previousTasksRef.current;
      
      // Skip notifications on initial load
      if (isInitialLoadRef.current) {
        previousTasksRef.current = tasks;
        isInitialLoadRef.current = false;
        return;
      }

      // Check for new tasks or task changes
      tasks.forEach(currentTask => {
        const previousTask = previousTasks.find(t => t.id === currentTask.id);
        
        if (!previousTask) {
          // New task created - notify everyone except admins
          const notification = createTaskAssignedNotification(currentTask, currentTask.createdBy || 'System');
          addNotification(notification);
        } else {
          // Existing task - check for changes
          
          // Task assigned to someone new
          if (currentTask.assignee !== previousTask.assignee) {
            const notification = createTaskTransferredNotification(
              currentTask, 
              currentTask.updatedBy || 'System',
              currentTask.assignee
            );
            addNotification(notification);
          }
          
          // Task updated (check for significant changes)
          else {
            const significantChange = 
              currentTask.title !== previousTask.title ||
              currentTask.description !== previousTask.description ||
              currentTask.priority !== previousTask.priority ||
              currentTask.status !== previousTask.status ||
              currentTask.type !== previousTask.type ||
              (currentTask.deadline?.toDate?.()?.getTime() !== previousTask.deadline?.toDate?.()?.getTime());
            
            if (significantChange && currentTask.updatedBy && currentTask.updatedBy !== user.email) {
              const notification = createTaskUpdatedNotification(currentTask, currentTask.updatedBy);
              addNotification(notification);
            }
          }
        }
      });

      // Check for deleted tasks (tasks that were in previous but not in current)
      previousTasks.forEach(previousTask => {
        const currentTask = tasks.find(t => t.id === previousTask.id);
        if (!currentTask) {
          // Task was deleted - could add notification for this if needed
          console.log('Task deleted:', previousTask.title);
        }
      });

      previousTasksRef.current = tasks;
    }, { adminView: true }); // Listen to all tasks, not just user's tasks

    return unsubscribe;
  }, [user, addNotification, createTaskAssignedNotification, createTaskUpdatedNotification, createTaskTransferredNotification]);
}

// Global task notifications provider component
export function TaskNotificationsProvider({ children }) {
  useTaskNotifications();
  return children;
}
