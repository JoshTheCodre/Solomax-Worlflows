'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useNotificationStore = create(
  persist(
    (set, get) => ({
      // State
      notifications: [],
      unreadCount: 0,
      isOpen: false,

      // Actions
      addNotification: (notification) => {
        const newNotification = {
          id: Date.now() + Math.random(),
          timestamp: new Date().toISOString(), // Use ISO string for consistent serialization
          read: false,
          ...notification
        };

        set(state => ({
          notifications: [newNotification, ...state.notifications].slice(0, 50), // Keep only last 50
          unreadCount: state.unreadCount + 1
        }));
      },

      markAsRead: (notificationId) => {
        set(state => ({
          notifications: state.notifications.map(notification =>
            notification.id === notificationId
              ? { ...notification, read: true }
              : notification
          ),
          unreadCount: Math.max(0, state.unreadCount - 1)
        }));
      },

      markAllAsRead: () => {
        set(state => ({
          notifications: state.notifications.map(notification => ({
            ...notification,
            read: true
          })),
          unreadCount: 0
        }));
      },

      clearNotification: (notificationId) => {
        set(state => ({
          notifications: state.notifications.filter(notification =>
            notification.id !== notificationId
          ),
          unreadCount: state.notifications.find(n => n.id === notificationId && !n.read)
            ? state.unreadCount - 1
            : state.unreadCount
        }));
      },

      clearAllNotifications: () => {
        set({
          notifications: [],
          unreadCount: 0
        });
      },

      setIsOpen: (isOpen) => {
        set({ isOpen });
      },

      // Task-specific notification creators
      createTaskAssignedNotification: (task, assignedBy) => {
        return {
          type: 'task_assigned',
          title: 'New Task Assigned',
          message: `You have been assigned a new task: "${task.title}"`,
          task: {
            id: task.id,
            title: task.title,
            priority: task.priority,
            deadline: task.deadline ? (task.deadline.toDate ? task.deadline.toDate().toISOString() : task.deadline) : null,
            type: task.type,
            assignee: task.assignee
          },
          assignedBy,
          priority: task.priority // For styling based on priority
        };
      },

      createTaskUpdatedNotification: (task, updatedBy) => {
        return {
          type: 'task_updated',
          title: 'Task Updated',
          message: `Task "${task.title}" has been updated`,
          task: {
            id: task.id,
            title: task.title,
            priority: task.priority,
            deadline: task.deadline ? (task.deadline.toDate ? task.deadline.toDate().toISOString() : task.deadline) : null,
            type: task.type,
            assignee: task.assignee
          },
          updatedBy,
          priority: task.priority
        };
      },

      createTaskTransferredNotification: (task, transferredBy, newAssignee) => {
        return {
          type: 'task_transferred',
          title: 'Task Transferred',
          message: `Task "${task.title}" has been transferred to ${newAssignee}`,
          task: {
            id: task.id,
            title: task.title,
            priority: task.priority,
            deadline: task.deadline ? (task.deadline.toDate ? task.deadline.toDate().toISOString() : task.deadline) : null,
            type: task.type,
            assignee: newAssignee
          },
          transferredBy,
          priority: task.priority
        };
      }
    }),
    {
      name: 'task-notifications',
      partialize: (state) => ({
        notifications: state.notifications,
        unreadCount: state.unreadCount
      })
    }
  )
);

export default useNotificationStore;
