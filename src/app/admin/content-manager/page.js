'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { FolderOpen, Video, Link as LinkIcon, Check, AlertCircle, GripVertical, Archive } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function ContentManagerPage() {
  const [availableContent, setAvailableContent] = useState([]);
  const [channelContent, setChannelContent] = useState({
    'epic-toons': [],
    'alpha-recap': [],
    'animation-ff': [],
    'super-recap': [],
    'beta-recap': []
  });
  const [postedContent, setPostedContent] = useState([]);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isPostedDialogOpen, setIsPostedDialogOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const router = useRouter();

  const channels = [
    { id: 'epic-toons', name: 'EpicToons', color: 'bg-purple-50 border-purple-200 text-purple-700' },
    { id: 'alpha-recap', name: 'Alpha Recap', color: 'bg-blue-50 border-blue-200 text-blue-700' },
    { id: 'animation-ff', name: 'Animation FF', color: 'bg-green-50 border-green-200 text-green-700' },
    { id: 'super-recap', name: 'Super Recap', color: 'bg-red-50 border-red-200 text-red-700' },
    { id: 'beta-recap', name: 'Beta Recap', color: 'bg-amber-50 border-amber-200 text-amber-700' }
  ];

  useEffect(() => {
    fetchContent();
  }, []);

  async function fetchContent() {
    try {
      // Get all completed tasks and filter client-side
      const completedTasksQuery = query(
        collection(db, 'tasks'),
        where('status', '==', 'completed')
      );
      
      const completedSnapshot = await getDocs(completedTasksQuery);
      const allCompletedTasks = completedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Separate content by channel assignment
      const available = [];
      const channelGroups = {
        'epic-toons': [],
        'alpha-recap': [],
        'animation-ff': [],
        'super-recap': [],
        'beta-recap': []
      };
      const posted = [];

      allCompletedTasks.forEach(task => {
        if (task.videoPosted === true) {
          posted.push(task);
        } else if (task.assignedChannel && channelGroups[task.assignedChannel] !== undefined) {
          channelGroups[task.assignedChannel].push(task);
        } else {
          available.push(task);
        }
      });

      // Sort all arrays by completedAt desc
      const sortByDate = (a, b) => {
        const dateA = a.completedAt ? new Date(a.completedAt.seconds * 1000) : new Date(0);
        const dateB = b.completedAt ? new Date(b.completedAt.seconds * 1000) : new Date(0);
        return dateB - dateA;
      };

      setAvailableContent(available.sort(sortByDate));
      setChannelContent({
        'epic-toons': channelGroups['epic-toons'].sort(sortByDate),
        'alpha-recap': channelGroups['alpha-recap'].sort(sortByDate),
        'animation-ff': channelGroups['animation-ff'].sort(sortByDate),
        'super-recap': channelGroups['super-recap'].sort(sortByDate),
        'beta-recap': channelGroups['beta-recap'].sort(sortByDate)
      });
      setPostedContent(posted.sort(sortByDate));
    } catch (error) {
      console.error('Error fetching content:', error);
      toast.error('Failed to load content. Please try again.');
    }
  }

  function openDetailDialog(content) {
    setSelectedContent(content);
    setVideoUrl(content.videoUrl || '');
    setIsDetailOpen(true);
  }

  function openPostedDialog() {
    setIsPostedDialogOpen(true);
  }

  // Drag and drop functions
  function handleDragStart(e, item) {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  async function handleDrop(e, targetChannel) {
    e.preventDefault();
    
    if (!draggedItem) return;

    try {
      // Update the task's assigned channel
      await updateDoc(doc(db, 'tasks', draggedItem.id), {
        assignedChannel: targetChannel
      });

      toast.success(`Content moved to ${channels.find(ch => ch.id === targetChannel)?.name || 'Available'}`);
      
      // Refresh content
      fetchContent();
      setDraggedItem(null);
    } catch (error) {
      console.error('Error moving content:', error);
      toast.error('Failed to move content. Please try again.');
    }
  }

  async function handleDropToPosted(e) {
    e.preventDefault();
    
    if (!draggedItem) return;

    setSelectedContent(draggedItem);
    setVideoUrl(draggedItem.videoUrl || '');
    setIsDetailOpen(true);
    setDraggedItem(null);
  }

  async function handleSubmit() {
    if (!videoUrl) {
      toast.error('Please enter a video URL');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Update the task with video URL and mark as posted
      await updateDoc(doc(db, 'tasks', selectedContent.id), {
        videoUrl: videoUrl,
        videoPosted: true,
        postedAt: new Date(),
      });

      toast.success('Content has been marked as posted');

      setIsDetailOpen(false);
      
      // Refresh content lists
      fetchContent();
    } catch (error) {
      console.error('Error updating content:', error);
      toast.error('Failed to update content. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Render content card component
  function ContentCard({ item, isDraggable = true }) {
    return (
      <Card
        key={item.id}
        className="mb-3 cursor-grab hover:shadow-md transition-all duration-200 bg-white border-0 shadow-sm"
        draggable={isDraggable}
        onDragStart={(e) => handleDragStart(e, item)}
        onClick={() => openDetailDialog(item)}
      >
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {isDraggable && <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0" />}
              <CardTitle className="text-sm font-semibold truncate" title={item.title}>
                {item.title}
              </CardTitle>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 flex-shrink-0">
              {item.videoPosted ? 'Posted' : 'Ready'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <CardDescription className="text-xs line-clamp-2 mb-2">
            {item.description}
          </CardDescription>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Check className="w-3 h-3 text-green-500" />
            <span>Completed</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className=" min-h-screen bg-gray-50">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Manager</h1>
          <p className="text-gray-600 mt-1">Manage content across all channels</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={openPostedDialog}
            className="flex items-center gap-2"
            onDragOver={handleDragOver}
            onDrop={handleDropToPosted}
          >
            <Archive className="w-4 h-4" />
            Posted Content ({postedContent.length})
          </Button>
        </div>
      </div>

      {/* 6-Column Layout */}
      <div className="grid grid-cols-6 gap-4 h-[calc(100vh-200px)]">
        
        {/* Available Content Column */}
        <div 
          className="bg-white rounded-lg border border-gray-200 flex flex-col"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, null)}
        >
          <div className="p-4 border-b border-gray-100 bg-gray-50 rounded-t-lg">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-gray-600" />
              Available Content
            </h3>
            <p className="text-xs text-gray-500 mt-1">{availableContent.length} items</p>
          </div>
          <div className="flex-1 p-3 overflow-y-auto">
            {availableContent.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FolderOpen className="w-8 h-8 text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">No available content</p>
              </div>
            ) : (
              availableContent.map((item) => <ContentCard key={item.id} item={item} />)
            )}
          </div>
        </div>

        {/* Channel Columns */}
        {channels.map((channel) => (
          <div 
            key={channel.id}
            className="bg-white rounded-lg border border-gray-200 flex flex-col"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, channel.id)}
          >
            <div className={`p-4 border-b border-gray-100 rounded-t-lg ${channel.color}`}>
              <h3 className="font-semibold flex items-center gap-2">
                <Video className="w-4 h-4" />
                {channel.name}
              </h3>
              <p className="text-xs opacity-70 mt-1">{channelContent[channel.id].length} items</p>
            </div>
            <div className="flex-1 p-3 overflow-y-auto">
              {channelContent[channel.id].length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Video className="w-8 h-8 text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">Drop content here</p>
                </div>
              ) : (
                channelContent[channel.id].map((item) => <ContentCard key={item.id} item={item} />)
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Video Details Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Video Details</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="title" className="text-sm font-medium text-gray-500">
                Content Title
              </Label>
              <div className="text-base font-medium mt-1">{selectedContent?.title}</div>
            </div>

            <div>
              <Label htmlFor="videoUrl" className="text-sm font-medium text-gray-500">
                Video URL
              </Label>
              <Input
                id="videoUrl"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v="
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDetailOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="default" 
              onClick={handleSubmit} 
              disabled={isSubmitting || !videoUrl}
            >
              {isSubmitting ? 'Saving...' : 'Mark as Posted'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Posted Content Dialog */}
      <Dialog open={isPostedDialogOpen} onOpenChange={setIsPostedDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Archive className="w-5 h-5" />
              Posted Content ({postedContent.length})
            </DialogTitle>
          </DialogHeader>
          
          <div className="overflow-y-auto max-h-[60vh]">
            {postedContent.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10">
                <Archive className="w-12 h-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-700">No Posted Content</h3>
                <p className="text-gray-500 text-sm mt-1">
                  Content that has been posted will appear here
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {postedContent.map((content) => (
                  <Card key={content.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-sm font-semibold">{content.title}</CardTitle>
                        <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                          Posted
                        </Badge>
                      </div>
                      <CardDescription className="text-xs line-clamp-2">
                        {content.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-xs text-gray-500 space-y-1">
                        {content.assignedChannel && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Channel:</span>
                            <span>{channels.find(ch => ch.id === content.assignedChannel)?.name || content.assignedChannel}</span>
                          </div>
                        )}
                        {content.videoUrl && (
                          <div className="flex items-center gap-2">
                            <LinkIcon className="w-3 h-3 text-blue-500" />
                            <a 
                              href={content.videoUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline truncate"
                            >
                              {content.videoUrl}
                            </a>
                          </div>
                        )}
                        {content.postedAt && (
                          <div className="text-gray-400">
                            Posted: {new Date(content.postedAt.seconds * 1000).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPostedDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
