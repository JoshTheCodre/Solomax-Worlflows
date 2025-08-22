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
    filterCriteria,
    deleteAllTasksInBin
  } = useTaskStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // Apply search filtering
  useEffect(() => {
    const filtered = getFilteredTasks({
      view: 'bin',
      search: searchQuery
    });
    setFilteredTasks(filtered);
    // Reset selection when filtered tasks change
    setSelectedTasks([]);
    setSelectAll(false);
  }, [tasksInBin, searchQuery, getFilteredTasks]);
  
  // Toggle selection of a single task
  const toggleTaskSelection = (taskId) => {
    setSelectedTasks(prev => {
      if (prev.includes(taskId)) {
        return prev.filter(id => id !== taskId);
      } else {
        return [...prev, taskId];
      }
    });
  };
  
  // Toggle selection of all tasks
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(filteredTasks.map(task => task.id));
    }
    setSelectAll(!selectAll);
  };
  
  // Unselect all tasks
  const unselectAll = () => {
    setSelectedTasks([]);
    setSelectAll(false);
  };

  const handleRestore = async (taskId) => {
    await restoreTask(taskId);
  };

  const handleDeletePermanently = async (taskId) => {
    if (window.confirm('Are you sure you want to permanently delete this task? This action cannot be undone.')) {
      await deleteTask(taskId);
    }
  };
  
  const handleDeleteAll = async () => {
    if (window.confirm(`Are you sure you want to permanently delete all ${tasksInBin.length} tasks in the bin? This action cannot be undone.`)) {
      await deleteAllTasksInBin();
    }
  };
  
  // Delete selected tasks
  const handleDeleteSelected = async () => {
    if (selectedTasks.length === 0) return;
    
    if (window.confirm(`Are you sure you want to permanently delete ${selectedTasks.length} selected tasks? This action cannot be undone.`)) {
      const deletePromises = selectedTasks.map(taskId => deleteTask(taskId));
      await Promise.all(deletePromises);
      setSelectedTasks([]);
      setSelectAll(false);
    }
  };
  
  // Restore selected tasks
  const handleRestoreSelected = async () => {
    if (selectedTasks.length === 0) return;
    
    const restorePromises = selectedTasks.map(taskId => restoreTask(taskId));
    await Promise.all(restorePromises);
    setSelectedTasks([]);
    setSelectAll(false);
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
          <div className="flex items-center justify-between">
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
        
        {filteredTasks.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={selectAll}
                onChange={toggleSelectAll}
                id="select-all-checkbox"
              />
              <label htmlFor="select-all-checkbox" className="text-sm text-gray-600">
                Select All
              </label>
              {selectedTasks.length > 0 && (
                <span className="text-sm text-gray-600">
                  ({selectedTasks.length} selected)
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {selectedTasks.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={handleRestoreSelected}
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Restore Selected</span>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={handleDeleteSelected}
                  >
                    <AlertTriangle className="h-3 w-3" />
                    <span>Delete Selected</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
        
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
                className={`border rounded-md p-3 ${selectedTasks.includes(task.id) ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <input
                      type="checkbox"
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={selectedTasks.includes(task.id)}
                      onChange={() => toggleTaskSelection(task.id)}
                    />
                  </div>
                  <div className="flex-grow">
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
                  </div>
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
