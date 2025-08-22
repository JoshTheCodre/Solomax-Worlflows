'use client';

import { useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import useAuthStore from '@/lib/store';
import { useTaskStore } from '@/store';
import { TasksTable } from '@/components/TasksTable';
import { EditTaskModal } from '@/components/EditTaskModal';

export default function AdminTasksPage() {
  const { user } = useAuthStore();
  const { 
    tasks, 
    selectedTask, 
    setSelectedTask, 
    updateTask, 
    deleteTask, 
    transferTask,
    initializeListener, 
    cleanup,
    loading 
  } = useTaskStore();
  
  console.log('Admin Tasks page - Current user:', user); // Debug log

  useEffect(() => {
    // Initialize real-time listener for admin (all tasks)
    initializeListener({ adminView: true });
    
    // Cleanup on unmount
    return () => cleanup();
  }, [initializeListener, cleanup]);

  const filterTasks = (type) => {
    switch (type) {
      case 'pending':
        return tasks.filter(task => task.status !== 'completed');
      case 'completed':
        return tasks.filter(task => task.status === 'completed');
      default:
        return tasks;
    }
  };

  const onTransferTask = async (task) => {
    // Show transfer modal
    // For now just mark as transferred
    try {
      await transferTask(task.id, task.assignee, {
        status: 'transferred',
        activity: [
          ...(task.activity || []),
          {
            user: user.displayName || user.email,
            action: 'transferred the task',
            timestamp: new Date()
          }
        ]
      });
    } catch (error) {
      console.error('Error transferring task:', error);
    }
  };

  const onUpdateTask = async (updatedTask) => {
    try {
      await updateTask(updatedTask.id, {
        ...updatedTask,
        updatedBy: user.email, // Track who updated the task
        activity: [
          ...(updatedTask.activity || []),
          {
            user: user.displayName || user.email,
            action: 'updated the task',
            timestamp: new Date()
          }
        ]
      });
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const renderTaskDetails = (task) => {
    if (!task) return null;

    return (
      <Card className="p-6 h-full">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">{task.title}</h2>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                  {task.type}
                </Badge>
                <Badge 
                  variant="outline" 
                  className={task.status === 'completed' 
                    ? 'text-green-600 border-green-200 bg-green-50'
                    : 'text-yellow-600 border-yellow-200 bg-yellow-50'
                  }
                >
                  {task.status}
                </Badge>
                <Badge 
                  variant="outline"
                  className={
                    task.priority === 'high' 
                      ? 'text-red-600 border-red-200 bg-red-50'
                      : task.priority === 'medium'
                        ? 'text-orange-600 border-orange-200 bg-orange-50'
                        : 'text-green-600 border-green-200 bg-green-50'
                  }
                >
                  {task.priority} priority
                </Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onTransferTask(task)}>Transfer</Button>
              <EditTaskModal
                task={task}
                onSubmit={onUpdateTask}
                trigger={
                  <Button variant="outline">Edit Task</Button>
                }
              />
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-6 pt-4 border-t">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Assignee</h3>
                <p className="mt-1 text-base font-medium text-gray-900">{task.assignee}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Due Date</h3>
                <p className="mt-1 text-base font-medium text-gray-900">
                  {format(task.deadline.toDate(), 'MMM dd, yyyy')}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Created By</h3>
                <p className="mt-1 text-base font-medium text-gray-900">{task.createdBy}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Description</h3>
                <p className="mt-1 text-sm text-gray-600">{task.description || 'No description provided'}</p>
              </div>
            </div>
          </div>

          {/* Activity Log */}
          <div className="pt-4 border-t">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Activity</h3>
            <div className="space-y-3">
              {task.activity?.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                    {item.user.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-gray-900">{item.user}</span> {item.action}
                    </p>
                    <p className="text-xs text-gray-500">{format(item.timestamp.toDate(), 'MMM dd, yyyy')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="h-full flex">
      {/* Task List */}
      <div className="flex-1 overflow-auto border-r">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Manage Tasks</h1>
            <Button>New Task</Button>
          </div>
          
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Tasks</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-0">
              <div className="space-y-4">
                <TasksTable
                  data={tasks}
                  onRowClick={(task) => setSelectedTask(task)}
                  onDeleteTask={(taskId) => {
                    deleteTask(taskId);
                  }}
                  onTransferTask={onTransferTask}
                  onUpdateTask={onUpdateTask}
                  isAdmin={true}
                />
              </div>
            </TabsContent>
            <TabsContent value="pending" className="mt-0">
              <div className="space-y-4">
                {filterTasks('pending').map((task) => (
                  <div
                    key={task.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-all hover:border-blue-200 hover:shadow-sm ${
                      selectedTask?.id === task.id ? 'border-blue-200 shadow-sm bg-blue-50/40' : 'border-gray-200'
                    }`}
                    onClick={() => setSelectedTask(task)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{task.title}</h3>
                      <Badge 
                        variant="outline" 
                        className={
                          task.priority === 'high' 
                            ? 'text-red-600 border-red-200 bg-red-50'
                            : task.priority === 'medium'
                              ? 'text-orange-600 border-orange-200 bg-orange-50'
                              : 'text-green-600 border-green-200 bg-green-50'
                        }
                      >
                        {task.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-gray-500">
                        <span>{task.type}</span>
                        <span>•</span>
                        <span>Due {format(task.deadline.toDate(), 'MMM dd')}</span>
                      </div>
                      <Badge 
                        variant="outline" 
                        className="text-yellow-600 border-yellow-200 bg-yellow-50"
                      >
                        {task.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="completed" className="mt-0">
              <div className="space-y-4">
                {filterTasks('completed').map((task) => (
                  <div
                    key={task.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-all hover:border-blue-200 hover:shadow-sm ${
                      selectedTask?.id === task.id ? 'border-blue-200 shadow-sm bg-blue-50/40' : 'border-gray-200'
                    }`}
                    onClick={() => setSelectedTask(task)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{task.title}</h3>
                      <Badge 
                        variant="outline" 
                        className={
                          task.priority === 'high' 
                            ? 'text-red-600 border-red-200 bg-red-50'
                            : task.priority === 'medium'
                              ? 'text-orange-600 border-orange-200 bg-orange-50'
                              : 'text-green-600 border-green-200 bg-green-50'
                        }
                      >
                        {task.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-gray-500">
                        <span>{task.type}</span>
                        <span>•</span>
                        <span>Due {format(task.deadline.toDate(), 'MMM dd')}</span>
                      </div>
                      <Badge 
                        variant="outline" 
                        className="text-green-600 border-green-200 bg-green-50"
                      >
                        {task.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Task Details */}
      <div className="w-[500px] p-6 bg-gray-50/80">
        {selectedTask ? renderTaskDetails(selectedTask) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            Select a task to view details
          </div>
        )}
      </div>
    </div>
  );
}
