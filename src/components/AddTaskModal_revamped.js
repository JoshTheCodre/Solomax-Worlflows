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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import useMediaStore from '@/store/mediaStore';
import { TASK_TYPES, TASK_PRIORITY } from '@/lib/utils';
import { 
  Calendar, 
  Clock, 
  UploadCloud, 
  FileText, 
  Briefcase, 
  User2, 
  CheckCircle2, 
  File, 
  FileImage, 
  FileVideo, 
  Music, 
  Archive, 
  X, 
  Plus, 
  Minus, 
  Layers,
  Users,
  Target,
  Hash,
  Loader2
} from 'lucide-react';

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
    channel: '',
    deadline: new Date().toISOString().slice(0, 10),
    isTaskGroup: false
  });

  const [subtasks, setSubtasks] = useState([{ title: '', type: '', priority: '' }]);

  // Helper functions for subtask management
  const addSubtask = () => {
    setSubtasks([...subtasks, { title: '', type: '', priority: '' }]);
  };

  const removeSubtask = (index) => {
    if (subtasks.length > 1) {
      setSubtasks(subtasks.filter((_, i) => i !== index));
    }
  };

  const updateSubtask = (index, field, value) => {
    const updated = subtasks.map((subtask, i) => 
      i === index ? { ...subtask, [field]: value } : subtask
    );
    setSubtasks(updated);
  };

  // Helper function to get file type icon
  const getFileIcon = (file) => {
    const fileType = file.type?.toLowerCase() || '';
    const fileName = file.original_filename?.toLowerCase() || '';
    
    if (fileName.endsWith('.psd') || fileName.endsWith('.ai') || fileName.endsWith('.indd')) {
      return <div className="w-4 h-4 bg-purple-500 rounded text-white text-xs flex items-center justify-center font-bold">A</div>;
    }
    if (fileType.startsWith('audio/') || fileName.endsWith('.mp3') || fileName.endsWith('.wav')) {
      return <Music className="w-4 h-4 text-green-500" />;
    }
    if (fileType.startsWith('video/') || fileName.endsWith('.mp4') || fileName.endsWith('.mov')) {
      return <FileVideo className="w-4 h-4 text-blue-500" />;
    }
    if (fileType.startsWith('image/')) {
      return <FileImage className="w-4 h-4 text-purple-500" />;
    }
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      return <div className="w-4 h-4 bg-red-500 rounded text-white text-xs flex items-center justify-center font-bold">P</div>;
    }
    if (fileType.startsWith('text/') || fileName.endsWith('.txt')) {
      return <FileText className="w-4 h-4 text-gray-500" />;
    }
    if (fileName.endsWith('.zip') || fileName.endsWith('.rar')) {
      return <Archive className="w-4 h-4 text-yellow-500" />;
    }
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
      if (formData.isTaskGroup && subtasks.length >= 1) {
        // Create task group - create multiple tasks with the same taskGroup identifier
        const taskGroupName = formData.title;
        const baseTaskData = {
          channel: formData.channel,
          attachments,
          status: 'active',
          createdAt: new Date(),
          taskGroup: taskGroupName,
          assignee: formData.assignee, // Single assignee for all subtasks
          deadline: new Date(formData.deadline), // Same deadline for all subtasks
          description: formData.description // Same description for all subtasks
        };

        // Create each subtask with individual type and priority
        for (const subtask of subtasks) {
          if (subtask.title.trim()) {
            await onSubmit({
              ...baseTaskData,
              title: subtask.title,
              type: subtask.type || formData.type,
              priority: subtask.priority || formData.priority,
            });
          }
        }
      } else {
        // Create single task
        await onSubmit({
          ...formData,
          deadline: new Date(formData.deadline),
          attachments,
          status: 'active',
          createdAt: new Date(),
        });
      }
      
      setOpen(false);
      setFormData({
        title: '',
        description: '',
        type: '',
        priority: '',
        assignee: '',
        channel: '',
        deadline: new Date().toISOString().slice(0, 10),
        isTaskGroup: false
      });
      setSubtasks([{ title: '', type: '', priority: '' }]);
      setAttachments([]);
    } catch (error) {
      console.error('Error creating task(s):', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white gap-2 shadow-lg hover:shadow-xl font-semibold px-6 py-2.5 rounded-lg border-0 transition-all duration-300">
            <Plus className="w-4 h-4" />
            Create Task
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[95vh] bg-white border-0 shadow-2xl rounded-xl p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4">
          <DialogTitle className="text-xl font-bold flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              {formData.isTaskGroup ? <Layers className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            </div>
            {formData.isTaskGroup ? 'Create Task Group' : 'Create New Task'}
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable Content */}
        <ScrollArea className="max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            
            {/* Task Type Selection */}
            <Card className="p-4 bg-gray-50/50 border border-gray-200">
              <div className="flex items-center justify-center space-x-8">
                <label className="flex items-center space-x-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="taskType"
                    checked={!formData.isTaskGroup}
                    onChange={() => setFormData({ ...formData, isTaskGroup: false })}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-gray-700 group-hover:text-blue-600 transition-colors">Single Task</span>
                  </div>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="taskType"
                    checked={formData.isTaskGroup}
                    onChange={() => setFormData({ ...formData, isTaskGroup: true })}
                    className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                  />
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-600" />
                    <span className="font-medium text-gray-700 group-hover:text-indigo-600 transition-colors">Task Group</span>
                  </div>
                </label>
              </div>
            </Card>

            {/* Main Task Information */}
            <Card className="p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-800">
                  {formData.isTaskGroup ? 'Group Information' : 'Task Information'}
                </h3>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Title */}
                <div className="lg:col-span-2">
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    {formData.isTaskGroup ? 'Group Name' : 'Task Title'} *
                  </label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="h-11 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    placeholder={formData.isTaskGroup ? "Enter task group name" : "Enter task title"}
                    required
                  />
                </div>

                {/* Assignee - Single for group tasks */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users className="w-4 h-4 inline mr-1" />
                    {formData.isTaskGroup ? 'Assigned Team Member' : 'Assignee'} *
                  </label>
                  <Select
                    value={formData.assignee}
                    onValueChange={(value) => setFormData({ ...formData, assignee: value })}
                    required
                  >
                    <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500">
                      <SelectValue placeholder="Select assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.email} value={user.email}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <div className="bg-blue-600 h-full w-full flex items-center justify-center text-white text-xs font-medium">
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

                {/* Channel */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Hash className="w-4 h-4 inline mr-1" />
                    Channel *
                  </label>
                  <Select
                    value={formData.channel}
                    onValueChange={(value) => setFormData({ ...formData, channel: value })}
                    required
                  >
                    <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500">
                      <SelectValue placeholder="Select channel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="animation-fastfood">Animation Fastfood</SelectItem>
                      <SelectItem value="epictoons">EpicToons</SelectItem>
                      <SelectItem value="alpha-recap">Alpha Recap</SelectItem>
                      <SelectItem value="super-recap">Super Recap</SelectItem>
                      <SelectItem value="beta-recap">Beta Recap</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Deadline */}
                <div>
                  <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    {formData.isTaskGroup ? 'Group Deadline' : 'Due Date'} *
                  </label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="h-11 border-gray-300 focus:border-blue-500"
                    required
                  />
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    {formData.isTaskGroup ? 'Default Priority' : 'Priority'} *
                  </label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                    required
                  >
                    <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(TASK_PRIORITY).map((priority) => (
                        <SelectItem key={priority} value={priority}>
                          <Badge className={`${priority === 'High' ? 'bg-red-100 text-red-700' : priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                            {priority}
                          </Badge>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Type - Only for single tasks */}
                {!formData.isTaskGroup && (
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Briefcase className="w-4 h-4 inline mr-1" />
                      Task Type *
                    </label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                      required
                    >
                      <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500">
                        <SelectValue placeholder="Select task type" />
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
                )}

                {/* Description */}
                <div className="lg:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    <FileText className="w-4 h-4 inline mr-1" />
                    {formData.isTaskGroup ? 'Group Description' : 'Description'} *
                  </label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="min-h-[100px] border-gray-300 focus:border-blue-500"
                    placeholder={formData.isTaskGroup ? "Describe the overall goal and context for all subtasks" : "Describe the task requirements and objectives"}
                    required
                  />
                </div>
              </div>
            </Card>

            {/* Subtasks Section - Only show if task group is enabled */}
            {formData.isTaskGroup && (
              <Card className="p-0 border border-indigo-200 shadow-sm bg-indigo-50/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-lg font-semibold text-gray-800">
                      Subtasks ({subtasks.filter(s => s.title.trim()).length})
                    </h3>
                  </div>
                  <Button
                    type="button"
                    onClick={addSubtask}
                    variant="outline"
                    size="sm"
                    className="border-indigo-300 text-indigo-600 hover:bg-indigo-50"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Subtask
                  </Button>
                </div>
                
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {subtasks.map((subtask, index) => (
                    <Card key={index} className="p-1 bg-white border border-gray-200 shadow-sm">
                      <div className="flex items-start gap-4">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="md:col-span-1">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Subtask Title *
                            </label>
                            <Input
                              value={subtask.title}
                              onChange={(e) => updateSubtask(index, 'title', e.target.value)}
                              placeholder="Enter subtask title"
                              className="h-9 text-sm border-gray-300 focus:border-indigo-500"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Type
                            </label>
                            <Select
                              value={subtask.type}
                              onValueChange={(value) => updateSubtask(index, 'type', value)}
                            >
                              <SelectTrigger className="h-9 text-sm border-gray-300 focus:border-indigo-500">
                                <SelectValue placeholder="Select type" />
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
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Priority
                            </label>
                            <Select
                              value={subtask.priority}
                              onValueChange={(value) => updateSubtask(index, 'priority', value)}
                            >
                              <SelectTrigger className="h-9 text-sm border-gray-300 focus:border-indigo-500">
                                <SelectValue placeholder={`(${formData.priority || 'Medium'})`} />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.values(TASK_PRIORITY).map((priority) => (
                                  <SelectItem key={priority} value={priority}>
                                    <Badge className={`text-xs ${priority === 'High' ? 'bg-red-100 text-red-700' : priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                                      {priority}
                                    </Badge>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        {subtasks.length > 1 && (
                          <Button
                            type="button"
                            onClick={() => removeSubtask(index)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            )}

            {/* Attachments Section */}
            <Card className="p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <UploadCloud className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-800">Attachments</h3>
              </div>
              
              <div className="space-y-4">
                <Input
                  type="file"
                  multiple
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length === 0) return;

                    const uploads = await uploadFiles(files, { name: 'Current User', uid: 'current-user' });
                    
                    const newAttachments = files.map((file) => ({
                      original_filename: file.name,
                      size: file.size,
                      type: file.type
                    }));
                    
                    setAttachments((prev) => [...prev, ...newAttachments]);
                    e.target.value = '';
                  }}
                  accept="*/*"
                  className="h-11 border-gray-300 focus:border-blue-500 cursor-pointer"
                />
                {attachments.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-3">Attached Files:</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {attachments.map((file, index) => (
                        <div key={index} className="relative flex flex-col items-center p-3 bg-gray-50 rounded-lg border border-gray-200 group hover:bg-gray-100 transition-colors">
                          {getFileIcon(file)}
                          <span className="text-xs text-gray-700 text-center truncate w-full mt-2 font-medium">{file.original_filename}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setAttachments((prev) => prev.filter((_, i) => i !== index))
                            }
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-xs hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </form>
        </ScrollArea>

        {/* Footer */}
        <div className="flex justify-end items-center gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                {formData.isTaskGroup ? <Layers className="w-4 h-4 mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                {formData.isTaskGroup ? `Create Task Group (${subtasks.filter(s => s.title.trim()).length} tasks)` : 'Create Task'}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});
