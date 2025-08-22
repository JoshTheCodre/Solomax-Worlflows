'use client';

import { useState, useEffect } from 'react';
import useTaskStore from '@/store/taskStore';
import useAuthStore from '@/lib/store';
import { seedDummyTasks } from '@/lib/seed';
import { TaskTable } from '@/components/TaskTable';
import { AddTaskModal } from '@/components/AddTaskModal';
import { TaskDetailPanel } from '@/components/TaskDetailPanel';
import { ReviewTaskModal } from '@/components/ReviewTaskModal';
import { TaskFilters } from '@/components/TaskFilters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TASK_STATUS } from '@/lib/utils';
import { toast } from '@/components/Toast';
import { 
  PlusSquare, 
  CheckSquare, 
  Clock,
  Plus,
  FileCheck,
  Trash2,
  X
} from 'lucide-react';
import PendingUsersTable from '@/components/PendingUsersTable';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';
import { motion } from 'framer-motion';
import { TaskBin } from '@/components/TaskBin';
import { TaskApprovalScreen } from '@/components/TaskApprovalScreen';

export default function AdminDashboard() {
  const { 
    tasks, 
    pendingReviews,
    tasksInBin,
    initializeListener, 
    cleanup,
    getFilteredTasks,
    moveTaskToBin,
    updateTask,
    addTask,
    requestReview,
    loading,
    filterCriteria,
    setFilterCriteria
  } = useTaskStore();
  
  const { user } = useAuthStore();
  const [selectedTask, setSelectedTask] = useState(null);
  const [reviewTask, setReviewTask] = useState(null);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isBinOpen, setIsBinOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [stats, setStats] = useState({
    active: 0,
    completed: 0,
    due: 0,
    review: 0,
    bin: 0
  });
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        duration: 0.3
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  useEffect(() => {
    if (user) {
      const options = {
        adminView: user.role === 'admin'
      };
      
      const unsubscribe = initializeListener(options);
      return () => cleanup();
    }
  }, [user, initializeListener, cleanup]);
  
  // Apply filters and search query - handle search separately to avoid infinite loop
  useEffect(() => {
    // Only update filters when search query changes
    if (searchQuery && !filterCriteria.search || 
        !searchQuery && filterCriteria.search || 
        (searchQuery && filterCriteria.search && searchQuery !== filterCriteria.search)) {
      
      const criteria = { ...filterCriteria };
      if (searchQuery) {
        criteria.search = searchQuery;
      } else {
        delete criteria.search;
      }
      
      setFilterCriteria(criteria);
    }
  }, [searchQuery, filterCriteria.search, setFilterCriteria]);
  
  // Apply filters and calculate stats
  useEffect(() => {
    setFilteredTasks(getFilteredTasks());
    
    // Calculate stats
    const now = new Date();
    setStats({
      active: tasks.filter(t => t.status === TASK_STATUS.ACTIVE).length,
      completed: tasks.filter(t => t.status === TASK_STATUS.COMPLETED).length,
      due: tasks.filter(t => {
        if (!t.deadline) return false;
        const deadline = t.deadline.toDate ? t.deadline.toDate() : new Date(t.deadline);
        return deadline < now && t.status !== TASK_STATUS.COMPLETED;
      }).length,
      review: pendingReviews.length,
      bin: tasksInBin.length
    });
  }, [tasks, pendingReviews, tasksInBin, getFilteredTasks]);

  const handleCreateTask = async (taskData) => {
    try {
      await addTask({
        ...taskData,
        status: TASK_STATUS.ACTIVE
      });
      toast.success('Success', 'New task created successfully.');
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Error', 'Failed to create task. Please try again.');
    }
  };

  const handleOpenReviewModal = (task) => {
    setReviewTask(task);
  };
  
  const handleCloseReviewModal = () => {
    setReviewTask(null);
  };
  
  const handleUpdateTask = async (taskData) => {
    try {
      await updateTask(taskData.id, taskData);
      toast.success('Success', 'Task updated successfully.');
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Error', 'Failed to update task. Please try again.');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await moveTaskToBin(taskId);
      setSelectedTask(null); // Close the detail panel if deleted task was selected
      toast.info('Task moved to bin', 'The task has been moved to the recycle bin.');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Error', 'Failed to delete task. Please try again.');
    }
  };

  // Show loading skeleton while data is being fetched
  if (loading || !user) {
    return <DashboardSkeleton />;
  }

  return (
    <motion.div 
      className="space-y-8 w-full"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Stats Cards - Redesigned for more professional look */}
      <motion.div className="grid grid-cols-2 md:grid-cols-5 gap-4" variants={itemVariants}>
          <motion.div variants={itemVariants} whileHover={{ scale: 1.02 }} className="w-full">
            <Card className="p-4 hover:shadow-md transition-all duration-300 border-l-4 border-l-blue-500 group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase font-medium text-gray-500 tracking-wider">Active Tasks</p>
                  <motion.h3 
                    className="text-2xl font-semibold mt-1" 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {stats.active}
                  </motion.h3>
                </div>
                <div className="w-9 h-9 rounded-md bg-blue-50 text-blue-500 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <PlusSquare className="w-5 h-5" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants} whileHover={{ scale: 1.02 }} className="w-full">
            <Card className="p-4 hover:shadow-md transition-all duration-300 border-l-4 border-l-green-500 group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase font-medium text-gray-500 tracking-wider">Completed</p>
                  <motion.h3 
                    className="text-2xl font-semibold mt-1" 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    {stats.completed}
                  </motion.h3>
                </div>
                <div className="w-9 h-9 rounded-md bg-green-50 text-green-500 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                  <CheckSquare className="w-5 h-5" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants} whileHover={{ scale: 1.02 }} className="w-full">
            <Card className="p-4 hover:shadow-md transition-all duration-300 border-l-4 border-l-orange-500 group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase font-medium text-gray-500 tracking-wider">Due Soon</p>
                  <motion.h3 
                    className="text-2xl font-semibold mt-1 text-orange-500" 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    {stats.due}
                  </motion.h3>
                </div>
                <div className="w-9 h-9 rounded-md bg-orange-50 text-orange-500 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
            </Card>
          </motion.div>
          
          <motion.div variants={itemVariants} whileHover={{ scale: 1.02 }} className="w-full">
            <Card className="p-4 hover:shadow-md transition-all duration-300 border-l-4 border-l-indigo-500 group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase font-medium text-gray-500 tracking-wider">Reviews</p>
                  <motion.h3 
                    className="text-2xl font-semibold mt-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    {stats.review}
                  </motion.h3>
                </div>
                <div className="w-9 h-9 rounded-md bg-indigo-50 text-indigo-500 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                  <FileCheck className="w-5 h-5" />
                </div>
              </div>
            </Card>
          </motion.div>
          
          <motion.div variants={itemVariants} whileHover={{ scale: 1.02 }} className="w-full">
            <Card className="p-4 hover:shadow-md transition-all duration-300 border-l-4 border-l-gray-500 group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase font-medium text-gray-500 tracking-wider">Recycle Bin</p>
                  <motion.h3 
                    className="text-2xl font-semibold mt-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    {stats.bin}
                  </motion.h3>
                </div>
                <div className="w-9 h-9 rounded-md bg-gray-100 text-gray-500 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                  <Trash2 className="w-5 h-5" />
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>

        <motion.div 
          className="rounded-xl border bg-card shadow-lg overflow-hidden max-w-full"
          variants={itemVariants}
        >
          <div className="px-6 py-4 border-b bg-gray-50/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AddTaskModal onSubmit={handleCreateTask} className="mr-2" />
              <Button 
                variant="outline" 
                onClick={seedDummyTasks}
                className="text-sm group transition-all hover:shadow-lg hover:border-purple-500"
              >
                <Plus className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                Demo Data
              </Button>
              
              {user?.role === 'admin' && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setIsBinOpen(true)}
                    className="text-sm group transition-all hover:shadow-lg hover:border-gray-500"
                  >
                    <Trash2 className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                    Recycle Bin
                    {stats.bin > 0 && (
                      <motion.span 
                        className="ml-2 w-5 h-5 bg-gray-500 rounded-full flex items-center justify-center text-white text-xs"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 15 }}
                      >
                        {stats.bin}
                      </motion.span>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => setIsReviewModalOpen(true)}
                    className="text-sm group transition-all hover:shadow-lg hover:border-blue-500"
                  >
                    <FileCheck className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                    Review Tasks
                    {stats.review > 0 && (
                      <motion.span 
                        className="ml-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 15 }}
                      >
                        {stats.review}
                      </motion.span>
                    )}
                  </Button>
                </>
              )}
            </div>
            <div className="text-sm text-gray-500">
              {filteredTasks.length} total tasks
            </div>
          </div>
          
          <motion.div 
            className="px-6 pt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-3 pr-10 h-10"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-0 top-0 h-full w-10 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <TaskFilters hideSearch={true} compact={true} />
            </div>
          </motion.div>
          
          <motion.div 
            className="p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <TaskTable 
              data={filteredTasks} 
              onRowClick={setSelectedTask}
              onDeleteTask={handleDeleteTask}
              onTransferTask={(task) => {
                setSelectedTask(task);
                // Transfer will be handled through TaskDetailPanel
              }}
              onRequestReview={handleOpenReviewModal}
              isAdmin={user?.role === 'admin'}
            />
          </motion.div>
        </motion.div>

        <TaskDetailPanel
          task={selectedTask}
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          onRequestReview={handleOpenReviewModal}
          isAdmin={user?.role === 'admin'}
        />
        
        {reviewTask && (
          <ReviewTaskModal
            task={reviewTask}
            onClose={handleCloseReviewModal}
            onSubmit={async (taskId, reviewData) => {
              try {
                await requestReview(taskId, reviewData);
                toast.success('Review Requested', 'Your task has been submitted for review.');
                handleCloseReviewModal();
              } catch (error) {
                console.error('Error requesting review:', error);
                toast.error('Error', 'Failed to request review. Please try again.');
              }
            }}
          />
        )}

        {/* Recycle Bin Modal */}
        <TaskBin 
          isOpen={isBinOpen}
          onClose={() => setIsBinOpen(false)}
        />
        
        {/* Task Review Modal */}
        <TaskApprovalScreen
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
        />
    </motion.div>
  );
}
