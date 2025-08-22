'use client';

import { useState, useEffect } from 'react';
import { Trash2, RefreshCw, Search, AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import useTaskStore from '@/store/taskStore';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';

export function TaskBin({ isOpen, onClose }) {
  const { 
    tasksInBin, 
    restoreTask, 
    deleteTask, 
    getFilteredTasks,
    setFilterCriteria,
    filterCriteria
  } = useTaskStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTasks, setFilteredTasks] = useState([]);
  
  // Apply search filtering
  useEffect(() => {
    const filtered = getFilteredTasks({
      view: 'bin',
      search: searchQuery
    });
    setFilteredTasks(filtered);
  }, [tasksInBin, searchQuery, getFilteredTasks]);

  const handleRestore = async (taskId) => {
    await restoreTask(taskId);
  };

  const handleDeletePermanently = async (taskId) => {
    if (window.confirm('Are you sure you want to permanently delete this task? This action cannot be undone.')) {
      await deleteTask(taskId);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      const dateObj = date.toDate ? date.toDate() : new Date(date);
      return format(dateObj, 'MMM dd, yyyy HH:mm');
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center">
            <div className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-gray-500" />
              <DialogTitle>Recycle Bin</DialogTitle>
              <Badge variant="outline" className="ml-2">{tasksInBin.length}</Badge>
            </div>
          </div>
        </DialogHeader>
        
        <div className="mt-3 relative">
          <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-gray-500" />
          <Input
            type="text"
            placeholder="Search deleted tasks..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="mt-4">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-6">
            <Trash2 className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No deleted tasks found</p>
          </div>
        ) : (
          <motion.div 
            className="space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {filteredTasks.map((task, index) => (
              <motion.div 
                key={task.id} 
                className="border rounded-md p-3 bg-gray-50"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium">{task.title}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {task.description || 'No description'}
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                      Deleted on: {formatDate(task.deletedAt)}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center gap-1"
                      onClick={() => handleRestore(task.id)}
                    >
                      <RefreshCw className="h-3 w-3" />
                      <span>Restore</span>
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={() => handleDeletePermanently(task.id)}
                    >
                      <AlertTriangle className="h-3 w-3" />
                      <span>Delete</span>
                    </Button>
                  </div>
                </div>
                
                <div className="mt-3 flex gap-2 flex-wrap">
                  <Badge variant="outline" className={
                    task.priority === 'high' ? 'border-red-200 text-red-600 bg-red-50' : 
                    task.priority === 'medium' ? 'border-orange-200 text-orange-600 bg-orange-50' :
                    'border-green-200 text-green-600 bg-green-50'
                  }>
                    {task.priority || 'No priority'}
                  </Badge>
                  <Badge variant="outline" className="border-blue-200 text-blue-600 bg-blue-50">
                    {task.assignee || 'Unassigned'}
                  </Badge>
                  <Badge variant="outline" className="border-purple-200 text-purple-600 bg-purple-50">
                    {task.type || 'No type'}
                  </Badge>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
