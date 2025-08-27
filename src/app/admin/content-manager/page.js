'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectI  return (
    <div className="p-6 min-h-screen bg-gray-50 antialiased" onClick={closeContextMenu} style={{ fontSmooth: 'always', WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale' }}>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      
      {/* Context Menu */}SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar, Archive, LinkIcon, Undo2, FolderOpen, Video, FileText, Image } from 'lucide-react';
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
  const [animatingCard, setAnimatingCard] = useState(null);
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, item: null });
  const router = useRouter();

  const channels = [
    { id: 'epic-toons', name: 'EpicToons', color: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white', borderColor: 'border-l-purple-500' },
    { id: 'alpha-recap', name: 'Alpha Recap', color: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white', borderColor: 'border-l-blue-500' },
    { id: 'animation-ff', name: 'Animation FF', color: 'bg-gradient-to-r from-green-500 to-green-600 text-white', borderColor: 'border-l-green-500' },
    { id: 'super-recap', name: 'Super Recap', color: 'bg-gradient-to-r from-red-500 to-red-600 text-white', borderColor: 'border-l-red-500' },
    { id: 'beta-recap', name: 'Beta Recap', color: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white', borderColor: 'border-l-amber-500' }
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

    // Enhanced portal swallowing animation
    setAnimatingCard(draggedItem.id);
    
    // Portal effect on button
    const buttonElement = e.currentTarget;
    buttonElement.classList.add('scale-150', 'ring-8', 'ring-purple-500', 'ring-opacity-75', 'shadow-2xl', 'shadow-purple-500/50');
    buttonElement.classList.remove('scale-125', 'ring-4', 'ring-purple-400', 'ring-opacity-75');
    
    // Swallowing animation sequence
    setTimeout(() => {
      buttonElement.classList.remove('scale-150', 'ring-8', 'ring-purple-500', 'ring-opacity-75');
      buttonElement.classList.add('scale-90');
    }, 200);
    
    setTimeout(() => {
      setAnimatingCard(null);
      buttonElement.classList.remove('scale-90', 'shadow-2xl', 'shadow-purple-500/50');
    }, 600);

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

  // Undo posted content function
  async function undoPostedContent(item) {
    try {
      setIsSubmitting(true);
      
      // Update Firebase to restore content
      await updateDoc(doc(db, 'tasks', item.id), {
        videoPosted: false,
        assignedChannel: item.originalChannel || null,
        postedAt: null
      });

      // Update UI
      updateUIAfterRestore(item);
      toast.success('Content restored successfully');
      
    } catch (error) {
      console.error('Error undoing posted content:', error);
      toast.error('Failed to restore content');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Context menu handlers
  function handleRightClick(e, item) {
    e.preventDefault();
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      item: item
    });
  }

  function closeContextMenu() {
    setContextMenu({ show: false, x: 0, y: 0, item: null });
  }

  async function moveToPostedFromContext(item) {
    const videoUrl = prompt('Enter video URL for this content:');
    if (!videoUrl) return;

    try {
      setIsSubmitting(true);
      
      await updateDoc(doc(db, 'tasks', item.id), {
        videoUrl: videoUrl,
        videoPosted: true,
        postedAt: new Date(),
        originalChannel: item.assignedChannel
      });

      toast.success('Content moved to posted');
      fetchContent();
      
    } catch (error) {
      console.error('Error moving to posted:', error);
      toast.error('Failed to move content');
    } finally {
      setIsSubmitting(false);
      closeContextMenu();
    }
  }

  // Format date helper - Updated to MM/DD/YY format
  function formatDate(timestamp) {
    if (!timestamp) return 'No date';
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      year: '2-digit' 
    });
  }

  // Render content card component
  function ContentCard({ item, isDraggable = true, channelBorderColor = 'border-l-gray-300' }) {
    const isAnimating = animatingCard === item.id;
    
    return (
      <Card
        key={item.id}
        className={`mb-1 cursor-grab hover:shadow-lg transition-all duration-300 bg-white border-0 shadow-sm border-l-2 ${channelBorderColor} relative h-12 ${
          isAnimating ? 'animate-pulse scale-50 opacity-20 transform translate-x-8 translate-y-4 rotate-12' : ''
        }`}
        draggable={isDraggable}
        onDragStart={(e) => handleDragStart(e, item)}
        onClick={() => openDetailDialog(item)}
        onContextMenu={(e) => handleRightClick(e, item)}
      >
        {isDraggable && (
          <div className="absolute top-0.5 right-0.5 w-1 h-1 bg-gray-500 rounded-full"></div>
        )}
        
        <div className="flex items-center justify-between h-full px-2 py-1">
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-gray-900 truncate leading-tight antialiased" title={item.title}>
              {item.title}
            </h4>
            <div className="flex items-center gap-1 mt-0.5">
              <Calendar className="w-2 h-2 text-gray-400 flex-shrink-0" />
              <span className="text-xs font-medium text-gray-600 antialiased">
                {formatDate(item.completedAt || item.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" onClick={closeContextMenu}>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      
      {/* Context Menu */}
      {contextMenu.show && (
        <div 
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
            onClick={() => moveToPostedFromContext(contextMenu.item)}
          >
            <Archive className="w-4 h-4" />
            Move to Posted Content
          </button>
        </div>
      )}
      
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
            className={`group relative overflow-hidden flex items-center gap-2 bg-gradient-to-r from-slate-800 via-slate-900 to-black hover:from-slate-900 hover:via-black hover:to-slate-800 text-white shadow-2xl hover:shadow-3xl transition-all duration-500 px-4 py-2 font-bold text-sm border border-slate-600 rounded-lg transform hover:scale-110 backdrop-blur-sm ${
              draggedItem ? 'scale-125 ring-4 ring-purple-400 ring-opacity-60 shadow-purple-500/50' : ''
            }`}
            onDragOver={(e) => {
              handleDragOver(e);
              e.currentTarget.classList.add('scale-125', 'ring-4', 'ring-purple-400', 'ring-opacity-75');
            }}
            onDragLeave={(e) => {
              e.currentTarget.classList.remove('scale-125', 'ring-4', 'ring-purple-400', 'ring-opacity-75');
            }}
            onDrop={handleDropToPosted}
          >
            {/* Animated background overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <Archive className="w-4 h-4 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
            <span className="relative z-10 font-semibold">Posted</span>
            <div className="bg-white/20 px-1.5 py-0.5 rounded-full text-xs font-bold relative z-10 backdrop-blur-sm">
              {postedContent.length}
            </div>
            
            {/* Portal effect ring */}
            <div className="absolute inset-0 rounded-lg border-2 border-purple-400/0 group-hover:border-purple-400/50 transition-all duration-300"></div>
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
          <div className="p-3 border-b border-gray-100 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-t-lg">
            <h3 className="font-semibold whitespace-nowrap">Available Content</h3>
            <p className="text-xs opacity-80 mt-1">{availableContent.length} items</p>
          </div>
          <div className="flex-1 p-2 overflow-y-auto">
            {availableContent.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FolderOpen className="w-8 h-8 text-gray-300 mb-2" />
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
                  <Video className="w-8 h-8 text-gray-300 mb-2" />
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
        <DialogContent className="sm:max-w-5xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Archive className="w-6 h-6 text-blue-600" />
              Posted Content ({postedContent.length})
            </DialogTitle>
          </DialogHeader>
          
          <div className="overflow-y-auto max-h-[65vh] bg-gray-50 rounded-lg p-4">
            {postedContent.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Archive className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-medium text-gray-700">No Posted Content</h3>
                <p className="text-gray-500 text-sm mt-2">
                  Content that has been posted will appear here
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {postedContent.map((content) => (
                  <Card key={content.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-200 bg-white">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-sm font-semibold text-gray-900">{content.title}</CardTitle>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Posted
                          </Badge>
                        </div>
                      </div>
                      {content.description && (
                        <CardDescription className="text-xs line-clamp-2 text-gray-600">
                          {content.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="pt-0 pb-3">
                      <div className="text-xs text-gray-500 space-y-2">
                        {content.originalChannel && (
                          <div className="flex items-center gap-2">
                            <Video className="w-3 h-3 text-purple-500" />
                            <span className="font-medium">Channel:</span>
                            <span className="text-purple-600">
                              {channels.find(ch => ch.id === content.originalChannel)?.name || content.originalChannel}
                            </span>
                          </div>
                        )}
                        {content.videoUrl && (
                          <div className="flex items-center gap-2">
                            <LinkIcon className="w-3 h-3 text-blue-500" />
                            <a 
                              href={content.videoUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline truncate flex-1"
                            >
                              {content.videoUrl.length > 40 ? content.videoUrl.substring(0, 40) + '...' : content.videoUrl}
                            </a>
                          </div>
                        )}
                        {content.postedAt && (
                          <div className="flex items-center gap-2 text-gray-400">
                            <Calendar className="w-3 h-3" />
                            <span>Posted: {formatDate(content.postedAt)}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Undo Button */}
                      <div className="mt-3 pt-2 border-t border-gray-100">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => undoPostedContent(content)}
                          disabled={isSubmitting}
                          className="w-full flex items-center gap-2 text-orange-600 border-orange-200 hover:bg-orange-50 hover:border-orange-300"
                        >
                          <Undo2 className="w-3 h-3" />
                          {isSubmitting ? 'Restoring...' : 'Undo Posted'}
                        </Button>
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
