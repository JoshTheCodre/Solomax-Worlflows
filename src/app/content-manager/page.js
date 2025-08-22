'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { FolderOpen, Video, Link as LinkIcon, Check, AlertCircle } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import useAuthStore from '@/lib/store';

export default function ContentManagerPage() {
  const [activeTab, setActiveTab] = useState('available');
  const [availableContent, setAvailableContent] = useState([]);
  const [postedContent, setPostedContent] = useState([]);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);
  const [channels, setChannels] = useState([
    { id: 'ch1', name: 'Main Channel' },
    { id: 'ch2', name: 'Vlog Channel' },
    { id: 'ch3', name: 'Tutorial Channel' }
  ]);
  const [selectedChannel, setSelectedChannel] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      fetchContent();
    }
  }, [user]);

  async function fetchContent() {
    try {
      if (!user) return;
      
      // Temporary workaround until Firestore index is created
      // Get all completed tasks for the current user and filter client-side
      const completedTasksQuery = query(
        collection(db, 'tasks'),
        where('assignee', '==', user.uid),
        where('status', '==', 'completed')
      );
      
      const completedSnapshot = await getDocs(completedTasksQuery);
      const allCompletedTasks = completedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Filter and sort client-side
      const availableData = allCompletedTasks
        .filter(task => task.videoPosted === false)
        .sort((a, b) => {
          // Sort by completedAt desc - handle cases where field might be missing
          const dateA = a.completedAt ? new Date(a.completedAt.seconds * 1000) : new Date(0);
          const dateB = b.completedAt ? new Date(b.completedAt.seconds * 1000) : new Date(0);
          return dateB - dateA;
        });
        
      const postedData = allCompletedTasks
        .filter(task => task.videoPosted === true)
        .sort((a, b) => {
          // Sort by completedAt desc - handle cases where field might be missing
          const dateA = a.completedAt ? new Date(a.completedAt.seconds * 1000) : new Date(0);
          const dateB = b.completedAt ? new Date(b.completedAt.seconds * 1000) : new Date(0);
          return dateB - dateA;
        });

      setAvailableContent(availableData);
      setPostedContent(postedData);
    } catch (error) {
      console.error('Error fetching content:', error);
      toast.error('Failed to load content. Please try again.');
    }
  }

  function openDetailDialog(content) {
    setSelectedContent(content);
    setSelectedChannel(content.channel || '');
    setVideoUrl(content.videoUrl || '');
    setIsDetailOpen(true);
  }

  async function handleSubmit() {
    if (!selectedChannel) {
      toast.error('Please select a channel');
      return;
    }

    if (!videoUrl) {
      toast.error('Please enter a video URL');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Update the task with channel and video URL
      await updateDoc(doc(db, 'tasks', selectedContent.id), {
        channel: selectedChannel,
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

  return (
    <div className="p-6">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Manager</h1>
          <p className="text-gray-600 mt-1">Manage your available and posted content</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 w-[400px] mb-6">
          <TabsTrigger value="available" className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4" />
            Available Content ({availableContent.length})
          </TabsTrigger>
          <TabsTrigger value="posted" className="flex items-center gap-2">
            <Video className="w-4 h-4" />
            Posted Content ({postedContent.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4">
          {availableContent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <FolderOpen className="w-12 h-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-700">No Available Content</h3>
              <p className="text-gray-500 text-sm mt-1">
                Completed tasks will appear here ready to be posted
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableContent.map((content) => (
                <Card key={content.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg font-semibold">{content.title}</CardTitle>
                      <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                        Completed
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {content.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-500">
                      <div className="flex items-center gap-2 mt-1">
                        <Check className="w-4 h-4 text-green-500" />
                        <span>Ready to be posted</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                        <span>Needs video URL</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0 flex justify-end">
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => openDetailDialog(content)}
                    >
                      Add Video Details
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="posted" className="space-y-4">
          {postedContent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Video className="w-12 h-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-700">No Posted Content</h3>
              <p className="text-gray-500 text-sm mt-1">
                Content that has been posted with video URLs will appear here
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {postedContent.map((content) => (
                <Card key={content.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg font-semibold">{content.title}</CardTitle>
                      <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                        Posted
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {content.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-500">
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-medium">Channel:</span>
                        <span>{channels.find(ch => ch.id === content.channel)?.name || content.channel}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <LinkIcon className="w-4 h-4 text-blue-500" />
                        <a 
                          href={content.videoUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline truncate"
                        >
                          {content.videoUrl}
                        </a>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0 flex justify-end">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openDetailDialog(content)}
                    >
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedContent?.videoPosted ? 'Content Details' : 'Add Video Details'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="title" className="text-sm font-medium text-gray-500">
                Content Title
              </Label>
              <div className="text-base font-medium mt-1">{selectedContent?.title}</div>
            </div>

            <div>
              <Label htmlFor="channel" className="text-sm font-medium text-gray-500">
                Select Channel
              </Label>
              <Select 
                value={selectedChannel}
                onValueChange={setSelectedChannel}
                disabled={selectedContent?.videoPosted}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a channel" />
                </SelectTrigger>
                <SelectContent>
                  {channels.map((channel) => (
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
                disabled={selectedContent?.videoPosted}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDetailOpen(false)}>
              {selectedContent?.videoPosted ? 'Close' : 'Cancel'}
            </Button>
            {!selectedContent?.videoPosted && (
              <Button 
                variant="default" 
                onClick={handleSubmit} 
                disabled={isSubmitting || !selectedChannel || !videoUrl}
              >
                {isSubmitting ? 'Saving...' : 'Save & Publish'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
