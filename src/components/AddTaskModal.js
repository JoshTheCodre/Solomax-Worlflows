'use client';

import { useState, useEffect } from 'react';
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
import { TASK_TYPES, TASK_PRIORITY } from '@/lib/utils';
import { Calendar, Clock, UploadCloud, FileText, Briefcase, User2, CheckCircle2 } from 'lucide-react';

export function AddTaskModal({ onSubmit, children }) {
  const [open, setOpen] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    priority: '',
    assignee: '',
    deadline: new Date().toISOString().slice(0, 16),
  });

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
        deadline: new Date().toISOString().slice(0, 16),
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
                    type="datetime-local"
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
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        setAttachments((prev) => [
                          ...prev,
                          ...files.map((file) => ({
                            original_filename: file.name,
                            size: file.size,
                            type: file.type,
                          })),
                        ]);
                      }}
                      className="w-full cursor-pointer file:bg-gray-100 file:text-gray-700 file:border-0 file:rounded file:px-4 file:py-2 file:mr-4 file:hover:bg-gray-200 file:cursor-pointer transition-all duration-200"
                      multiple
                    />
                    {attachments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {attachments.map((file, index) => (
                          <div key={index} className="text-sm flex items-center gap-2">
                            <span>{file.original_filename}</span>
                            <button
                              type="button"
                              onClick={() =>
                                setAttachments((prev) => prev.filter((_, i) => i !== index))
                              }
                              className="text-gray-500 hover:text-gray-700"
                            >
                              ×
                            </button>
                          </div>
                        ))}
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
}


