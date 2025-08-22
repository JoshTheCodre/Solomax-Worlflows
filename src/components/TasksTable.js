'use client';

import { useState } from 'react';
import { format } from 'date-fns';
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
  Search, 
  CircleDot, 
  CheckCircle2, 
  User, 
  Calendar, 
  Clock,
  Trash2,
  ArrowUpRightFromCircle,
  PenSquare
} from 'lucide-react';

import { TASK_STATUS, TASK_TYPES, TASK_PRIORITY, getStatusColor, getPriorityColor, getFormattedStatus } from '@/lib/utils';

export function TasksTable({ data, onRowClick, onDeleteTask, onTransferTask, onUpdateTask, isAdmin = false }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedTaskForTransfer, setSelectedTaskForTransfer] = useState(null);
  const itemsPerPage = 10;

  // Ensure data is an array
  const safeData = Array.isArray(data) ? data : [];

  // Calculate pagination
  const totalPages = Math.ceil(safeData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = safeData.slice(startIndex, startIndex + itemsPerPage);

  const handleTaskUpdate = async (updatedTask) => {
    if (typeof onUpdateTask === 'function') {
      try {
        await onUpdateTask(updatedTask);
      } catch (error) {
        console.error('Error updating task:', error);
      }
    } else {
      console.error('onUpdateTask is not a function');
    }
  };

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

    const isCompleted = task.status === TASK_STATUS.COMPLETED;
    const statusColor = getStatusColor(isDue ? 'due' : (task.status || 'active'));
    
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-gray-900">{task.title}</span>
            <Badge className={`${getStatusColor(isDue ? 'due' : task.status)} text-xs px-2 py-0.5 ml-1.5 shadow-sm`}>
              <div className="flex items-center gap-1">
                {task.status === TASK_STATUS.COMPLETED ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : isDue ? (
                  <Clock className="w-3 h-3" />
                ) : (
                  <CircleDot className="w-3 h-3" />
                )}
                <span>{getFormattedStatus(task.status, isDue)}</span>
              </div>
            </Badge>
          </div>
        </div>
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

  const renderActions = (task) => (
    <div className="flex items-center gap-2">
      <EditTaskModal
        task={task}
        onSubmit={handleTaskUpdate}
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
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="bg-gray-50/80 pl-5 font-medium text-gray-600 text-xs uppercase tracking-wider py-6 min-w-[400px] px-6">
                    Summary
                  </TableHead>
                  <TableHead className="bg-gray-50/80 font-medium text-gray-600 text-xs uppercase tracking-wider py-6 min-w-[120px] px-6">
                    Type
                  </TableHead>
                  <TableHead className="bg-gray-50/80 font-medium text-gray-600 text-xs uppercase tracking-wider py-6 min-w-[120px] px-6">
                    Priority
                  </TableHead>
                  <TableHead className="bg-gray-50/80 font-medium text-gray-600 text-xs uppercase tracking-wider py-6 min-w-[120px] px-6">
                    Status
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
                  paginatedData.map((task) => (
                    <TableRow
                      key={task.id}
                      onClick={() => onRowClick(task)}
                      className="cursor-pointer transition-all hover:bg-gray-50/80 group"
                    >
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
                      <TableCell className="min-w-[120px] px-6 py-6">
                        <div className="flex items-center gap-1.5">
                          {task.status === TASK_STATUS.COMPLETED ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (task.deadline && new Date(task.deadline.toDate()) < new Date() && task.status !== TASK_STATUS.COMPLETED) ? (
                            <Clock className="w-4 h-4 text-orange-500" />
                          ) : (
                            <CircleDot className="w-4 h-4" />
                          )}
                          <Badge className={`${
                            task.deadline && new Date(task.deadline.toDate()) < new Date() && task.status !== TASK_STATUS.COMPLETED 
                              ? getStatusColor('due') 
                              : getStatusColor(task.status)
                          } text-xs`}>
                            {task.deadline && new Date(task.deadline.toDate()) < new Date() && task.status !== TASK_STATUS.COMPLETED 
                              ? 'Due' 
                              : getFormattedStatus(task.status)}
                          </Badge>
                        </div>
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
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={isAdmin ? 7 : 6}
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

      {totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2 mt-4">
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

      {/* Transfer Task Modal */}
      {selectedTaskForTransfer && (
        <TransferTaskModal
          open={showTransferModal}
          onClose={() => {
            setShowTransferModal(false);
            setSelectedTaskForTransfer(null);
          }}
          onTransfer={(transferData) => {
            onTransferTask(selectedTaskForTransfer);
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
