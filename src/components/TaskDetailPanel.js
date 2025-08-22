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
import { MediaLibrary } from './MediaLibrary';
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
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
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

  const handleAttachmentSelect = (media) => {
    setAttachments(prev => [...prev, media]);
    setShowMediaLibrary(false);
  };

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
    if (fileType?.includes('video')) return <Video className="w-4 h-4" />;
    if (fileType?.includes('image')) return <FileImage className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
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
                    className="bg-gray-50 p-3 rounded-lg flex items-center gap-2 hover:bg-gray-100 transition-colors"
                  >
                    {getFileIcon(file.type)}
                    <span className="truncate flex-1">{file.original_filename}</span>
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

          {showMediaLibrary && (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 p-4 flex justify-between items-center">
                <h3 className="font-medium">Media Library</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMediaLibrary(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="p-4">
                <MediaLibrary onSelect={handleAttachmentSelect} />
              </div>
            </div>
          )}

          {!showMediaLibrary && attachments.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-500">New Attachments</h3>
              <div className="grid grid-cols-2 gap-2">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 p-3 rounded-lg flex items-center justify-between group hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {getFileIcon(file.type)}
                      <span className="truncate">{file.filename}</span>
                    </div>
                    <button
                      onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                      className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
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
              
              <div className="flex flex-wrap gap-2">
                <EditTaskModal
                  task={task}
                  onSubmit={(updatedTask) => {
                    onUpdateTask(updatedTask);
                  }}
                  trigger={
                    <Button
                      variant="outline"
                      className="flex-1 gap-2 min-w-[120px]"
                    >
                      <PenSquare className="w-4 h-4" />
                      Edit Task
                    </Button>
                  }
                />
                <Button
                  variant="outline"
                  className="flex-1 gap-2 min-w-[120px]"
                  onClick={() => onTransferTask(task)}
                >
                  <ArrowUpRightFromCircle className="w-4 h-4" />
                  Transfer
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-2 min-w-[120px] hover:bg-red-50 hover:text-red-600 hover:border-red-200"
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
            // User Actions
            task.status === 'active' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Input 
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
                      className="w-full"
                      multiple
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowMediaLibrary(true)}
                    className="gap-2 whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    Media Library
                  </Button>
                </div>
                {/* File list */}
                {attachments.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-500">Selected Files</h4>
                    <div className="border rounded-lg divide-y">
                      {attachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{file.original_filename}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setAttachments(prev => prev.filter((_, i) => i !== index));
                            }}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={handleSubmitForApproval}
                    className="gap-2 border-gray-200 hover:bg-gray-50"
                  >
                    <SendHorizontal className="w-4 h-4" />
                    Submit for Review
                  </Button>
                  <Button
                    onClick={() => {
                      if (attachments.length === 0 && !window.confirm('Complete task without uploading files?')) {
                        return;
                      }
                      onUpdateTask({
                        ...task,
                        status: 'completed',
                        completedAt: new Date(),
                        attachments: [...(task.attachments || []), ...attachments]
                      });
                      onClose();
                    }}
                    className="gap-2 bg-black hover:bg-gray-900"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Complete Task
                  </Button>
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
