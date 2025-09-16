'use client';

import { create } from 'zustand';
import { doc, updateDoc, deleteDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { createTasksListener } from '@/lib/listeners';
import useNotificationStore from './notificationStore';
import useAuthStore from '@/lib/store';

const useTaskStore = create((set, get) => ({
  // State
  tasks: [],
  selectedTask: null,
  loading: true, // Initially set to true to show loading skeleton
  error: null,
  listener: null,
  sortOrder: 'newest', // Options: 'newest', 'oldest', 'priority', 'deadline'
  filterCriteria: {},
  tasksInBin: [], // Tasks in recycle bin
  pendingReviews: [], // Tasks awaiting review

  // Actions
  setTasks: (tasks, isAdminView = false) => {
    console.log('setTasks called with', tasks.length, 'tasks', isAdminView ? '(admin view)' : '(user view)');
    
    // Log all unique status values to understand what we're working with
    const statusValues = [...new Set(tasks.map(t => t.status))];
    console.log('Unique status values found in tasks:', statusValues);
    
    if (isAdminView) {
      // Admin view: separate tasks by status for different admin panels
      const activeTasks = tasks.filter(task => {
        const status = String(task.status || '').trim().toLowerCase();
        // Include tasks that are active, in_progress, completed, rejected or have no status
        return status !== 'deleted' && status !== 'pending_approval';
      });
      
      const binTasks = tasks.filter(task => {
        const status = String(task.status || '').trim().toLowerCase();
        return status === 'deleted';
      });
      
      const reviewTasks = tasks.filter(task => {
        const status = String(task.status || '').trim().toLowerCase();
        return status === 'pending_approval';
      });
      
      console.log(`Admin task distribution: ${activeTasks.length} active, ${binTasks.length} in bin, ${reviewTasks.length} pending review`);
      
      // Add a small delay to show the loading animation
      setTimeout(() => {
        set({ 
          tasks: activeTasks, 
          tasksInBin: binTasks,
          pendingReviews: reviewTasks,
          loading: false 
        });
      }, 800); // 800ms delay to show skeleton
    } else {
      // User view: include all tasks (including pending approval) so users can see them in Reviews tab
      const userTasks = tasks.filter(task => {
        const status = String(task.status || '').trim().toLowerCase();
        // Exclude only deleted tasks for user view
        return status !== 'deleted';
      });
      
      console.log(`User task distribution: ${userTasks.length} total tasks (excluding deleted)`);
      
      // Add a small delay to show the loading animation
      setTimeout(() => {
        set({ 
          tasks: userTasks, 
          tasksInBin: [], // Users don't see bin
          pendingReviews: [], // Not needed for user view since pending approval tasks are in main tasks
          loading: false 
        });
      }, 800); // 800ms delay to show skeleton
    }
  },
  
  setSelectedTask: (task) => set({ selectedTask: task }),
  
  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ error }),
  
  // Sorting and filtering
  setSortOrder: (order) => set({ sortOrder: order }),
  
  setFilterCriteria: (criteria) => set({ filterCriteria: criteria }),

  // Initialize real-time listener
  initializeListener: (options = {}) => {
    const { listener } = get();
    
    // Clean up existing listener
    if (listener) {
      listener();
    }

    // Set loading to true when we start initializing
    set({ loading: true });

    // Create new listener
    const unsubscribe = createTasksListener((tasks) => {
      // Pass the adminView flag to setTasks to determine filtering behavior
      get().setTasks(tasks, options.adminView || false);
    }, options);

    set({ listener: unsubscribe });
    return unsubscribe;
  },

  // Clean up listener
  cleanup: () => {
    const { listener } = get();
    if (listener) {
      listener();
      set({ listener: null });
    }
  },

  // CRUD Operations
  addTask: async (taskData) => {
    try {
      set({ loading: true, error: null });
      
      const newTask = {
        ...taskData,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: taskData.status || 'active'
      };

      const docRef = await addDoc(collection(db, 'tasks'), newTask);
      
      // Send notification to the assigned user if there's an assignee
      if (newTask.assignee) {
        try {
          console.log('Creating notification for task:', newTask.title, 'assigned to:', newTask.assignee);
          const { addNotification, createTaskAssignedNotification } = useNotificationStore.getState();
          const { user: currentUser } = useAuthStore.getState();
          const notification = createTaskAssignedNotification(
            { ...newTask, id: docRef.id }, 
            currentUser?.name || currentUser?.email || 'Admin'
          );
          console.log('Created notification:', notification);
          addNotification(notification);
          console.log('Notification added to store');
        } catch (notificationError) {
          console.warn('Failed to send notification:', notificationError);
          // Don't fail the task creation if notification fails
        }
      }
      
      // The real-time listener will automatically update the state
      return true;
    } catch (error) {
      console.error('Error adding task:', error);
      set({ error: error.message, loading: false });
      return false;
    }
  },

  updateTask: async (taskId, updateData) => {
    try {
      set({ error: null });
      
      const updatePayload = {
        ...updateData,
        updatedAt: new Date()
      };

      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, updatePayload);
      
      // Update selected task if it's the one being updated
      const { selectedTask } = get();
      if (selectedTask && selectedTask.id === taskId) {
        set({ selectedTask: { ...selectedTask, ...updatePayload } });
      }
      
      // The real-time listener will automatically update the tasks list
      // and trigger notifications via useTaskNotifications hook
      return true;
    } catch (error) {
      console.error('Error updating task:', error);
      set({ error: error.message });
      return false;
    }
  },

  // Soft delete - move to bin
  moveTaskToBin: async (taskId) => {
    try {
      set({ error: null });
      
      return await get().updateTask(taskId, {
        status: 'deleted',
        deletedAt: new Date()
      });
    } catch (error) {
      console.error('Error moving task to bin:', error);
      set({ error: error.message });
      return false;
    }
  },
  
  // Restore from bin
  restoreTask: async (taskId) => {
    try {
      set({ error: null });
      
      return await get().updateTask(taskId, {
        status: 'active',
        deletedAt: null
      });
    } catch (error) {
      console.error('Error restoring task:', error);
      set({ error: error.message });
      return false;
    }
  },
  
  // Permanently delete
  deleteTask: async (taskId) => {
    try {
      set({ error: null });
      
      const taskRef = doc(db, 'tasks', taskId);
      await deleteDoc(taskRef);
      
      // Clear selected task if it's the one being deleted
      const { selectedTask } = get();
      if (selectedTask && selectedTask.id === taskId) {
        set({ selectedTask: null });
      }
      
      // The real-time listener will automatically update the tasks list
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      set({ error: error.message });
      return false;
    }
  },
  
  // Permanently delete all tasks in bin
  deleteAllTasksInBin: async () => {
    try {
      set({ error: null, loading: true });
      
      const { tasksInBin } = get();
      
      // Delete each task in the bin
      const deletePromises = tasksInBin.map(task => 
        deleteDoc(doc(db, 'tasks', task.id))
      );
      
      await Promise.all(deletePromises);
      
      // The real-time listener will automatically update the tasks list
      set({ loading: false });
      return true;
    } catch (error) {
      console.error('Error deleting all tasks in bin:', error);
      set({ error: error.message, loading: false });
      return false;
    }
  },

  transferTask: async (taskId, newAssignee, transferData = {}) => {
    try {
      set({ error: null });
      
      const updatePayload = {
        assignee: newAssignee,
        updatedAt: new Date(),
        activity: transferData.activity || [],
        ...transferData
      };

      return await get().updateTask(taskId, updatePayload);
    } catch (error) {
      console.error('Error transferring task:', error);
      set({ error: error.message });
      return false;
    }
  },
  
  // Request review for a task
  requestReview: async (taskId, reviewData = {}) => {
    try {
      set({ error: null });
      
      const updatePayload = {
        status: 'pending_approval',
        reviewRequestedAt: new Date(),
        reviewRequestedBy: reviewData.requestedBy || null,
        reviewNotes: reviewData.notes || '',
        ...reviewData
      };
      
      return await get().updateTask(taskId, updatePayload);
    } catch (error) {
      console.error('Error requesting review:', error);
      set({ error: error.message });
      return false;
    }
  },
  
  // Approve or reject a review
  completeReview: async (taskId, isApproved, reviewData = {}) => {
    try {
      set({ error: null });
      
      const updatePayload = {
        status: isApproved ? 'completed' : 'redo',
        reviewCompletedAt: new Date(),
        reviewedBy: reviewData.reviewedBy || null,
        reviewFeedback: reviewData.feedback || '',
        videoPosted: false, // Initialize as false when task is completed
        completedAt: isApproved ? new Date() : null, // Only set completedAt if approved
        ...reviewData
      };
      
      return await get().updateTask(taskId, updatePayload);
    } catch (error) {
      console.error('Error completing review:', error);
      set({ error: error.message });
      return false;
    }
  },

  // Utility functions
  getTaskById: (taskId) => {
    const { tasks } = get();
    return tasks.find(task => task.id === taskId);
  },

  getTasksByStatus: (status) => {
    const { tasks } = get();
    return tasks.filter(task => task.status === status);
  },

  getTasksByAssignee: (assignee) => {
    const { tasks } = get();
    return tasks.filter(task => task.assignee === assignee);
  },

  getFilteredTasks: (filters = {}) => {
    // Use stored filter criteria if not provided
    const mergedFilters = { ...get().filterCriteria, ...filters };
    const { tasks, tasksInBin, pendingReviews, sortOrder } = get();
    
    // Debug filter criteria
    console.log('getFilteredTasks called with filters:', filters);
    console.log('Current filterCriteria in store:', get().filterCriteria);
    console.log('Merged filters being applied:', mergedFilters);
    
    // Determine which task list to use based on view
    let taskList;
    if (mergedFilters.view === 'bin') {
      taskList = [...tasksInBin];
    } else if (mergedFilters.view === 'review') {
      taskList = [...pendingReviews];
    } else {
      taskList = [...tasks];
    }
    
    let filteredTasks = taskList;

    if (mergedFilters.status) {
      console.log(`Filtering by status: ${mergedFilters.status}`);
      // Added debug to see status values in tasks
      console.log('Status values in first few tasks:', filteredTasks.slice(0, 5).map(t => ({ id: t.id, status: t.status })));
      
      const targetStatus = String(mergedFilters.status).trim().toLowerCase();
      
      filteredTasks = filteredTasks.filter(task => {
        // Handle case sensitivity and whitespace in status comparison
        const taskStatus = String(task.status || '').trim().toLowerCase();
        
        // Special handling for 'active' status
        if (targetStatus === 'active') {
          // For 'active' filter, include tasks that are active, in_progress, redo, or have no explicit status
          // (treating empty/null status as active)
          const isActiveOrInProgress = taskStatus === 'active' || taskStatus === 'in_progress' || taskStatus === 'redo' || taskStatus === '' || !task.status;
          
          if (!isActiveOrInProgress) {
            console.log(`Task ${task.id} (${task.title}) has status "${taskStatus}" - excluding from active filter`);
          }
          
          return isActiveOrInProgress;
        } else {
          // For other statuses, do exact matching
          const isMatch = taskStatus === targetStatus;
          
          if (!isMatch) {
            console.log(`Task ${task.id} (${task.title}) has status "${taskStatus}" which doesn't match "${targetStatus}"`);
          }
          
          return isMatch;
        }
      });
      
      console.log(`After status filtering: ${filteredTasks.length} tasks remaining`);
    }

    if (mergedFilters.assignee) {
      console.log(`Filtering by assignee: ${mergedFilters.assignee}`);
      filteredTasks = filteredTasks.filter(task => task.assignee === mergedFilters.assignee);
    }

    if (mergedFilters.priority) {
      console.log(`Filtering by priority: ${mergedFilters.priority}`);
      filteredTasks = filteredTasks.filter(task => {
        // Case insensitive comparison for priority
        return task.priority && task.priority.toLowerCase() === mergedFilters.priority.toLowerCase();
      });
    }

    if (mergedFilters.type) {
      console.log(`Filtering by type: ${mergedFilters.type}`);
      filteredTasks = filteredTasks.filter(task => task.type === mergedFilters.type);
    }

    // Filter for due tasks - THIS IS SEPARATE FROM STATUS
    // Due tasks are tasks that have passed their deadline regardless of their status
    if (mergedFilters.due) {
      console.log('Filtering for due tasks (past deadline, not completed)');
      const now = new Date();
      filteredTasks = filteredTasks.filter(task => {
        if (!task.deadline) {
          console.log(`Task ${task.id} has no deadline - excluding from due filter`);
          return false;
        }
        
        const deadline = task.deadline.toDate ? task.deadline.toDate() : new Date(task.deadline);
        const isPastDeadline = deadline < now;
        const isNotCompleted = task.status !== 'completed';
        const isDue = isPastDeadline && isNotCompleted;
        
        if (!isDue) {
          console.log(`Task ${task.id} (${task.title}) - deadline: ${deadline}, past: ${isPastDeadline}, not completed: ${isNotCompleted} - ${isDue ? 'DUE' : 'NOT DUE'}`);
        }
        
        return isDue;
      });
      console.log(`After due filtering: ${filteredTasks.length} tasks remaining`);
    }

    if (mergedFilters.search) {
      const searchLower = mergedFilters.search.toLowerCase();
      console.log(`Searching for: ${searchLower}`);
      filteredTasks = filteredTasks.filter(task =>
        (task.title?.toLowerCase() || '').includes(searchLower) ||
        (task.description?.toLowerCase() || '').includes(searchLower) ||
        (task.assignee?.toLowerCase() || '').includes(searchLower) ||
        (task.type?.toLowerCase() || '').includes(searchLower) ||
        (task.status?.toLowerCase() || '').includes(searchLower) ||
        (task.priority?.toLowerCase() || '').includes(searchLower)
      );
    }
    
    // Apply sorting
    return sortTasks(filteredTasks, sortOrder || 'newest');
  },
  
  // Sort tasks based on criteria
  sortTasks: (tasks, sortType) => sortTasks(tasks, sortType),
  
  // Get tasks in bin
  getBinTasks: () => {
    return get().tasksInBin;
  },
  
  // Get tasks pending review
  getReviewTasks: () => {
    return get().pendingReviews;
  }
}));

