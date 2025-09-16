'use client';

import React, { useState, useRef } from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EditTaskModal } from './EditTaskModal';
import { TransferTaskModal } from './TransferTaskModal';
import { 
  CircleDot, 
  CheckCircle2, 
  User, 
  Calendar, 
  Trash2,
  ArrowUpRightFromCircle,
  PenSquare,
  FileCheck,
  Search,
  Clock,
  X,
  ChevronDown,
  ChevronRight,
  Folder
} from 'lucide-react';

import { TASK_STATUS, TASK_TYPES, TASK_PRIORITY, getStatusColor, getPriorityColor, getFormattedStatus } from '@/lib/utils';

export function TaskTable({ data, onRowClick, onDeleteTask, onTransferTask, onUpdateTask, onRequestReview, isAdmin = false }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedTaskForTransfer, setSelectedTaskForTransfer] = useState(null);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const topScrollRef = useRef(null);
  const contentScrollRef = useRef(null);
  const itemsPerPage = 10;

  // Ensure data is an array
  const safeData = Array.isArray(data) ? data : [];
  
  // Group tasks by taskGroup field and separate single tasks
  const { taskGroups, singleTasks } = safeData.reduce((acc, task) => {
    if (task.taskGroup) {
      if (!acc.taskGroups[task.taskGroup]) {
        acc.taskGroups[task.taskGroup] = [];
      }
      acc.taskGroups[task.taskGroup].push(task);
    } else {
      acc.singleTasks.push(task);
    }
    return acc;
  }, { taskGroups: {}, singleTasks: [] });

  // Helper functions for task groups
  const toggleGroupExpansion = (groupName) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  const calculateGroupProgress = (tasks) => {
    const completedTasks = tasks.filter(task => task.status === TASK_STATUS.COMPLETED).length;
    return { completed: completedTasks, total: tasks.length };
  };

  const getGroupStatus = (tasks) => {
    const progress = calculateGroupProgress(tasks);
    if (progress.completed === 0) return 'active';
    if (progress.completed === progress.total) return 'completed';
    return 'in_progress';
  };

  // Convert taskGroups object to array and combine with single tasks for display
  const displayData = [
    ...Object.entries(taskGroups).map(([groupName, tasks]) => ({
      type: 'group',
      groupName,
      tasks: tasks.sort((a, b) => (a.createdAt?.toDate?.() || new Date(a.createdAt)) - (b.createdAt?.toDate?.() || new Date(b.createdAt))),
      isExpanded: expandedGroups.has(groupName)
    })),
    ...singleTasks.map(task => ({ type: 'single', task }))
  ].sort((a, b) => {
    // Sort by most recent creation date
    const dateA = a.type === 'group' 
      ? Math.max(...a.tasks.map(t => (t.createdAt?.toDate?.() || new Date(t.createdAt)).getTime()))
      : (a.task.createdAt?.toDate?.() || new Date(a.task.createdAt)).getTime();
    const dateB = b.type === 'group'
      ? Math.max(...b.tasks.map(t => (t.createdAt?.toDate?.() || new Date(t.createdAt)).getTime()))
      : (b.task.createdAt?.toDate?.() || new Date(b.task.createdAt)).getTime();
    return dateB - dateA;
  });
  
  // Debug data received by TaskTable
  console.log(`TaskTable received ${safeData.length} tasks, grouped into ${Object.keys(taskGroups).length} groups and ${singleTasks.length} single tasks`);
  if (displayData.length > 0) {
    console.log('First 3 items status values:', displayData.slice(0, 3).map(item => {
      if (item.type === 'group') {
        return { type: 'group', groupName: item.groupName, taskCount: item.tasks.length };
      } else {
        return { type: 'single', id: item.task.id, title: item.task.title, status: item.task.status };
      }
    }));
  }

  // Calculate pagination based on display data
  const totalPages = Math.ceil(displayData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = displayData.slice(startIndex, startIndex + itemsPerPage);

  const renderTaskSummary = (task) => {
    if (!task || !task.deadline) {
      return null;
    }

    let deadline;
    let isDue = false;
    try {
      const deadlineDate = task.deadline.toDate();
      deadline = format(deadlineDate, 'MMM dd, yyyy');
      
      // Check if task is due (past deadline and not completed)
      const now = new Date();
      isDue = deadlineDate < now && task.status !== TASK_STATUS.COMPLETED;
    } catch (error) {
      deadline = 'No deadline';
    }

    // Debug the actual status being processed
    console.log(`Rendering task ${task.id} (${task.title}) with status:`, {
      rawStatus: task.status,
      statusType: typeof task.status,
      isDue: isDue,
      isCompleted: task.status === TASK_STATUS.COMPLETED
    });

    // Normalize status for display - handle null/undefined as 'active'
    const normalizedStatus = task.status || 'active';
    
    // Determine which badges to show - prioritize "due" over other statuses
    const badges = [];
    
    if (isDue) {
      // If task is due, always show the due badge first
      badges.push({
        status: 'due',
        color: 'bg-red-100 text-red-700',
        icon: <Clock className="w-3 h-3" />,
        text: 'Due'
      });
      
      // Only show the original status if it's not 'active' to avoid redundancy
      if (normalizedStatus !== 'active' && normalizedStatus !== 'due') {
        badges.push({
          status: normalizedStatus,
          color: getStatusColor(normalizedStatus),
          icon: normalizedStatus === TASK_STATUS.COMPLETED ? <CheckCircle2 className="w-3 h-3" /> : <CircleDot className="w-3 h-3" />,
          text: getFormattedStatus(normalizedStatus, false)
        });
      }
    } else {
      // If not due, just show the main status
      badges.push({
        status: normalizedStatus,
        color: getStatusColor(normalizedStatus),
        icon: normalizedStatus === TASK_STATUS.COMPLETED ? <CheckCircle2 className="w-3 h-3" /> : <CircleDot className="w-3 h-3" />,
        text: getFormattedStatus(normalizedStatus, false)
      });
    }
    
    return (
      <div className="flex flex-col gap-3">
        {/* Task Name and Status Row */}
        <div className="flex items-center">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-gray-900">{task.title}</span>
            <div className="flex items-center gap-1 ml-1.5">
              {badges.map((badge, index) => (
                <Badge key={`${badge.status}-${index}`} className={`${badge.color} text-xs px-2 py-0.5 shadow-sm`}>
                  <div className="flex items-center gap-1">
                    {badge.icon}
                    <span>{badge.text}</span>
                  </div>
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Assignment and Due Date Row */}
        <div className="flex items-center text-sm gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <User className="w-3.5 h-3.5" />
            </div>
            <span className="text-gray-500">assigned to</span>
            <span className="font-semibold text-gray-900">{task.assignee}</span>
          </div>
          <span className="text-gray-300">|</span>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <span className="text-gray-500">Due</span>
            <span className="font-medium text-gray-900">{deadline}</span>
          </div>
        </div>
      </div>
    );
  };

  // Handle checkbox selection
  const toggleTaskSelection = (e, taskId) => {
    e.stopPropagation();
    if (selectedTasks.includes(taskId)) {
      setSelectedTasks(selectedTasks.filter(id => id !== taskId));
    } else {
      setSelectedTasks([...selectedTasks, taskId]);
    }
  };

  const toggleSelectAll = (e) => {
    e.stopPropagation();
    if (selectAll) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(paginatedData.map(task => task.id));
    }
    setSelectAll(!selectAll);
  };
  
  const unselectAll = (e) => {
    e?.stopPropagation();
    setSelectedTasks([]);
    setSelectAll(false);
  };

  const handleDeleteSelected = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedTasks.length} selected tasks?`)) {
      selectedTasks.forEach(taskId => {
        onDeleteTask(taskId);
      });
      setSelectedTasks([]);
      setSelectAll(false);
    }
  };
  
  // Scroll synchronization functions
  const handleTopScroll = (e) => {
    if (contentScrollRef.current) {
      contentScrollRef.current.scrollLeft = e.target.scrollLeft;
    }
  };
  
  const handleContentScroll = (e) => {
    if (topScrollRef.current) {
      topScrollRef.current.scrollLeft = e.target.scrollLeft;
    }
  };

  const renderActions = (task) => (
    <div className="flex items-center gap-2">
      <EditTaskModal
        task={task}
        onSubmit={(updatedTask) => {
                          onUpdateTask && onUpdateTask(updatedTask);
        }}
        trigger={
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-gray-600 hover:text-gray-900"
          >
            <PenSquare className="w-4 h-4" />
          </Button>
        }
      />
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.preventDefault();
          setSelectedTaskForTransfer(task);
          setShowTransferModal(true);
        }}
        className="h-8 px-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowUpRightFromCircle className="w-4 h-4" />
      </Button>
      {task.status !== TASK_STATUS.COMPLETED && task.status !== TASK_STATUS.PENDING_APPROVAL && onRequestReview && (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            onRequestReview(task);
          }}
          className="h-8 px-2 text-gray-600 hover:text-blue-600"
        >
          <FileCheck className="w-4 h-4" />
        </Button>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.preventDefault();
          if (window.confirm('Are you sure you want to delete this task?')) {
            onDeleteTask(task.id);
          }
        }}
        className="h-8 px-2 text-gray-600 hover:text-red-600"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        {/* Content area without vertical scrollbar */}
        <div 
          className="overflow-x-auto" 
          ref={contentScrollRef}
        >
          <div className="inline-block min-w-full align-middle">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  {isAdmin && (
                    <TableHead className="bg-gray-50/80 w-10 px-2">
                      <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={selectAll}
                          onChange={toggleSelectAll}
                        />
                      </div>
                    </TableHead>
                  )}
                  <TableHead className="bg-gray-50/80 pl-5 font-medium text-gray-600 text-xs uppercase tracking-wider py-6 min-w-[400px] px-6">
                    Summary
                  </TableHead>
                  <TableHead className="bg-gray-50/80 font-medium text-gray-600 text-xs uppercase tracking-wider py-6 min-w-[120px] px-6">
                    Type
                  </TableHead>
                  <TableHead className="bg-gray-50/80 font-medium text-gray-600 text-xs uppercase tracking-wider py-6 min-w-[120px] px-6">
                    Priority
                  </TableHead>
                  <TableHead className="bg-gray-50/80 font-medium text-gray-600 text-xs uppercase tracking-wider py-6 min-w-[150px] px-6">
                    Assignee
                  </TableHead>
                  <TableHead className="bg-gray-50/80 font-medium text-gray-600 text-xs uppercase tracking-wider py-6 min-w-[150px] px-6">
                    Deadline
                  </TableHead>
                  {isAdmin && (
                    <TableHead className="bg-gray-50/80 min-w-[100px] font-medium text-gray-600 text-xs uppercase tracking-wider py-4 text-right pr-6">
                      Actions
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((item, index) => {
                    if (item.type === 'group') {
                      const progress = calculateGroupProgress(item.tasks);
                      const groupStatus = getGroupStatus(item.tasks);
                      const isExpanded = item.isExpanded;
                      
                      return (
                        <React.Fragment key={`group-${item.groupName}`}>
                          {/* Group Header Row */}
                          <motion.tr
                            className="cursor-pointer transition-all hover:bg-blue-50/80 bg-blue-25/40 border-b-2 border-blue-100"
                            onClick={() => toggleGroupExpansion(item.groupName)}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05, duration: 0.3 }}
                            layout
                          >
                            {isAdmin && (
                              <TableCell className="w-10 px-2">
                                <div className="flex items-center justify-center">
                                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                                </div>
                              </TableCell>
                            )}
                            <TableCell className="min-w-[400px] px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  {isExpanded ? (
                                    <ChevronDown className="w-5 h-5 text-blue-600" />
                                  ) : (
                                    <ChevronRight className="w-5 h-5 text-blue-600" />
                                  )}
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                                      <Folder className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                      <h3 className="font-semibold text-gray-900">{item.groupName}</h3>
                                      <p className="text-sm text-gray-500">
                                        {progress.completed}/{progress.total} completed
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <div className="ml-auto flex items-center gap-2">
                                  <Badge className={`${getStatusColor(groupStatus)} text-xs px-2 py-1`}>
                                    <div className="flex items-center gap-1">
                                      {groupStatus === TASK_STATUS.COMPLETED ? (
                                        <CheckCircle2 className="w-3 h-3" />
                                      ) : (
                                        <CircleDot className="w-3 h-3" />
                                      )}
                                      <span>{getFormattedStatus(groupStatus, false)}</span>
                                    </div>
                                  </Badge>
                                  <div className="w-24 bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                      style={{ width: `${(progress.completed / progress.total) * 100}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="min-w-[120px] px-6 py-4">
                              <Badge variant="secondary" className="text-xs">
                                Group ({item.tasks.length} tasks)
                              </Badge>
                            </TableCell>
                            <TableCell className="min-w-[120px] px-6 py-4">
                              <Badge className="bg-blue-100 text-blue-700 text-xs">
                                Mixed
                              </Badge>
                            </TableCell>
                            <TableCell className="min-w-[150px] px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                  <User className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-sm text-gray-600">Multiple assignees</span>
                              </div>
                            </TableCell>
                            <TableCell className="min-w-[150px] px-6 py-4">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                  {item.tasks.length} deadlines
                                </span>
                              </div>
                            </TableCell>
                            {isAdmin && (
                              <TableCell className="min-w-[100px] text-right px-6 py-4">
                                <div className="text-sm text-gray-500">Group actions</div>
                              </TableCell>
                            )}
                          </motion.tr>
                          
                          {/* Expanded Group Tasks */}
                          {isExpanded && item.tasks.map((task, taskIndex) => (
                            <motion.tr
                              key={task.id}
                              onClick={() => onRowClick(task)}
                              className="cursor-pointer transition-all hover:bg-gray-50/80 group bg-blue-50/20 border-l-4 border-blue-200"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              layout
                            >
                              {isAdmin && (
                                <TableCell className="w-10 px-2">
                                  <div 
                                    className="flex items-center justify-center ml-4" 
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <input
                                      type="checkbox"
                                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                      checked={selectedTasks.includes(task.id)}
                                      onChange={(e) => toggleTaskSelection(e, task.id)}
                                    />
                                  </div>
                                </TableCell>
                              )}
                              <TableCell className="min-w-[400px] px-6 py-4">
                                <div className="ml-8 pl-4 border-l-2 border-blue-100">
                                  {renderTaskSummary(task)}
                                </div>
                              </TableCell>
                              <TableCell className="min-w-[120px] px-6 py-4">
                                <Badge variant="secondary" className="text-xs">
                                  {task.type || 'N/A'}
                                </Badge>
                              </TableCell>
                              <TableCell className="min-w-[120px] px-6 py-4">
                                <Badge className={`${getPriorityColor(task.priority)} text-xs`}>
                                  {task.priority || 'Medium'}
                                </Badge>
                              </TableCell>
                              <TableCell className="min-w-[150px] px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                    <User className="w-3.5 h-3.5" />
                                  </div>
                                  <span className="text-sm text-gray-600">{task.assignee}</span>
                                </div>
                              </TableCell>
                              <TableCell className="min-w-[150px] px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm text-gray-600">
                                    {task.deadline ? format(task.deadline.toDate(), 'MMM dd, yyyy') : 'No deadline'}
                                  </span>
                                </div>
                              </TableCell>
                              {isAdmin && (
                                <TableCell className="min-w-[100px] text-right px-6 py-4">
                                  <div onClick={(e) => e.stopPropagation()}>
                                    {renderActions(task)}
                                  </div>
                                </TableCell>
                              )}
                            </motion.tr>
                          ))}
                        </React.Fragment>
                      );
                    } else {
                      // Single task row
                      const task = item.task;
                      return (
                        <motion.tr
                          key={task.id}
                          onClick={() => onRowClick(task)}
                          className="cursor-pointer transition-all hover:bg-gray-50/80 group"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05, duration: 0.3 }}
                          layout
                        >
                          {isAdmin && (
                            <TableCell className="w-10 px-2">
                              <div 
                                className="flex items-center justify-center" 
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input
                                  type="checkbox"
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  checked={selectedTasks.includes(task.id)}
                                  onChange={(e) => toggleTaskSelection(e, task.id)}
                                />
                              </div>
                            </TableCell>
                          )}
                          <TableCell className="min-w-[400px] px-6 py-6">
                            {renderTaskSummary(task)}
                          </TableCell>
                          <TableCell className="min-w-[120px] px-6 py-6">
                            <Badge variant="secondary" className="text-xs">
                              {task.type || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell className="min-w-[120px] px-6 py-6">
                            <Badge className={`${getPriorityColor(task.priority)} text-xs`}>
                              {task.priority || 'Medium'}
                            </Badge>
                          </TableCell>
                          <TableCell className="min-w-[150px] px-6 py-6">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                <User className="w-3.5 h-3.5" />
                              </div>
                              <span className="text-sm text-gray-600">{task.assignee}</span>
                            </div>
                          </TableCell>
                          <TableCell className="min-w-[150px] px-6 py-6">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                {task.deadline ? format(task.deadline.toDate(), 'MMM dd, yyyy') : 'No deadline'}
                              </span>
                            </div>
                          </TableCell>
                          {isAdmin && (
                            <TableCell className="min-w-[100px] text-right px-6 py-4">
                              <div onClick={(e) => e.stopPropagation()}>
                                {renderActions(task)}
                              </div>
                            </TableCell>
                          )}
                        </motion.tr>
                      );
                    }
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={isAdmin ? 6 : 5}
                      className="h-32 text-center"
                    >
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <Search className="w-12 h-12 mb-2 text-gray-300" />
                        <span className="text-sm">No tasks found</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        {isAdmin && selectedTasks.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSelected}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Selected ({selectedTasks.length})
            </Button>
          </div>
        )}

        {totalPages > 1 && (
          <div className={`flex items-center space-x-2 ${selectedTasks.length > 0 ? 'ml-auto' : 'ml-auto'}`}>
            <span className="text-sm text-gray-500">
              Page {currentPage} of {totalPages} • {displayData.length} items ({Object.keys(taskGroups).length} groups, {singleTasks.length} individual tasks)
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Transfer Task Modal */}
      {selectedTaskForTransfer && (
        <TransferTaskModal
          open={showTransferModal}
          onClose={() => {
            setShowTransferModal(false);
            setSelectedTaskForTransfer(null);
          }}
          onTransfer={() => {
            onTransferTask && onTransferTask(selectedTaskForTransfer);
            setShowTransferModal(false);
            setSelectedTaskForTransfer(null);
          }}
          task={selectedTaskForTransfer}
          currentAssignee={selectedTaskForTransfer.assignee}
        />
      )}
    </div>
  );
}
