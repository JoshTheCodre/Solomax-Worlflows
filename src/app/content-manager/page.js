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
import { Calendar, Archive, LinkIcon, Undo2, FolderOpen, Video, FileText, Image } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import useAuthStore from '@/lib/store';

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
  const [animatingCard, setAnimatingCard] = useState(null);
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, item: null });
  const router = useRouter();
  const { user } = useAuthStore();

  const channels = [
    { id: 'epic-toons', name: 'EpicToons', color: 'bg-purple-500 text-white', borderColor: 'border-l-purple-500' },
    { id: 'alpha-recap', name: 'Alpha Recap', color: 'bg-blue-500 text-white', borderColor: 'border-l-blue-500' },
    { id: 'animation-ff', name: 'Animation FF', color: 'bg-green-500 text-white', borderColor: 'border-l-green-500' },
    { id: 'super-recap', name: 'Super Recap', color: 'bg-red-500 text-white', borderColor: 'border-l-red-500' },
    { id: 'beta-recap', name: 'Beta Recap', color: 'bg-amber-500 text-white', borderColor: 'border-l-amber-500' }
  ];

  useEffect(() => {
    if (user) {
      fetchContent();
    }
  }, [user]);

  async function fetchContent() {
    try {
      if (!user) return;
      
      // Get all completed tasks for the current user and filter client-side
      const completedTasksQuery = query(
        collection(db, 'tasks'),
        where('assignee', '==', user.uid),
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

    // Instant UI update for lightning-fast UX
    const updatedItem = { ...draggedItem, assignedChannel: targetChannel };
    
    // Update UI immediately
    updateUIAfterMove(draggedItem, targetChannel);
    setDraggedItem(null);

    // Async Firebase update
    try {
      await updateDoc(doc(db, 'tasks', draggedItem.id), {
        assignedChannel: targetChannel
      });
      
      toast.success(`Content moved to ${channels.find(ch => ch.id === targetChannel)?.name || 'Available'}`);
    } catch (error) {
      console.error('Error moving content:', error);
      toast.error('Failed to move content. Reverting...');
      // Revert UI on error
      fetchContent();
    }
  }

  async function handleDropToPosted(e) {
    e.preventDefault();
    
    if (!draggedItem) return;

    // Check if item is being restored from Posted back to a channel
    if (draggedItem.videoPosted) {
      // Instant UI update for restore operation
      const updatedItem = { ...draggedItem, videoPosted: false, assignedChannel: draggedItem.originalChannel || null };
      updateUIAfterRestore(draggedItem);
      setDraggedItem(null);

      // Async Firebase update
      try {
        await updateDoc(doc(db, 'tasks', draggedItem.id), {
          videoPosted: false,
          assignedChannel: draggedItem.originalChannel || null,
          postedAt: null,
          videoUrl: draggedItem.videoUrl || null
        });
        
        toast.success('Content restored from posted');
      } catch (error) {
        console.error('Error restoring content:', error);
        toast.error('Failed to restore content. Reverting...');
        fetchContent();
      }
      return;
    }

    // For new posting, show dialog
    setSelectedContent(draggedItem);
    setVideoUrl(draggedItem.videoUrl || '');
    setIsDetailOpen(true);
    setDraggedItem(null);
  }

  // UI update helpers
  function updateUIAfterMove(item, targetChannel) {
    // Remove from current location
    if (item.assignedChannel) {
      setChannelContent(prev => ({
        ...prev,
        [item.assignedChannel]: prev[item.assignedChannel].filter(c => c.id !== item.id)
      }));
    } else {
      setAvailableContent(prev => prev.filter(c => c.id !== item.id));
    }

    // Add to new location
    const updatedItem = { ...item, assignedChannel: targetChannel };
    if (targetChannel) {
      setChannelContent(prev => ({
        ...prev,
        [targetChannel]: [updatedItem, ...prev[targetChannel]]
      }));
    } else {
      setAvailableContent(prev => [updatedItem, ...prev]);
    }
  }

  function updateUIAfterRestore(item) {
    // Remove from posted
    setPostedContent(prev => prev.filter(c => c.id !== item.id));
    
    // Add back to original location
    const restoredItem = { ...item, videoPosted: false, assignedChannel: item.originalChannel || null };
    if (item.originalChannel) {
      setChannelContent(prev => ({
        ...prev,
        [item.originalChannel]: [restoredItem, ...prev[item.originalChannel]]
      }));
    } else {
      setAvailableContent(prev => [restoredItem, ...prev]);
    }
  }

  async function handleMoveToChannel(content, newChannelId) {
    if (!content) return;
    
    try {
      // Update the content's channel assignment in Firebase
      const updatedData = newChannelId === 'available' 
        ? { assignedChannel: null } 
        : { assignedChannel: newChannelId };
      
      await updateDoc(doc(db, 'tasks', content.id), updatedData);
      
      // Update local state
      setSelectedContent(prev => ({ ...prev, assignedChannel: newChannelId === 'available' ? null : newChannelId }));
      
      // Refresh content to update the UI
      fetchContent();
      
      const channelName = newChannelId === 'available' 
        ? 'Available Content' 
        : channels.find(ch => ch.id === newChannelId)?.name || newChannelId;
      
      toast.success(`Content moved to ${channelName}`);
    } catch (error) {
      console.error('Error moving content:', error);
      toast.error('Failed to move content. Please try again.');
    }
  }

  async function handleSubmit() {
    if (!videoUrl) {
      toast.error('Please enter a video URL');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Store original channel for potential restore
      const originalChannel = selectedContent.assignedChannel;
      
      // Update the task with video URL and mark as posted
      await updateDoc(doc(db, 'tasks', selectedContent.id), {
        videoUrl: videoUrl,
        videoPosted: true,
        postedAt: new Date(),
        originalChannel: originalChannel // Store for restore functionality
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

  // Format date helper
  function formatDate(timestamp) {
    if (!timestamp) return 'No date';
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // Render content card component
  function ContentCard({ item, isDraggable = true, channelBorderColor = 'border-l-gray-300' }) {
    return (
      <Card
        key={item.id}
        className={`mb-2 cursor-grab hover:shadow-md transition-all duration-200 bg-white border-0 shadow-sm border-l-4 ${channelBorderColor} relative`}
        draggable={isDraggable}
        onDragStart={(e) => handleDragStart(e, item)}
        onClick={() => openDetailDialog(item)}
      >
        {isDraggable && (
          <div className="absolute top-2 right-2 w-2 h-2 bg-gray-400 rounded-full"></div>
        )}
        
        <CardHeader className="pb-1 pt-3">
          <CardTitle className="text-sm font-semibold truncate pr-4" title={item.title}>
            {item.title}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="pt-0 pb-3">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(item.completedAt || item.createdAt)}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Manager</h1>
          <p className="text-gray-600 mt-1">Manage content across all channels</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="default"
            onClick={openPostedDialog}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-2.5 font-semibold"
            onDragOver={handleDragOver}
            onDrop={handleDropToPosted}
          >
            <Archive className="w-5 h-5" />
            Posted Content ({postedContent.length})
          </Button>
        </div>
      </div>

      {/* 6-Column Layout */}
      <div className="grid grid-cols-6 gap-2 h-[calc(100vh-200px)]">
        
        {/* Available Content Column */}
        <div 
          className="bg-white rounded-lg border border-gray-200 flex flex-col"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, null)}
        >
          <div className="p-3 border-b border-gray-100 bg-gray-600 text-white rounded-t-lg">
            <h3 className="font-semibold whitespace-nowrap">Available Content</h3>
            <p className="text-xs opacity-80 mt-1">{availableContent.length} items</p>
          </div>
          <div className="flex-1 p-2 overflow-y-auto">
            {availableContent.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-8 h-8 bg-gray-200 rounded mb-2"></div>
                <p className="text-sm text-gray-500">No available content</p>
              </div>
            ) : (
              availableContent.map((item) => (
                <ContentCard 
                  key={item.id} 
                  item={item} 
                  channelBorderColor="border-l-gray-400"
                />
              ))
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
            <div className={`p-3 border-b border-gray-100 rounded-t-lg ${channel.color}`}>
              <h3 className="font-semibold whitespace-nowrap">{channel.name}</h3>
              <p className="text-xs opacity-80 mt-1">{channelContent[channel.id].length} items</p>
            </div>
            <div className="flex-1 p-2 overflow-y-auto">
              {channelContent[channel.id].length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-8 h-8 bg-gray-200 rounded mb-2"></div>
                  <p className="text-sm text-gray-500">Drop content here</p>
                </div>
              ) : (
                channelContent[channel.id].map((item) => (
                  <ContentCard 
                    key={item.id} 
                    item={item} 
                    channelBorderColor={channel.borderColor}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Video Details Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Content Details</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="title" className="text-sm font-medium text-gray-500">
                Content Title
              </Label>
              <div className="text-base font-medium mt-1">{selectedContent?.title}</div>
            </div>

            <div>
              <Label htmlFor="moveToChannel" className="text-sm font-medium text-gray-500">
                Move to Channel
              </Label>
              <Select 
                value={selectedContent?.assignedChannel || 'available'} 
                onValueChange={(value) => handleMoveToChannel(selectedContent, value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select channel..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available Content</SelectItem>
                  {channels.map(channel => (
                    <SelectItem key={channel.id} value={channel.id}>
                      {channel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
