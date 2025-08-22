'use client';

import { useEffect, useState } from 'react';
import { collection, updateDoc, doc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import useAuthStore from '@/lib/store';
import { useTaskStore } from '@/store';
import DashboardLayout from '@/components/DashboardLayout';
import { TaskTable } from '@/components/TaskTable';
import { TaskDetailPanel } from '@/components/TaskDetailPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TASK_STATUS } from '@/lib/utils';

export default function Home() {
  const { user } = useAuthStore();
  const { 
    tasks, 
    selectedTask, 
    setSelectedTask, 
    updateTask,
    initializeListener, 
    cleanup
  } = useTaskStore();
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => {
    console.log('Home page useEffect - User:', user); // Debug log

    if (!user) {
      console.log('No user found, returning'); // Debug log
      return;
    }

    console.log('Setting up tasks listener for user email:', user.email); // Debug log

    // Initialize real-time listener for user's tasks
    const unsubscribe = initializeListener({ assignee: user.email });
    
    return () => {
      cleanup();
    };
  }, [user, initializeListener, cleanup]);

  const handleUpdateTask = async (taskData) => {
    try {
      await updateTask(taskData.id, taskData);

      if (taskData.status === TASK_STATUS.PENDING_APPROVAL) {
        // Create approval request
        await addDoc(collection(db, 'approvals'), {
          taskId: taskData.id,
          requesterId: user.uid,
          status: 'pending',
          createdAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const getFilteredTasks = () => {
    console.log('getFilteredTasks - Current tasks:', tasks); // Debug log
    console.log('getFilteredTasks - Active tab:', activeTab); // Debug log

    if (!tasks) {
      console.log('No tasks available'); // Debug log
      return [];
    }
    
    const now = new Date();
    let filteredTasks = tasks;
    console.log('Initial filtered tasks:', filteredTasks); // Debug log

    switch (activeTab) {
      case 'active':
        return filteredTasks.filter(task => 
          task.status === TASK_STATUS.ACTIVE || task.status === TASK_STATUS.IN_PROGRESS
        );
      case 'in_progress':
        return filteredTasks.filter(task => 
          task.status === TASK_STATUS.IN_PROGRESS || task.status === TASK_STATUS.PENDING_APPROVAL
        );
      case 'completed':
        return filteredTasks.filter(task => task.status === TASK_STATUS.COMPLETED);
      case 'due':
        return filteredTasks.filter(task => {
          const deadline = task.deadline.toDate();
          return deadline < now && task.status !== TASK_STATUS.COMPLETED;
        });
      default:
        return filteredTasks;
    }
  };

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-6">My Tasks</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="due">Due</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {tasks ? (
              <>
                <div className="mb-4">
                  <p className="text-sm text-gray-500">
                    Total tasks: {tasks.length} | Filtered tasks: {getFilteredTasks().length}
                  </p>
                </div>
                <TaskTable 
                  data={getFilteredTasks()} 
                  onRowClick={setSelectedTask}
                />
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading tasks...</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <TaskDetailPanel
          task={selectedTask}
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdateTask={handleUpdateTask}
          canEdit={true}
        />
    </DashboardLayout>
  );
}