// Helper function to sort tasks
const sortTasks = (tasks, sortType) => {
  console.log(`Sorting ${tasks.length} tasks by: ${sortType}`);
  // Debug output to show first few tasks before sorting
  if (tasks.length > 0) {
    console.log('First few tasks before sorting:', 
      tasks.slice(0, 3).map(t => ({
        id: t.id,
        title: t.title,
        createdAt: t.createdAt,
        deadline: t.deadline,
        priority: t.priority
      }))
    );
  }
  
  let sortedTasks = [...tasks]; // Make a copy of tasks for sorting
  
  switch (sortType) {
    case 'newest':
      sortedTasks = sortedTasks.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
        return dateB - dateA;
      });
      break;
    
    case 'oldest':
      sortedTasks = sortedTasks.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
        return dateA - dateB;
      });
      break;
      
    case 'priority':
      // Sort by priority: High > Medium > Low
      const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
      sortedTasks = sortedTasks.sort((a, b) => {
        return (priorityOrder[a.priority?.toLowerCase()] || 999) - 
               (priorityOrder[b.priority?.toLowerCase()] || 999);
      });
      break;
      
    case 'deadline':
      sortedTasks = sortedTasks.sort((a, b) => {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        const dateA = a.deadline?.toDate?.() || new Date(a.deadline);
        const dateB = b.deadline?.toDate?.() || new Date(b.deadline);
        return dateA - dateB;
      });
      break;
      
    case 'alphabetical':
      sortedTasks = sortedTasks.sort((a, b) => {
        return (a.title || '').localeCompare(b.title || '');
      });
      break;
      
    default:
      // No sorting needed
      break;
  }
  
  // Log the first few sorted tasks
  if (sortedTasks.length > 0) {
    console.log('First few tasks after sorting:', 
      sortedTasks.slice(0, 3).map(t => ({
        id: t.id,
        title: t.title,
        createdAt: t.createdAt,
        deadline: t.deadline,
        priority: t.priority
      }))
    );
  }
  
  return sortedTasks;
};

export default useTaskStore;
