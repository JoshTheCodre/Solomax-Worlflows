'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
// MediaLibrary import removed
import { TransferTaskModal } from './TransferTaskModal';
import { EditTaskModal } from './EditTaskModal';
import { getStatusColor, getPriorityColor } from '@/lib/utils';
import { 
  Calendar, 
  Clock, 
  User2, 
  Paperclip, 
  MessageSquare,
  CheckCircle2,
  XCircle,
  FileText,
  Video,
  FileImage,
  SendHorizontal,
  Plus,
  X,
  PenSquare,
  ArrowUpRightFromCircle,
  Trash2
} from 'lucide-react';

export function TaskDetailPanel({ task, isOpen, onClose, onUpdateTask, onDeleteTask, isAdmin }) {
  const [attachments, setAttachments] = useState([]);
  const [comment, setComment] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [editedTask, setEditedTask] = useState(null);

  const handleApprove = () => {
    onUpdateTask({
      ...task,
      status: 'completed',
      approvalComment: comment
    });
    onClose();
  };

  const handleReject = () => {
    onUpdateTask({
      ...task,
      status: 'rejected',
      approvalComment: comment
    });
    onClose();
  };

  const handleSubmitForApproval = () => {
    onUpdateTask({
      ...task,
      status: 'pending_approval',
      attachments: [...(task.attachments || []), ...attachments]
    });
    setAttachments([]);
  };

  // Removed handleAttachmentSelect as we no longer use MediaLibrary

  const getStatusEmoji = (status) => {
    switch (status) {
      case 'active':
        return '🔥';
      case 'completed':
        return '✨';
      case 'pending_approval':
        return '⏳';
      case 'rejected':
        return '❌';
      default:
        return '📋';
    }
  };

  const getFileIcon = (fileType) => {
    const renderIcon = (bgColor, textColor, IconComponent) => (
      <div className={`flex items-center justify-center w-5 h-5 rounded-sm ${bgColor}`}>
        <IconComponent className={`w-3 h-3 ${textColor}`} />
      </div>
    );
    
    // Video formats
    if (fileType?.includes('video')) {
      return renderIcon('bg-blue-100', 'text-blue-700', Video);
    }
    
    // Image formats
    if (fileType?.includes('image')) {
      return renderIcon('bg-green-100', 'text-green-700', FileImage);
    }
    
    // Audio formats
    if (fileType?.includes('audio')) {
      return renderIcon('bg-purple-100', 'text-purple-700', 
        (props) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
          <path d="M8 2v20M16 6v12"></path>
        </svg>
      );
    }
    
    // PDF files
    if (fileType?.includes('pdf')) {
      return renderIcon('bg-red-100', 'text-red-700', FileText);
    }
    
    // Word documents
    if (fileType?.includes('word') || fileType?.includes('doc') || fileType?.includes('msword')) {
      return renderIcon('bg-blue-100', 'text-blue-800', 
        (props) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
          <path d="M4 4v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8.342a2 2 0 0 0-.602-1.43l-4.44-4.342A2 2 0 0 0 13.56 2H6a2 2 0 0 0-2 2z"></path>
          <path d="M9 13h6"></path>
          <path d="M9 17h3"></path>
          <path d="M14 2v4a2 2 0 0 0 2 2h4"></path>
        </svg>
      );
    }
    
    // Excel files
    if (fileType?.includes('excel') || fileType?.includes('spreadsheet') || fileType?.includes('xls')) {
      return renderIcon('bg-green-100', 'text-green-800', 
        (props) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <path d="M14 2v4a2 2 0 0 0 2 2h4"></path>
          <path d="M8 13h2"></path>
          <path d="M8 17h2"></path>
          <path d="M14 13h2"></path>
          <path d="M14 17h2"></path>
        </svg>
      );
    }
    
    // Adobe/Photoshop files
    if (fileType?.includes('photoshop') || fileType?.includes('illustrator') || fileType?.includes('indesign') || 
        fileType?.includes('psd') || fileType?.includes('ai') || fileType?.includes('adobe')) {
      return renderIcon('bg-indigo-100', 'text-indigo-700', 
        (props) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
          <path d="M5 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5z"></path>
          <path d="M8 10v6"></path>
          <path d="M8 10h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2H8"></path>
          <path d="M16 15v-3a2 2 0 0 0-2-2h-1"></path>
        </svg>
      );
    }
    
    // Text files
    if (fileType?.includes('text') || fileType?.includes('txt')) {
      return renderIcon('bg-gray-100', 'text-gray-700',
        (props) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <path d="M14 2v4a2 2 0 0 0 2 2h4"></path>
          <path d="M8 13h8"></path>
          <path d="M8 17h8"></path>
          <path d="M8 9h1"></path>
        </svg>
      );
    }
    
    // ZIP/Archive files
    if (fileType?.includes('zip') || fileType?.includes('rar') || fileType?.includes('7z') || 
        fileType?.includes('tar') || fileType?.includes('gz') || fileType?.includes('archive')) {
      return renderIcon('bg-yellow-100', 'text-yellow-700',
        (props) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
          <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"></path>
          <path d="M3 9V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4"></path>
          <path d="M12 13h.01"></path>
        </svg>
      );
    }
    
    // Default - generic file
    return renderIcon('bg-gray-100', 'text-gray-700', FileText);
  };

  if (!task) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[600px] sm:w-[540px] h-full flex flex-col p-0">
        {/* Header */}
        <SheetHeader className="p-6 border-b bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <SheetTitle className="text-2xl font-bold flex items-center gap-2">
                <span>{getStatusEmoji(task.status)}</span>
                {task.title}
              </SheetTitle>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className={getStatusColor(task.status)}>
                {task.status}
              </Badge>
              <Badge variant="outline" className={getPriorityColor(task.priority)}>
                {task.priority}
              </Badge>
              <Badge variant="outline" className="bg-gray-50">
                {task.type}
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <User2 className="w-4 h-4" />
                {task.assignee}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {format(task.deadline.toDate(), 'MMM d')}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {format(task.deadline.toDate(), 'h:mm a')}
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-500">Description</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 whitespace-pre-wrap">{task.description}</p>
            </div>
          </div>

          {task.attachments?.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <Paperclip className="w-4 h-4" />
                Attachments
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {task.attachments.map((file, index) => (
                  <div 
                    key={index} 
                    className="inline-flex items-center justify-between gap-1 bg-gray-100 text-gray-800 rounded-md py-1 pl-2 pr-1 text-sm hover:bg-gray-200 transition-colors group"
                  >
                    <div className="flex items-center gap-1 truncate overflow-hidden" onClick={() => {
                      // You can add a file preview functionality here in the future
                      console.log('File clicked:', file);
                    }}>
                      {getFileIcon(file.type)}
                      <span className="truncate max-w-[120px]">{file.original_filename}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Remove attachment
                        onUpdateTask({
                          ...task,
                          attachments: task.attachments.filter((_, i) => i !== index)
                        });
                      }}
                      className="h-5 w-5 p-0 rounded-md hover:bg-red-100 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {task.approvalComment && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Feedback
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700">{task.approvalComment}</p>
              </div>
            </div>
          )}

          {/* Rejected Task Resubmission Notice */}
          {task.status === 'rejected' && !isAdmin && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-amber-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-amber-800 mb-1">Task Requires Revision</h4>
                  <p className="text-sm text-amber-700">
                    Your task has been reviewed and requires changes. Please review the feedback above, 
                    make necessary updates, add any additional files if needed, and resubmit for review.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-6 bg-gray-50 space-y-4">
          {isAdmin ? (
            // Admin Actions
            <div className="space-y-4">
              {task.status === 'pending_approval' && (
                <div className="space-y-4">
                  <Textarea
                    placeholder="Add your feedback..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full bg-white"
                  />
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={handleReject}
                      className="gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </Button>
                    <Button 
                      onClick={handleApprove}
                      className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve
                    </Button>
                  </div>
                </div>
              )}
              
              {/* File upload for admin */}
              {(task.status === 'active' || task.status === 'in_progress') && (
                <div className="mb-4">
                  <div className="relative group">
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('admin-file-upload').click()}
                      className="w-full py-6 border bg-gradient-to-b from-white to-gray-50 hover:from-gray-50 hover:to-gray-100 transition-all shadow-sm group-hover:shadow"
                    >
                      <div className="flex items-center justify-center gap-3">
                        <div className="flex items-center justify-center h-8 w-8 bg-blue-100 rounded-md text-blue-700">
                          <Paperclip className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col items-start">
                          <span className="text-gray-800 font-medium text-sm">Upload Files</span>
                          <span className="text-xs text-gray-500">Add documents, images or videos</span>
                        </div>
                      </div>
                    </Button>
                    <div className="absolute inset-0 border-2 border-dashed border-transparent group-hover:border-blue-300 rounded-md pointer-events-none"></div>
                  </div>
                  <Input 
                    id="admin-file-upload"
                    type="file" 
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setAttachments(prev => [
                        ...prev,
                        ...files.map(file => ({
                          original_filename: file.name,
                          type: file.type,
                          size: file.size
                        }))
                      ]);
                    }}
                    className="hidden"
                    multiple
                  />
                  
                  {/* File tags for admin */}
                  {attachments.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <h4 className="text-sm font-medium text-gray-500">Selected Files</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {attachments.map((file, index) => (
                          <div 
                            key={index} 
                            className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 rounded-md py-1 pl-2 pr-1 text-sm hover:bg-gray-200 transition-colors"
                          >
                            {getFileIcon(file.type)}
                            <span className="truncate max-w-[150px]">{file.original_filename}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setAttachments(prev => prev.filter((_, i) => i !== index));
                              }}
                              className="h-5 w-5 p-0 rounded-md hover:bg-gray-300 text-gray-500"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Admin action button for attachments */}
                  {attachments.length > 0 && (
                    <Button
                      className="w-full mt-3"
                      onClick={() => {
                        onUpdateTask({
                          ...task,
                          attachments: [...(task.attachments || []), ...attachments]
                        });
                        setAttachments([]);
                      }}
                    >
                      <Paperclip className="w-4 h-4 mr-2" />
                      Attach Files to Task
                    </Button>
                  )}
                </div>
              )}
              
              <div className="grid grid-cols-3 gap-2">
                <EditTaskModal
                  task={task}
                  onSubmit={(updatedTask) => {
                    onUpdateTask(updatedTask);
                  }}
                  trigger={
                    <Button
                      variant="outline"
                      className="gap-2 w-full bg-white hover:bg-gray-50"
                    >
                      <PenSquare className="w-4 h-4" />
                      Edit
                    </Button>
                  }
                />
                <Button
                  variant="outline"
                  className="gap-2 w-full bg-white hover:bg-gray-50"
                  onClick={() => onTransferTask(task)}
                >
                  <ArrowUpRightFromCircle className="w-4 h-4" />
                  Transfer
                </Button>
                <Button
                  className="gap-2 w-full bg-red-600 hover:bg-red-700 text-white border-0"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this task?')) {
                      onDeleteTask(task.id);
                      onClose();
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </div>
            </div>
          ) : (
            // User Actions - Allow actions for active, in_progress and rejected tasks
            (task.status === 'active' || task.status === 'in_progress' || task.status === 'rejected') && (
              <div className="space-y-4">
                {/* Start Work button for active tasks */}
                {task.status === 'active' && (
                  <div className="flex justify-center mb-4">
                    <Button
                      onClick={() => onUpdateTask({...task, status: 'in_progress', startedAt: new Date()})}
                      className="gap-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg w-full py-6 rounded-xl relative overflow-hidden transition-all duration-500 group border-0"
                    >
                      <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
                      <div className="absolute -left-12 top-0 w-24 h-full bg-white opacity-20 transform -skew-x-30 transition-transform duration-700 ease-in-out group-hover:translate-x-60"></div>
                      
                      <div className="flex items-center gap-3">
                        <div className="relative flex items-center justify-center h-8 w-8 bg-white bg-opacity-30 rounded-lg">
                          <Clock className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex flex-col items-start">
                          <span className="font-medium text-sm">Start Working</span>
                          <span className="text-xs text-white text-opacity-80">Mark task as in progress</span>
                        </div>
                      </div>
                    </Button>
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  <div className="relative group">
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('file-upload').click()}
                      className="w-full py-6 border bg-gradient-to-b from-white to-gray-50 hover:from-gray-50 hover:to-gray-100 transition-all shadow-sm group-hover:shadow"
                    >
                      <div className="flex items-center justify-center gap-3">
                        <div className="flex items-center justify-center h-8 w-8 bg-blue-100 rounded-md text-blue-700">
                          <Paperclip className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col items-start">
                          <span className="text-gray-800 font-medium text-sm">Upload Files</span>
                          <span className="text-xs text-gray-500">Add documents, images or videos</span>
                        </div>
                      </div>
                    </Button>
                    <div className="absolute inset-0 border-2 border-dashed border-transparent group-hover:border-blue-300 rounded-md pointer-events-none"></div>
                  </div>
                  <Input 
                    id="file-upload"
                    type="file" 
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setAttachments(prev => [
                        ...prev,
                        ...files.map(file => ({
                          original_filename: file.name,
                          type: file.type,
                          size: file.size
                        }))
                      ]);
                    }}
                    className="hidden"
                    multiple
                  />
                </div>
                {/* File tags */}
                {attachments.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-500">Selected Files</h4>
                    <div className="flex flex-wrap gap-2">
                      {attachments.map((file, index) => (
                        <div 
                          key={index} 
                          className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 rounded-full py-1 pl-3 pr-1 text-sm hover:bg-gray-200 transition-colors group"
                        >
                          {getFileIcon(file.type)}
                          <span className="truncate max-w-[150px]">{file.original_filename}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setAttachments(prev => prev.filter((_, i) => i !== index));
                            }}
                            className="h-5 w-5 p-0 rounded-full hover:bg-gray-300 text-gray-500"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex justify-center">
                  {(task.status === 'in_progress' || task.status === 'rejected') && (
                    <Button
                      onClick={handleSubmitForApproval}
                      className="gap-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-md hover:shadow-lg w-full py-6 rounded-xl relative overflow-hidden transition-all duration-500 group border-0"
                    >
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
                    <div className="absolute -left-12 top-0 w-24 h-full bg-white opacity-20 transform -skew-x-30 transition-transform duration-700 ease-in-out group-hover:translate-x-60"></div>
                    
                    <div className="flex items-center gap-3">
                      <div className="relative flex items-center justify-center h-8 w-8 bg-white bg-opacity-30 rounded-lg">
                        <svg className="w-5 h-5 text-white absolute transform group-hover:-translate-y-1 group-hover:-translate-x-1 transition-all duration-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="0">
                          <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                        </svg>
                        <div className="absolute inset-0 bg-white bg-opacity-20 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300"></div>
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="font-medium text-sm">
                          {task.status === 'rejected' ? 'Resubmit for Review' : 'Submit for Review'}
                        </span>
                        <span className="text-xs text-white text-opacity-80">
                          {task.status === 'rejected' ? 'Send revised task for approval' : 'Send task for approval'}
                        </span>
                      </div>
                    </div>
                  </Button>
                  )}
                </div>
              </div>
            )
          )}

          {/* Transfer Task Modal */}
          <TransferTaskModal
            open={showTransferModal}
            onClose={() => setShowTransferModal(false)}
            onTransfer={(transferData) => {
              onUpdateTask({
                ...task,
                assignee: transferData.newAssignee,
                transferNote: transferData.transferNote,
                transferredAt: transferData.transferredAt,
                previousAssignee: transferData.previousAssignee
              });
            }}
            task={task}
            currentAssignee={task.assignee}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
