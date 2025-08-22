'use client';

import { create } from 'zustand';
import { doc, updateDoc, deleteDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { createTasksListener } from '@/lib/listeners';

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
  setTasks: (tasks) => {
    // Separate active tasks from deleted (in bin) and pending review tasks
    const activeTasks = tasks.filter(task => task.status !== 'deleted' && task.status !== 'pending_review');
    const binTasks = tasks.filter(task => task.status === 'deleted');
    const reviewTasks = tasks.filter(task => task.status === 'pending_review');
    
    // Add a small delay to show the loading animation
    setTimeout(() => {
      set({ 
        tasks: activeTasks, 
        tasksInBin: binTasks,
        pendingReviews: reviewTasks,
        loading: false 
      });
    }, 800); // 800ms delay to show skeleton
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
      // Using the setTasks method that includes a delay for the animation
      get().setTasks(tasks);
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

      await addDoc(collection(db, 'tasks'), newTask);
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
        status: 'pending_review',
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
        status: isApproved ? 'completed' : 'rejected',
        reviewCompletedAt: new Date(),
        reviewedBy: reviewData.reviewedBy || null,
        reviewFeedback: reviewData.feedback || '',
        videoPosted: false, // Initialize as false when task is completed
        completedAt: new Date(), // Add completedAt timestamp
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
      filteredTasks = filteredTasks.filter(task => task.status === mergedFilters.status);
    }

    if (mergedFilters.assignee) {
      filteredTasks = filteredTasks.filter(task => task.assignee === mergedFilters.assignee);
    }

    if (mergedFilters.priority) {
      filteredTasks = filteredTasks.filter(task => task.priority === mergedFilters.priority);
    }

    if (mergedFilters.type) {
      filteredTasks = filteredTasks.filter(task => task.type === mergedFilters.type);
    }

    if (mergedFilters.search) {
      const searchLower = mergedFilters.search.toLowerCase();
      filteredTasks = filteredTasks.filter(task =>
        task.title?.toLowerCase().includes(searchLower) ||
        task.description?.toLowerCase().includes(searchLower) ||
        task.assignee?.toLowerCase().includes(searchLower)
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
  switch (sortType) {
    case 'newest':
      return [...tasks].sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
        return dateB - dateA;
      });
    
    case 'oldest':
      return [...tasks].sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
        return dateA - dateB;
      });
      
    case 'priority':
      // Sort by priority: High > Medium > Low
      const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
      return [...tasks].sort((a, b) => {
        return (priorityOrder[a.priority?.toLowerCase()] || 999) - 
               (priorityOrder[b.priority?.toLowerCase()] || 999);
      });
      
    case 'deadline':
      return [...tasks].sort((a, b) => {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        const dateA = a.deadline?.toDate?.() || new Date(a.deadline);
        const dateB = b.deadline?.toDate?.() || new Date(b.deadline);
        return dateA - dateB;
      });
      
    case 'alphabetical':
      return [...tasks].sort((a, b) => {
        return (a.title || '').localeCompare(b.title || '');
      });
      
    default:
      return tasks;
  }
};

export default useTaskStore;
