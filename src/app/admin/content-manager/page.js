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
    setIsSubmitting(true);
    
    try {
      // Store original channel for potential restore
      const originalChannel = selectedContent.assignedChannel;
      
      // Update the task and mark as posted
      await updateDoc(doc(db, 'tasks', selectedContent.id), {
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

  // Context menu handlers - simplified to direct action
  function handleRightClick(e, item) {
    e.preventDefault();
    moveToPostedFromContext(item);
  }

  async function moveToPostedFromContext(item) {
    const confirmed = confirm(`Mark "${item.title}" as posted?`);
    if (!confirmed) return;

    try {
      setIsSubmitting(true);
      
      await updateDoc(doc(db, 'tasks', item.id), {
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
        className={`mb-1 cursor-grab hover:shadow-xl transition-all duration-300 bg-white border-0 shadow-sm border-l-4 ${channelBorderColor} relative h-10 rounded-md ${
          isAnimating ? 'animate-pulse scale-50 opacity-20 transform translate-x-8 translate-y-4 rotate-12' : ''
        }`}
        draggable={isDraggable}
        onDragStart={(e) => handleDragStart(e, item)}
        onClick={() => openDetailDialog(item)}
        onContextMenu={(e) => handleRightClick(e, item)}
      >
        {isDraggable && (
          <div className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full animate-ping opacity-75"></div>
        )}
        {isDraggable && (
          <div className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full"></div>
        )}
        
        <div className="flex flex-col justify-start h-full px-2 py-0.5">
          <h4 className="text-xs font-bold text-gray-900 truncate leading-none antialiased tracking-tight mt-0.5" title={item.title}>
            {item.title}
          </h4>
          <div className="flex items-center gap-1.5 mt-1.5">
            <Calendar className="w-2.5 h-2.5 text-gray-600 flex-shrink-0" />
            <span className="text-xs font-semibold text-gray-700 antialiased tracking-wide">
              {formatDate(item.completedAt || item.createdAt)}
            </span>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-gray-50 antialiased" style={{ fontSmooth: 'always', WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale' }}>
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

      {/* Content Details Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-slate-800 font-bold">Mark as Posted</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <Label className="text-sm font-medium text-slate-600">
                Content Title
              </Label>
              <div className="text-lg font-bold mt-1 text-slate-800">{selectedContent?.title}</div>
            </div>
            
            <p className="text-sm text-slate-600">
              Are you sure you want to mark this content as posted? This will move it to the posted content archive.
            </p>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDetailOpen(false)} className="text-slate-600 hover:text-slate-800">
              Cancel
            </Button>
            <Button 
              variant="default" 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white"
            >
              {isSubmitting ? 'Marking as Posted...' : 'Mark as Posted'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Posted Content Dialog */}
      <Dialog open={isPostedDialogOpen} onOpenChange={setIsPostedDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] bg-white">
          <DialogHeader className="border-b border-gray-200 pb-4">
            <DialogTitle className="flex items-center gap-3 text-2xl font-bold text-gray-800">
              <div className="p-2 bg-gradient-to-r from-slate-600 to-slate-700 rounded-lg">
                <Archive className="w-6 h-6 text-white" />
              </div>
              <span className="text-slate-800">
                Posted Content
              </span>
              <div className="bg-slate-100 px-3 py-1 rounded-full text-sm font-medium text-slate-700">
                {postedContent.length}
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="overflow-y-auto max-h-[70vh] py-4">
            {postedContent.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="p-6 bg-gray-100 rounded-full mb-6">
                  <Archive className="w-16 h-16 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-600 mb-2">No Posted Content</h3>
                <p className="text-gray-500 text-sm">
                  Content that has been posted will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {postedContent.map((content, index) => (
                  <div 
                    key={content.id} 
                    className="group bg-gradient-to-r from-slate-50 via-gray-50 to-slate-50 hover:from-slate-100 hover:via-gray-100 hover:to-slate-100 border border-gray-200 hover:border-gray-300 rounded-lg p-4 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-2 h-2 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full"></div>
                          <h4 className="text-lg font-bold text-slate-800 truncate group-hover:text-slate-700 transition-colors">
                            {content.title}
                          </h4>
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                            Posted
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          {content.originalChannel && (
                            <div className="flex items-center gap-2 text-slate-600">
                              <span className="font-medium">Channel:</span>
                              <span className="text-slate-700 font-semibold">
                                {channels.find(ch => ch.id === content.originalChannel)?.name || content.originalChannel}
                              </span>
                            </div>
                          )}
                          
                          {content.postedAt && (
                            <div className="flex items-center gap-2 text-slate-600">
                              <Calendar className="w-4 h-4 text-slate-500" />
                              <span className="font-medium">Posted:</span>
                              <span className="text-slate-700 font-semibold">
                                {formatDate(content.postedAt)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="ml-4">
                        <Button
                          size="sm"
                          onClick={() => undoPostedContent(content)}
                          disabled={isSubmitting}
                          className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300 px-4 py-2"
                        >
                          <Undo2 className="w-4 h-4 mr-2" />
                          {isSubmitting ? 'Restoring...' : 'Undo'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-gray-200 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsPostedDialogOpen(false)}
              className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-800"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
