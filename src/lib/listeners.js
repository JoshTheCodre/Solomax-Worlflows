'use client';

import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Creates a real-time listener for tasks with optional filtering
 * @param {Function} callback - Function to call when data changes
 * @param {Object} options - Filter options
 * @param {string} options.assignee - Filter by assignee email
 * @param {boolean} options.adminView - If true, fetches all tasks (for admin)
 * @returns {Function} Unsubscribe function
 */
export const createTasksListener = (callback, options = {}) => {
  const { assignee, adminView = false } = options;
  
  try {
    let q;
    
    if (adminView) {
      // Admin view: get all tasks, ordered by creation date
      q = query(
        collection(db, 'tasks'),
        orderBy('createdAt', 'desc')
      );
    } else if (assignee) {
      // User view: get tasks assigned to specific user
      q = query(
        collection(db, 'tasks'),
        where('assignee', '==', assignee)
      );
    } else {
      // Default: get all tasks without filtering
      q = query(collection(db, 'tasks'));
    }

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const tasksData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Ensure dates are properly handled
        createdAt: doc.data().createdAt || new Date(),
        deadline: doc.data().deadline || new Date(),
      }));

      // Sort locally if not using orderBy (to avoid composite index issues)
      if (!adminView) {
        tasksData.sort((a, b) => {
          if (a.createdAt && b.createdAt) {
            const aDate = a.createdAt.toDate ? a.createdAt.toDate() : a.createdAt;
            const bDate = b.createdAt.toDate ? b.createdAt.toDate() : b.createdAt;
            return bDate - aDate;
          }
          return 0;
        });
      }

      callback(tasksData);
    }, (error) => {
      console.error('Error in tasks listener:', error);
      callback([]);
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error creating tasks listener:', error);
    return () => {}; // Return empty function as fallback
  }
};

/**
 * Creates a real-time listener for users
 * @param {Function} callback - Function to call when data changes
 * @param {Object} options - Filter options
 * @param {string} options.role - Filter by user role
 * @returns {Function} Unsubscribe function
 */
export const createUsersListener = (callback, options = {}) => {
  const { role } = options;
  
  try {
    let q;
    
    if (role) {
      q = query(
        collection(db, 'users'),
        where('role', '==', role)
      );
    } else {
      q = query(collection(db, 'users'));
    }

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const usersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      callback(usersData);
    }, (error) => {
      console.error('Error in users listener:', error);
      callback([]);
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error creating users listener:', error);
    return () => {};
  }
};

/**
 * Creates a combined listener for users and their task counts
 * @param {Function} callback - Function to call when data changes
 * @returns {Function} Cleanup function that unsubscribes from all listeners
 */
export const createTeamDataListener = (callback) => {
  let unsubscribeUsers = null;
  let unsubscribeTasks = null;
  let usersData = [];
  let tasksData = [];

  const updateCombinedData = () => {
    const updatedUsersData = usersData.map(user => {
      const userTasks = tasksData.filter(task => task.assignee === user.email);
      const activeTasks = userTasks.filter(task => task.status === 'active' || task.status === 'in_progress').length;
      
      return {
        ...user,
        tasks: userTasks.length,
        activeTasks
      };
    });

    callback(updatedUsersData);
  };

  try {
    // Listen to users
    unsubscribeUsers = createUsersListener((users) => {
      usersData = users.map(user => ({
        ...user,
        name: user.displayName || user.email,
        role: user.role || 'Member',
        status: user.status || 'active',
        lastActive: user.lastActive?.toDate() || new Date(),
        tasks: 0,
        activeTasks: 0
      }));
      updateCombinedData();
    }, { role: 'user' });

    // Listen to tasks
    unsubscribeTasks = createTasksListener((tasks) => {
      tasksData = tasks;
      updateCombinedData();
    });

    // Return cleanup function
    return () => {
      if (unsubscribeUsers) unsubscribeUsers();
      if (unsubscribeTasks) unsubscribeTasks();
    };
  } catch (error) {
    console.error('Error creating team data listener:', error);
    return () => {};
  }
};
