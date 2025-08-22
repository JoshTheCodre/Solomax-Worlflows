'use client';

import { useState, useRef } from 'react';
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
  X
} from 'lucide-react';

import { TASK_STATUS, TASK_TYPES, TASK_PRIORITY, getStatusColor, getPriorityColor } from '@/lib/utils';

export function TaskTable({ data, onRowClick, onDeleteTask, onTransferTask, onUpdateTask, onRequestReview, isAdmin = false }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedTaskForTransfer, setSelectedTaskForTransfer] = useState(null);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const topScrollRef = useRef(null);
  const contentScrollRef = useRef(null);
  const itemsPerPage = 10;

  // Ensure data is an array
  const safeData = Array.isArray(data) ? data : [];

  // Calculate pagination
  const totalPages = Math.ceil(safeData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = safeData.slice(startIndex, startIndex + itemsPerPage);

  const renderTaskSummary = (task) => {
    if (!task || !task.deadline) {
      return null;
    }

    let deadline;
    try {
      deadline = format(task.deadline.toDate(), 'MMM dd, yyyy');
    } catch (error) {
      deadline = 'No deadline';
    }

    const isCompleted = task.status === TASK_STATUS.COMPLETED;
    const statusColor = getStatusColor(task.status || 'active');
    
    return (
      <div className="flex flex-col gap-3">
        {/* Task Name and Status Row */}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <span className="text-sm font-semibold text-gray-900">{task.title}</span>
          </div>
          <Badge className={`${getStatusColor(task.status)} text-xs px-2 py-1 shadow-sm`}>
            <div className="flex items-center gap-1.5">
              {task.status === TASK_STATUS.COMPLETED ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                <CircleDot className="w-3 h-3" />
              )}
              <span>{task.status || 'Active'}</span>
            </div>
          </Badge>
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
      {task.status !== TASK_STATUS.COMPLETED && task.status !== 'pending_review' && onRequestReview && (
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
                  paginatedData.map((task, index) => (
                    <motion.tr
                      key={task.id}
                      onClick={() => onRowClick(task)}
                      className="cursor-pointer transition-all hover:bg-gray-50/80 group"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      layout
                    >
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
                  ))
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
        {selectedTasks.length > 0 && (
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
