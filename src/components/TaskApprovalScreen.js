'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Search, Calendar, User, Clock, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import useTaskStore from '@/store/taskStore';
import useAuthStore from '@/lib/store';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';

export function TaskApprovalScreen({ isOpen, onClose }) {
  const { 
    pendingReviews, 
    completeReview,
    getFilteredTasks,
    setFilterCriteria
  } = useTaskStore();
  
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedTask, setSelectedTask] = useState(null);
  const [feedback, setFeedback] = useState('');
  
  // Apply filtering
  useEffect(() => {
    let filtered = getFilteredTasks({
      view: 'review',
      search: searchQuery
    });
    
    // Filter by tab
    if (activeTab === "mine") {
      filtered = filtered.filter(task => 
        task.reviewRequestedBy === user?.email || 
        task.assignee === user?.email
      );
    }
    
    setFilteredTasks(filtered);
  }, [pendingReviews, searchQuery, activeTab, user, getFilteredTasks]);

  const handleApprove = async () => {
    if (!selectedTask) return;
    
    await completeReview(selectedTask.id, true, {
      reviewedBy: user?.email,
      feedback: feedback,
    });
    
    setSelectedTask(null);
    setFeedback('');
  };

  const handleReject = async () => {
    if (!selectedTask) return;
    
    await completeReview(selectedTask.id, false, {
      reviewedBy: user?.email,
      feedback: feedback,
    });
    
    setSelectedTask(null);
    setFeedback('');
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
    <Dialog open={isOpen} onOpenChange={onClose} size="xl">
      <DialogContent className="sm:max-w-[90vw] sm:max-h-[80vh] overflow-hidden p-0">
        <DialogHeader className="p-6 border-b">
          <div className="flex items-center">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-blue-500" />
              <DialogTitle>Tasks Pending Review</DialogTitle>
              <Badge variant="outline" className="ml-2">{filteredTasks.length}</Badge>
            </div>
          </div>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-6 max-h-[calc(80vh-120px)] overflow-y-auto">
          {/* Tasks List */}
          <Card className="w-full lg:col-span-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">Tasks List</CardTitle>
                </div>
              </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-3">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="all">All Tasks</TabsTrigger>
              <TabsTrigger value="mine">My Tasks</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="mt-3 relative">
            <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-gray-500" />
            <Input
              type="text"
              placeholder="Search pending reviews..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        
        <CardContent className="max-h-[600px] overflow-y-auto">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-6">
              <CheckCircle2 className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No tasks pending review</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <div 
                  key={task.id} 
                  className={cn(
                    "border rounded-md p-3 cursor-pointer transition-colors",
                    selectedTask?.id === task.id 
                      ? "border-blue-500 bg-blue-50" 
                      : "hover:bg-gray-50"
                  )}
                  onClick={() => setSelectedTask(task)}
                >
                  <div className="flex justify-between">
                    <div className="font-medium">{task.title}</div>
                    <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
                      Review
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {task.description || 'No description'}
                  </div>
                  
                  <div className="flex gap-2 mt-2 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{task.assignee || 'Unassigned'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatDate(task.reviewRequestedAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Details */}
      <Card className="w-full lg:col-span-2">
        <CardHeader>
          <CardTitle>
            {selectedTask ? selectedTask.title : 'Select a task to review'}
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {!selectedTask ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">Select a task from the list to review</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Task Info */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Description</h3>
                  <p className="mt-1">{selectedTask.description || 'No description provided'}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Assignee</h3>
                    <p className="mt-1">{selectedTask.assignee || 'Unassigned'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Review Requested By</h3>
                    <p className="mt-1">{selectedTask.reviewRequestedBy || 'Unknown'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Requested On</h3>
                    <p className="mt-1">{formatDate(selectedTask.reviewRequestedAt)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Priority</h3>
                    <p className="mt-1">
                      <Badge variant="outline" className={
                        selectedTask.priority === 'high' ? 'border-red-200 text-red-600 bg-red-50' : 
                        selectedTask.priority === 'medium' ? 'border-orange-200 text-orange-600 bg-orange-50' :
                        'border-green-200 text-green-600 bg-green-50'
                      }>
                        {selectedTask.priority || 'None'}
                      </Badge>
                    </p>
                  </div>
                </div>
                
                {selectedTask.reviewNotes && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Review Notes</h3>
                    <div className="mt-1 p-3 border rounded-md bg-gray-50">
                      {selectedTask.reviewNotes}
                    </div>
                  </div>
                )}
              </div>
              
              <Separator />
              
              {/* Review Form */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Your Feedback</h3>
                <Textarea 
                  placeholder="Enter your feedback about this task..."
                  className="min-h-[100px]"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />
                
                <div className="mt-4 flex gap-3 justify-end">
                  <Button 
                    variant="destructive"
                    onClick={handleReject}
                    className="flex items-center gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </Button>
                  <Button 
                    variant="default"
                    onClick={handleApprove}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Approve
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
