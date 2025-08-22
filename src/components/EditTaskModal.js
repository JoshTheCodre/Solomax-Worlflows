'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { format } from 'date-fns';
import { TASK_TYPES, TASK_PRIORITY, TEAM_MEMBERS } from '@/lib/utils';

const taskTypesArray = Object.values(TASK_TYPES);
const taskPriorityArray = Object.values(TASK_PRIORITY);

export function EditTaskModal({ task, onSubmit, trigger }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    type: task?.type || taskTypesArray[0],
    priority: task?.priority || taskPriorityArray[1],
    assignee: task?.assignee || '',
    deadline: task?.deadline?.toDate() || new Date(),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (typeof onSubmit === 'function') {
      await onSubmit({ ...formData, id: task.id });
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] p-0">
        <DialogHeader className="px-6 py-4 border-b bg-gray-50">
          <DialogTitle className="text-lg font-semibold tracking-tight">Edit Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title Input */}
          <div>
            <Label htmlFor="title" className="text-sm font-medium text-gray-700">
              Title
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
              className="mt-1.5 h-10 border-gray-200 bg-white focus:ring-2 focus:ring-gray-200"
              placeholder="Task title"
            />
          </div>

          {/* Type and Priority Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type" className="text-sm font-medium text-gray-700">
                Type
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger className="mt-1.5 h-10 border-gray-200 bg-white focus:ring-2 focus:ring-gray-200">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {taskTypesArray.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="priority" className="text-sm font-medium text-gray-700">
                Priority
              </Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger className="mt-1.5 h-10 border-gray-200 bg-white focus:ring-2 focus:ring-gray-200">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {taskPriorityArray.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {priority}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Assignee and Deadline Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="assignee" className="text-sm font-medium text-gray-700">
                Assignee
              </Label>
              <Select
                value={formData.assignee}
                onValueChange={(value) => setFormData(prev => ({ ...prev, assignee: value }))}
              >
                <SelectTrigger className="mt-1.5 h-10 border-gray-200 bg-white focus:ring-2 focus:ring-gray-200">
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  {TEAM_MEMBERS.map((member) => (
                    <SelectItem key={member} value={member}>
                      {member}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="deadline" className="text-sm font-medium text-gray-700">
                Deadline
              </Label>
              <Input
                id="deadline"
                type="datetime-local"
                value={format(formData.deadline, "yyyy-MM-dd'T'HH:mm")}
                onChange={(e) => setFormData(prev => ({ ...prev, deadline: new Date(e.target.value) }))}
                required
                className="mt-1.5 h-10 border-gray-200 bg-white focus:ring-2 focus:ring-gray-200"
              />
            </div>
          </div>

          {/* Description Input */}
          <div>
            <Label htmlFor="description" className="text-sm font-medium text-gray-700">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              required
              className="mt-1.5 h-24 resize-none border-gray-200 bg-white focus:ring-2 focus:ring-gray-200"
              placeholder="Task description"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 mt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="px-4 border-gray-200 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="px-4 bg-gray-900 hover:bg-gray-800"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
