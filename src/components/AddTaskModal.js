'use client';

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import useMediaStore from '@/store/mediaStore';
import { TASK_TYPES, TASK_PRIORITY } from '@/lib/utils';
import { Calendar, Clock, UploadCloud, FileText, Briefcase, User2, CheckCircle2, File, FileImage, FileVideo, Music, Archive, X } from 'lucide-react';

export const AddTaskModal = forwardRef(function AddTaskModal({ onSubmit, children, initialAttachments = [] }, ref) {
  const [open, setOpen] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const { uploadFiles } = useMediaStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    priority: '',
    assignee: '',
    deadline: new Date().toISOString().slice(0, 10), // YYYY-MM-DD format for date input
  });

  // Helper function to get file type icon
  const getFileIcon = (file) => {
    const fileType = file.type?.toLowerCase() || '';
    const fileName = file.original_filename?.toLowerCase() || '';
    
    // Adobe files
    if (fileName.endsWith('.psd') || fileName.endsWith('.ai') || fileName.endsWith('.indd')) {
      return <div className="w-4 h-4 bg-purple-500 rounded text-white text-xs flex items-center justify-center font-bold">A</div>;
    }
    // Audio files
    if (fileType.startsWith('audio/') || fileName.endsWith('.mp3') || fileName.endsWith('.wav')) {
      return <Music className="w-4 h-4 text-green-500" />;
    }
    // Video files
    if (fileType.startsWith('video/') || fileName.endsWith('.mp4') || fileName.endsWith('.mov')) {
      return <FileVideo className="w-4 h-4 text-blue-500" />;
    }
    // Image files
    if (fileType.startsWith('image/')) {
      return <FileImage className="w-4 h-4 text-purple-500" />;
    }
    // PDF files
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      return <div className="w-4 h-4 bg-red-500 rounded text-white text-xs flex items-center justify-center font-bold">P</div>;
    }
    // Text files
    if (fileType.startsWith('text/') || fileName.endsWith('.txt')) {
      return <FileText className="w-4 h-4 text-gray-500" />;
    }
    // Archive files
    if (fileName.endsWith('.zip') || fileName.endsWith('.rar')) {
      return <Archive className="w-4 h-4 text-yellow-500" />;
    }
    // Default
    return <File className="w-4 h-4 text-gray-400" />;
  };

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    openWithFiles: (files) => {
      const fileAttachments = files.map(file => ({
        original_filename: file.name,
        size: file.size,
        type: file.type,
      }));
      setAttachments(fileAttachments);
      setOpen(true);
    }
  }));

  // Handle initial attachments when modal opens
  useEffect(() => {
    if (open && initialAttachments.length > 0) {
      setAttachments(initialAttachments);
    }
  }, [open, initialAttachments]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const q = query(
          collection(db, 'users'),
          where('role', '==', 'user')
        );
        const querySnapshot = await getDocs(q);
        const userData = querySnapshot.docs.map(doc => ({
          email: doc.data().email,
          displayName: doc.data().displayName || doc.data().email
        }));
        setUsers(userData);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    if (open) {
      fetchUsers();
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        ...formData,
        deadline: new Date(formData.deadline),
        attachments,
        status: 'active',
        createdAt: new Date(),
      });
      setOpen(false);
      setFormData({
        title: '',
        description: '',
        type: '',
        priority: '',
        assignee: '',
        deadline: new Date().toISOString().slice(0, 10), // YYYY-MM-DD format for date input
      });
      setAttachments([]);
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="bg-gradient-to-r from-blue-900 to-blue-700 text-white gap-2 shadow-lg hover:shadow-blue-200 font-medium px-6 border border-blue-800 hover:from-blue-800 hover:to-blue-600 transition-all duration-300">
            <CheckCircle2 className="w-4 h-4" />
            Create Task
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-medium text-gray-900 pb-2 border-b border-gray-200">
            Create New Task
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Card className="p-6 border border-gray-200">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-medium flex items-center gap-2 text-gray-700">
                    <CheckCircle2 className="w-4 h-4" />
                    Task Title
                  </label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full transition-all duration-200 focus:ring-1 focus:ring-black border-gray-200 hover:border-gray-300"
                    placeholder="Enter task title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="deadline" className="text-sm font-medium flex items-center gap-2 text-gray-700">
                    <Calendar className="w-4 h-4" />
                    Due Date
                  </label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) =>
                      setFormData({ ...formData, deadline: e.target.value })
                    }
                    className="w-full transition-all duration-200 focus:ring-1 focus:ring-black border-gray-200 hover:border-gray-300"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2 text-gray-700">
                    <Clock className="w-4 h-4" />
                    Priority
                  </label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) =>
                      setFormData({ ...formData, priority: value })
                    }
                    required
                  >
                    <SelectTrigger className="w-full transition-all duration-200 focus:ring-1 focus:ring-black border-gray-200 hover:border-gray-300">
                      <SelectValue placeholder="Select Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(TASK_PRIORITY).map((priority) => (
                        <SelectItem key={priority} value={priority}>
                          {priority}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2 text-gray-700">
                    <Briefcase className="w-4 h-4" />
                    Type
                  </label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, type: value })
                    }
                    required
                  >
                    <SelectTrigger className="w-full transition-all duration-200 focus:ring-1 focus:ring-black border-gray-200 hover:border-gray-300">
                      <SelectValue placeholder="Select Task Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(TASK_TYPES).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2 text-gray-700">
                    <User2 className="w-4 h-4" />
                    Assignee
                  </label>
                  <Select
                    value={formData.assignee}
                    onValueChange={(value) =>
                      setFormData({ ...formData, assignee: value })
                    }
                    required
                  >
                    <SelectTrigger className="w-full transition-all duration-200 focus:ring-1 focus:ring-black border-gray-200 hover:border-gray-300">
                      <SelectValue placeholder="Select Assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.email} value={user.email}
                          className="flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-100"
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <div className="bg-gray-900 h-full w-full flex items-center justify-center text-white text-xs font-medium">
                                {user.displayName?.charAt(0) || user.email.charAt(0)}
                              </div>
                            </Avatar>
                            {user.displayName || user.email}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2 text-gray-700">
                    <UploadCloud className="w-4 h-4" />
                    Attachments
                  </label>
                  <div className="space-y-2">
                    <Input
                      type="file"
                      multiple
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length === 0) return;

                        // Upload files to media store and get their metadata
                        const uploads = await uploadFiles(files, { name: 'Current User', uid: 'current-user' });
                        
                        // Add to local attachments (these will be references to uploaded media)
                        const newAttachments = files.map((file) => ({
                          original_filename: file.name,
                          size: file.size,
                          type: file.type
                        }));
                        
                        setAttachments((prev) => [...prev, ...newAttachments]);
                        e.target.value = ''; // Reset input
                      }}
                      accept="*/*"
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-gray-500">
                      Files will be uploaded to your media library and attached to this task
                    </p>
                    {attachments.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 font-medium mb-2">Attached Files:</p>
                        <div className="grid grid-cols-3 gap-2">
                          {attachments.map((file, index) => (
                            <div key={index} className="relative flex flex-col items-center p-2 bg-gray-50 rounded-md group hover:bg-gray-100 transition-colors">
                              {getFileIcon(file)}
                              <span className="text-xs text-gray-700 text-center truncate w-full mt-1">{file.original_filename}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setAttachments((prev) => prev.filter((_, i) => i !== index))
                                }
                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-xs"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium flex items-center gap-2 text-gray-700">
                  <FileText className="w-4 h-4" />
                  Description
                </label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="h-32 resize-none transition-all duration-200 focus:ring-1 focus:ring-black border-gray-200 hover:border-gray-300"
                  placeholder="Enter task description"
                  required
                />
              </div>
            </div>
          </Card>

          <div className="flex justify-end space-x-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border border-gray-200 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="bg-gradient-to-r from-blue-900 to-blue-700 text-white font-medium gap-2 shadow-lg hover:shadow-blue-200 px-6 border border-blue-800 hover:from-blue-800 hover:to-blue-600 transition-all duration-300"
              disabled={loading}
            >
              {loading ? (
                <>Loading...</>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Create Task
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
});


