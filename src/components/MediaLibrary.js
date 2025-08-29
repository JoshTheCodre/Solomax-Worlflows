'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Trash2, Download, Eye, Upload, Image, MoreVertical, Edit3, X, Filter, Calendar, User,
  FileImage, FileText, FileAudio, FileVideo, Folder, File, FileCode, FileCog, Music
} from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import { MEDIA_TYPES } from '@/lib/utils';
import useMediaStore from '@/store/mediaStore';
import useAuthStore from '@/lib/store';

export function MediaLibrary({ onSelect }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [showMetadata, setShowMetadata] = useState(false);
  const [selectedFileMetadata, setSelectedFileMetadata] = useState(null);
  const [sidebarPosition, setSidebarPosition] = useState({ right: 20, top: 100 });
  const [filterBy, setFilterBy] = useState('all');
  const [showRecycleBin, setShowRecycleBin] = useState(false);
  const [deletedFiles, setDeletedFiles] = useState([]);
  const [availableContent, setAvailableContent] = useState([]);
  const [contentByChannel, setContentByChannel] = useState({});
  const handleRightClick = (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedFileMetadata(item);
    setShowMetadata(true);
  };

  const closeSidebar = () => {
    setShowMetadata(false);
    setSelectedFileMetadata(null);
  };
  const { user } = useAuthStore();
  const {
    media,
    loading,
    error,
    getMediaByType,
    deleteMedia,
    uploadFiles,
    setMedia
  } = useMediaStore();

  // Helper function to check if a file is an image
  const isImageFile = (item) => {
    if (!item) return false;

    // Check by file extension
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tiff', 'tif'];
    const filename = item.filename || item.original_filename || '';
    const extension = filename.split('.').pop()?.toLowerCase();
    const isImageByExtension = imageExtensions.includes(extension);

    // Check by MIME type
    const mimeType = (item.type || item.contentType || '').toLowerCase();
    const isImageByMime = mimeType.startsWith('image/');

    // Check by explicit type
    const isImageByType = item.type === MEDIA_TYPES.IMAGE;

    return isImageByExtension || isImageByMime || isImageByType;
  };

  // Get all media of current type, including correcting image types
  let mediaOfType;

  if (activeTab === 'all') {
    // For All tab, get all media files
    mediaOfType = Array.isArray(media) ? media : [];
  } else if (activeTab === MEDIA_TYPES.IMAGE) {
    // For Images tab, get all files with image extensions from all media types
    const allMedia = Array.isArray(media) ? media : [];
    mediaOfType = allMedia.filter(item => isImageFile(item)).map(item => ({
      ...item,
      type: MEDIA_TYPES.IMAGE
    }));
  } else {
    // For other tabs, get media by type
    mediaOfType = getMediaByType(activeTab).map(item => {
      if (isImageFile(item)) {
        return { ...item, type: MEDIA_TYPES.IMAGE };
      }
      return item;
    });

    // For Documents tab, filter out any image files
    if (activeTab === MEDIA_TYPES.DOCUMENT) {
      mediaOfType = mediaOfType.filter(item => !isImageFile(item));
    }
  }

  // Filter out deleted files and apply search/filters
  const filteredMedia = mediaOfType
    .filter(item => !deletedFiles.some(df => df.id === item.id))
    .filter(item => {
      // Search filter
      const matchesSearch = item.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase());
      // Date/size filter
      let matchesFilter = true;
      if (filterBy !== 'all') {
        const now = new Date();
        const itemDate = item.uploadedAt ? new Date(item.uploadedAt.seconds * 1000) : new Date();
        switch (filterBy) {
          case 'today':
            matchesFilter = itemDate.toDateString() === now.toDateString();
            break;
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            matchesFilter = itemDate >= weekAgo;
            break;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            matchesFilter = itemDate >= monthAgo;
            break;
          case 'large':
            matchesFilter = (item.size || 0) > 10 * 1024 * 1024; // > 10MB
            break;
          case 'small':
            matchesFilter = (item.size || 0) < 1024 * 1024; // < 1MB
            break;
        }
      }
      return matchesSearch && matchesFilter;
    });

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    await uploadFiles(files, user);
    e.target.value = ''; // Reset input
  };

  const getFileIcon = (item) => {
    if (!item || !item.filename) {
      switch (item?.type) {
        case MEDIA_TYPES.PROJECT_FILES:
          return <FileCog className="w-6 h-6 text-purple-500" />;
        case MEDIA_TYPES.IMAGE:
          return <FileImage className="w-6 h-6 text-blue-500" />;
        case MEDIA_TYPES.AUDIO:
          return <FileAudio className="w-6 h-6 text-green-500" />;
        case MEDIA_TYPES.VIDEO:
          return <FileVideo className="w-6 h-6 text-pink-500" />;
        case MEDIA_TYPES.DOCUMENT:
          return <FileText className="w-6 h-6 text-orange-500" />;
        default:
          return <File className="w-6 h-6 text-gray-500" />;
      }
    }

    const extension = item.filename.split('.').pop().toLowerCase();

    switch (item.type) {
      case MEDIA_TYPES.PROJECT_FILES:
        if (extension === 'pp' || extension === 'png') {
          return <img src="/pp.png" className="w-6 h-6" alt="Project file" />;
        }
        if (['psd', 'ai', 'fig', 'sketch', 'xd'].includes(extension)) {
          return <FileCode className="w-6 h-6 text-indigo-500" />;
        }
        if (['aep', 'prproj'].includes(extension)) {
          return <FileVideo className="w-6 h-6 text-purple-500" />;
        }
        return <Folder className="w-6 h-6 text-amber-500" />;

      case MEDIA_TYPES.IMAGE:
        return <FileImage className="w-6 h-6 text-blue-500" />;

      case MEDIA_TYPES.AUDIO:
        return (
          <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center">
            <Music className="w-4 h-4" />
          </div>
        );

      case MEDIA_TYPES.VIDEO:
        return <FileVideo className="w-6 h-6 text-pink-500" />;

      case MEDIA_TYPES.DOCUMENT:
        if (extension === 'pdf') {
          return <FileText className="w-6 h-6 text-red-500" />;
        }
        if (['doc', 'docx'].includes(extension)) {
          return <FileText className="w-6 h-6 text-blue-600" />;
        }
        if (extension === 'txt') {
          return <FileText className="w-6 h-6 text-gray-600" />;
        }
        return <FileText className="w-6 h-6 text-orange-500" />;

      default:
        return <File className="w-6 h-6 text-gray-500" />;
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDelete = async (item, e) => {
    if (e) {
      e.stopPropagation();
    }

    const confirmDelete = e ? window.confirm(`Move "${item.filename}" to recycle bin?`) : true;

    if (confirmDelete) {
      try {
        // Check if item is already in recycle bin
        const isAlreadyDeleted = deletedFiles.some(f => f.id === item.id);
        if (isAlreadyDeleted) {
          toast.info(`"${item.filename}" is already in the recycle bin`);
          return;
        }

        // Add to deleted files with timestamp
        const deletedItem = { ...item, deletedAt: new Date() };
        setDeletedFiles(prev => [...prev, deletedItem]);

        // Update media store state - remove only the specific item
        const currentMedia = Array.isArray(media) ? media : [];
        const updatedMedia = currentMedia.filter(file => file.id !== item.id);
        setMedia(updatedMedia);

        // Remove from availableContent if present
        setAvailableContent(prev => prev.filter(c => c.id !== item.id));

        // Remove from channels if present
        setContentByChannel(prev => {
          const newState = { ...prev };
          Object.keys(newState).forEach(ch => {
            if (Array.isArray(newState[ch])) {
              newState[ch] = newState[ch].filter(c => c.id !== item.id);
            }
          });
          return newState;
        });

        toast.success(`"${item.filename}" moved to recycle bin`);
        if (showMetadata) {
          closeSidebar();
        }
      } catch (error) {
        console.error('Error moving to recycle bin:', error);
        toast.error('Failed to move file to recycle bin');
      }
    }
  };

  const handleRestore = (item) => {
    // Remove from deleted files
    setDeletedFiles(prev => prev.filter(f => f.id !== item.id));

    // Add back to appropriate collection
    if (item.type === MEDIA_TYPES.PROJECT_FILES) {
      setAvailableContent(prev => [...prev, item]);
    }
    if (item.channel) {
      setContentByChannel(prev => ({
        ...prev,
        [item.channel]: [...(prev[item.channel] || []), item]
      }));
    }

    toast.success(`"${item.filename}" restored successfully`);
  };

  const handlePermanentDelete = async (item) => {
    if (window.confirm(`Permanently delete "${item.filename}"? This cannot be undone.`)) {
      await deleteMedia(item);
      setDeletedFiles(prev => prev.filter(f => f.id !== item.id));
      toast.success(`"${item.filename}" permanently deleted`);
    }
  };

  const handleDownload = (item, e) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = item.url;
    link.download = item.filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTabCount = (type) => {
    if (type === 'all') {
      return Array.isArray(media) ? media.length : 0;
    }

    const mediaForType = getMediaByType(type);

    // For Documents tab, exclude image files from count
    if (type === MEDIA_TYPES.DOCUMENT) {
      return mediaForType.filter(item => !isImageFile(item)).length;
    }

    // For Images tab, include files with image extensions
    if (type === MEDIA_TYPES.IMAGE) {
      const allMedia = Array.isArray(media) ? media : [];
      return allMedia.filter(item => isImageFile(item)).length;
    }

    return mediaForType.length;
  };

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-500">Error loading media: {error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-4 h-full">
      {/* Main Content Area */}
      <div className={`flex-1 transition-all duration-300 ${showMetadata ? 'mr-72' : ''} min-w-0`}>
        <div className="space-y-4 overflow-hidden">
          <div className="flex items-center gap-4">
            <Input
              type="text"
              placeholder="Search media..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />

            <Select value={filterBy} onValueChange={setFilterBy}>
          <SelectTrigger className="w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem key="all" value="all">All Files</SelectItem>
            <SelectItem key="today" value="today">Today</SelectItem>
            <SelectItem key="week" value="week">This Week</SelectItem>
            <SelectItem key="month" value="month">This Month</SelectItem>
            <SelectItem key="large" value="large">Large Files (&gt;10MB)</SelectItem>
            <SelectItem key="small" value="small">Small Files (&lt;1MB)</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative ml-auto">
          <Input
            type="file"
            multiple
            onChange={handleFileUpload}
            className="absolute inset-0 opacity-0 cursor-pointer"
            accept="*/*"
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowRecycleBin(true)}
              className="relative hover:bg-gray-100"
            >
              <Trash2 className="w-4 h-4 opacity-70" />
              {deletedFiles.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                  {deletedFiles.length}
                </span>
              )}
            </Button>
            <Button className="bg-gray-900 hover:bg-gray-800 text-white shadow-md border-0 transition-all duration-200 hover:shadow-lg">
              <Upload className="w-4 h-4 mr-2 opacity-75" />
              Upload Files
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="all" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6 p-1 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg gap-1">
          <TabsTrigger
            value="all"
            className="flex items-center gap-2 px-3 py-2 data-[state=active]:bg-gray-50 data-[state=active]:text-gray-700 data-[state=active]:border-2 data-[state=active]:border-dashed data-[state=active]:border-gray-300 relative group transition-all duration-200"
          >
            <Folder className="w-4 h-4 text-gray-700 group-data-[state=active]:text-gray-500" />
            <span className="hidden sm:inline">All</span>
            <span className="bg-gray-100 text-gray-700 group-data-[state=active]:bg-gray-200 text-xs px-2 py-0.5 rounded-full transition-colors">
              {getTabCount('all')}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value={MEDIA_TYPES.PROJECT_FILES}
            className="flex items-center gap-2 px-3 py-2 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 data-[state=active]:border-2 data-[state=active]:border-dashed data-[state=active]:border-purple-300 relative group transition-all duration-200"
          >
            <FileCog className="w-4 h-4 text-gray-700 group-data-[state=active]:text-purple-500" />
            <span className="hidden sm:inline">Project files</span>
            <span className="bg-purple-100 text-purple-700 group-data-[state=active]:bg-purple-200 text-xs px-2 py-0.5 rounded-full transition-colors">
              {getTabCount(MEDIA_TYPES.PROJECT_FILES)}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value={MEDIA_TYPES.VIDEO}
            className="flex items-center gap-2 px-3 py-2 data-[state=active]:bg-pink-50 data-[state=active]:text-pink-700 data-[state=active]:border-2 data-[state=active]:border-dashed data-[state=active]:border-pink-300 relative group transition-all duration-200"
          >
            <FileVideo className="w-4 h-4 text-gray-700 group-data-[state=active]:text-pink-500" />
            <span className="hidden sm:inline">Video</span>
            <span className="bg-pink-100 text-pink-700 group-data-[state=active]:bg-pink-200 text-xs px-2 py-0.5 rounded-full transition-colors">
              {getTabCount(MEDIA_TYPES.VIDEO)}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value={MEDIA_TYPES.AUDIO}
            className="flex items-center gap-2 px-3 py-2 data-[state=active]:bg-green-50 data-[state=active]:text-green-700 data-[state=active]:border-2 data-[state=active]:border-dashed data-[state=active]:border-green-300 relative group transition-all duration-200"
          >
            <Music className="w-4 h-4 text-gray-700 group-data-[state=active]:text-green-700" />
            <span className="hidden sm:inline">Audio</span>
            <span className="bg-green-100 text-green-700 group-data-[state=active]:bg-green-200 text-xs px-2 py-0.5 rounded-full transition-colors">
              {getTabCount(MEDIA_TYPES.AUDIO)}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value={MEDIA_TYPES.IMAGE}
            className="flex items-center gap-2 px-3 py-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-2 data-[state=active]:border-dashed data-[state=active]:border-blue-300 relative group transition-all duration-200"
          >
            <FileImage className="w-4 h-4 text-gray-700 group-data-[state=active]:text-blue-500" />
            <span className="hidden sm:inline">Images</span>
            <span className="bg-blue-100 text-blue-700 group-data-[state=active]:bg-blue-200 text-xs px-2 py-0.5 rounded-full transition-colors">
              {getTabCount(MEDIA_TYPES.IMAGE)}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value={MEDIA_TYPES.DOCUMENT}
            className="flex items-center gap-2 px-3 py-2 data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700 data-[state=active]:border-2 data-[state=active]:border-dashed data-[state=active]:border-amber-300 relative group transition-all duration-200"
          >
            <FileText className="w-4 h-4 text-gray-700 group-data-[state=active]:text-amber-500" />
            <span className="hidden sm:inline">Documents</span>
            <span className="bg-amber-100 text-amber-700 group-data-[state=active]:bg-amber-200 text-xs px-2 py-0.5 rounded-full transition-colors">
              {getTabCount(MEDIA_TYPES.DOCUMENT)}
            </span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent key="all" value="all" className="mt-4">
          {loading ? (
            <div className="text-center p-8">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
                <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-t-transparent border-indigo-500 animate-spin"></div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 font-medium">Loading media...</p>
            </div>
          ) : filteredMedia.length === 0 ? (
            <div className="text-center p-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700">
              <div className="w-16 h-16 mx-auto mb-4 bg-white dark:bg-gray-700 rounded-2xl flex items-center justify-center shadow-sm">
                <Folder className="w-6 h-6 text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {searchQuery ? 'No matches found' : 'No files yet'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {searchQuery
                  ? `No files found matching "${searchQuery}"`
                  : `No files have been uploaded yet`
                }
              </p>
              {!searchQuery && (
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Drag and drop your files anywhere or use the upload button above
                </p>
              )}
            </div>
          ) : (
            <div className={`grid gap-6 ${showMetadata 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            }`}>
              {filteredMedia.map((item) => (
                <Card
                  key={item.id}
                  className="group relative cursor-pointer hover:shadow-xl transition-all duration-300 bg-white border border-gray-200 shadow-sm overflow-hidden rounded-xl h-56 py-0"
                  onClick={() => onSelect?.(item)}
                  onContextMenu={(e) => handleRightClick(e, item)}
                >
                  {/* Clean Hover Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 flex items-center justify-center">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-10 w-10 p-0 bg-white/90 hover:bg-white text-gray-700 rounded-lg transition-all duration-200"
                        onClick={(e) => handleDownload(item, e)}
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-10 w-10 p-0 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-200"
                        onClick={(e) => handleDelete(item, e)}
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Content Layout - Reduced Height */}
                  <div className="h-full flex flex-col">
                    {/* Preview Section - No Top Rounding */}
                    <div className="h-32 bg-gray-100 rounded-t-xl overflow-hidden relative">
                      {item.type === MEDIA_TYPES.VIDEO && (
                        <video
                          src={item.url}
                          className="w-full h-full object-cover"
                          preload="metadata"
                        />
                      )}

                      {item.type === MEDIA_TYPES.AUDIO && (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-purple-200">
                          <div className="text-center">
                            <Music className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                            <span className="text-xs text-purple-700 font-medium">Audio</span>
                          </div>
                        </div>
                      )}

                      {(item.type === MEDIA_TYPES.IMAGE || isImageFile(item)) && (
                        <img
                          src={item.url}
                          alt={item.filename}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      )}

                      {item.type === MEDIA_TYPES.DOCUMENT && (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
                          <div className="text-center">
                            <FileText className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                            <span className="text-xs text-blue-700 font-medium">Document</span>
                          </div>
                        </div>
                      )}

                      {item.type === MEDIA_TYPES.PROJECT_FILES && (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-100 to-amber-200">
                          <div className="text-center">
                            <img src="/pp.png" className="w-6 h-6 mx-auto mb-1" alt="Project file" />
                            <span className="text-xs text-amber-700 font-medium">Project</span>
                          </div>
                        </div>
                      )}

                      {/* Default fallback */}
                      {!['video', 'audio', 'image', 'document', 'project_files'].includes(item.type) && (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                          <div className="text-center">
                            <File className="w-6 h-6 text-gray-600 mx-auto mb-1" />
                            <span className="text-xs text-gray-700 font-medium">File</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Content Info - Compact Layout */}
                    <div className="flex-1 p-3 flex flex-col justify-between">
                      {/* Title and Size */}
                      <div className="mb-2">
                        <h3 className="font-semibold text-sm text-gray-900 leading-tight mb-1 line-clamp-2" title={item.filename}>
                          {item.filename}
                        </h3>
                        <span className="inline-block text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                          {formatFileSize(item.size)}
                        </span>
                      </div>

                      {/* Footer with Flex Wrap */}
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-1 text-xs text-gray-500">
                          <span className="truncate min-w-0 flex-shrink">{item.uploadedBy}</span>
                          <span className="flex-shrink-0">{formatDate(item.uploadedAt || item.createdAt)}</span>
                        </div>
                        <div className="text-center">
                          <span className="inline-block px-2 py-0.5 bg-gray-900 text-white text-xs font-medium rounded">
                            {(item.type || 'file').split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {Object.values(MEDIA_TYPES).map((type) => (
          <TabsContent key={type} value={type} className="mt-4">
            {loading ? (
              <div className="text-center p-12">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
                  <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-t-transparent border-indigo-500 animate-spin"></div>
                </div>
                <p className="text-gray-600 dark:text-gray-300 font-medium">Loading media...</p>
              </div>
            ) : filteredMedia.length === 0 ? (
              <div className="text-center p-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700">
                <div className="w-16 h-16 mx-auto mb-4 bg-white dark:bg-gray-700 rounded-2xl flex items-center justify-center shadow-sm">
                  {getFileIcon({ type })}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {searchQuery ? 'No matches found' : 'No files yet'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {searchQuery
                    ? `No ${type} files found matching "${searchQuery}"`
                    : `No ${type} files have been uploaded yet`
                  }
                </p>
                {!searchQuery && (
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    Drag and drop your files anywhere or use the upload button above
                  </p>
                )}
              </div>
            ) : (
              <div className={`grid gap-6 ${showMetadata 
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              }`}>
                {filteredMedia.map((item) => (
                  <Card
                    key={item.id}
                    className="group relative cursor-pointer hover:shadow-2xl transition-all duration-500 bg-white border border-gray-200/50 shadow-lg overflow-hidden rounded-2xl h-fit"
                    onClick={() => onSelect?.(item)}
                    onContextMenu={(e) => handleRightClick(e, item)}
                  >
                    {/* Professional Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/60 to-black/90 opacity-0 group-hover:opacity-100 transition-all duration-500 z-10 flex flex-col justify-end p-6">
                      <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                        <div className="text-white text-sm font-semibold mb-3 tracking-wide">
                          {type.replace('_', ' ').toUpperCase()}
                        </div>
                        <div className="flex items-center justify-center gap-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-11 w-11 p-0 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-xl backdrop-blur-md transition-all duration-300 hover:scale-110"
                            onClick={(e) => handleDownload(item, e)}
                            title="Download"
                          >
                            <Download className="w-5 h-5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-11 w-11 p-0 bg-red-500/80 hover:bg-red-500 text-white border border-red-400/30 rounded-xl backdrop-blur-md transition-all duration-300 hover:scale-110"
                            onClick={(e) => handleDelete(item, e)}
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="p-5">
                      {/* Header with Icon and Basic Info */}
                      <div className="flex items-start gap-3 mb-4">
                        <div className="p-3 bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-300 rounded-xl shadow-sm">
                          {item.type === MEDIA_TYPES.PROJECT_FILES ? (
                            <img src="/pp.png" className="w-6 h-6" alt="Project file" />
                          ) : (
                            getFileIcon(item)
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-sm text-gray-900 leading-snug mb-2 line-clamp-2" title={item.filename}>
                            {item.filename}
                          </h3>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                              {formatFileSize(item.size)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Preview Section */}
                      {item.type === MEDIA_TYPES.VIDEO && (
                        <div className="mb-4 aspect-video bg-gray-100 rounded-xl overflow-hidden border border-gray-200 shadow-inner">
                          <video
                            src={item.url}
                            className="w-full h-full object-cover"
                            preload="metadata"
                          />
                        </div>
                      )}

                      {item.type === MEDIA_TYPES.AUDIO && (
                        <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200">
                          <audio controls className="w-full h-6">
                            <source src={item.url} />
                          </audio>
                        </div>
                      )}

                      {(item.type === MEDIA_TYPES.IMAGE || isImageFile(item)) && (
                        <div className="mb-4 aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden border border-gray-200 shadow-inner">
                          <img
                            src={item.url}
                            alt={item.filename}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      )}

                      {/* Footer Information */}
                      <div className="space-y-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <User className="w-3.5 h-3.5" />
                            <span className="font-medium">{item.uploadedBy}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-500">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{formatDate(item.uploadedAt || item.createdAt)}</span>
                          </div>
                        </div>
                        <div className="text-center">
                          <span className="inline-block px-3 py-1.5 bg-gradient-to-r from-gray-900 to-gray-700 text-white text-xs font-semibold rounded-full shadow-sm">
                            {(type || 'file').split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
        </div>
      </div>

      {/* Responsive Metadata Sidebar */}
      {showMetadata && selectedFileMetadata && (
        <div className="fixed right-0 top-16 h-[calc(100vh-4rem)] w-72 bg-white border-l border-gray-200 shadow-xl z-50 transform transition-transform duration-300 ease-in-out overflow-hidden">
          <div className="h-full flex flex-col">
            <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
              <h3 className="font-semibold text-lg flex items-center gap-2 text-gray-800">
                <Eye className="w-5 h-5 text-indigo-600" />
                File Details
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-full hover:bg-white/50"
                onClick={closeSidebar}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* File Preview */}
              <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                {(selectedFileMetadata.type === MEDIA_TYPES.IMAGE || isImageFile(selectedFileMetadata)) && (
                  <img 
                    src={selectedFileMetadata.url} 
                    alt={selectedFileMetadata.filename}
                    className="w-full h-full object-cover"
                  />
                )}
                {selectedFileMetadata.type === MEDIA_TYPES.VIDEO && (
                  <video 
                    src={selectedFileMetadata.url} 
                    className="w-full h-full object-cover"
                    controls
                  />
                )}
                {selectedFileMetadata.type === MEDIA_TYPES.AUDIO && (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-100 to-purple-200">
                    <Music className="w-12 h-12 text-purple-600 mb-4" />
                    <audio controls className="w-full max-w-xs">
                      <source src={selectedFileMetadata.url} />
                    </audio>
                  </div>
                )}
                {![MEDIA_TYPES.IMAGE, MEDIA_TYPES.VIDEO, MEDIA_TYPES.AUDIO].includes(selectedFileMetadata.type) && !isImageFile(selectedFileMetadata) && (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                        {selectedFileMetadata.type === MEDIA_TYPES.PROJECT_FILES ? (
                          <img src="/pp.png" className="w-8 h-8" alt="Project file" />
                        ) : (
                          getFileIcon(selectedFileMetadata)
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {(selectedFileMetadata.type || 'file').split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* File Information */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filename</label>
                  <p className="font-medium text-gray-900 mt-1 break-words" title={selectedFileMetadata.filename}>
                    {selectedFileMetadata.filename}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Size</label>
                    <p className="font-medium text-gray-900 mt-1">{formatFileSize(selectedFileMetadata.size)}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</label>
                    <p className="font-medium text-gray-900 mt-1">
                      {(selectedFileMetadata.type || 'file').split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Uploaded By</label>
                  <p className="font-medium text-gray-900 mt-1">{selectedFileMetadata.uploadedBy}</p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Upload Date</label>
                  <p className="font-medium text-gray-900 mt-1">
                    {formatDate(selectedFileMetadata.uploadedAt || selectedFileMetadata.createdAt)}
                  </p>
                </div>

                {selectedFileMetadata.channel && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Channel</label>
                    <p className="font-medium text-gray-900 mt-1">{selectedFileMetadata.channel}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1 gap-2 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200"
                  onClick={(e) => handleDownload(selectedFileMetadata, e)}
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 gap-2 text-red-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                  onClick={(e) => {
                    handleDelete(selectedFileMetadata, e);
                    closeSidebar();
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay for mobile */}
      {showMetadata && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Recycle Bin Dialog */}
      <Dialog open={showRecycleBin} onOpenChange={setShowRecycleBin}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-gray-500" />
              Recycle Bin
            </DialogTitle>
          </DialogHeader>

          {deletedFiles.length === 0 ? (
            <div className="py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-gray-500">Recycle bin is empty</p>
            </div>
          ) : (
            <div className="relative overflow-x-auto max-h-[60vh]">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-4 py-3">File</th>
                    <th className="px-4 py-3">Deleted</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deletedFiles.map((file) => (
                    <tr key={file.id} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="p-1 bg-gray-50 rounded">
                            {file.type === MEDIA_TYPES.PROJECT_FILES ? (
                              <img src="/pp.png" className="w-5 h-5" alt="Project file" />
                            ) : (
                              getFileIcon(file)
                            )}
                          </div>
                          <span className="font-medium">{file.filename}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(file.deletedAt).toLocaleDateString()} {new Date(file.deletedAt).toLocaleTimeString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestore(file)}
                            className="h-8 px-2 hover:bg-green-50 hover:text-green-600 hover:border-green-200"
                          >
                            Restore
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePermanentDelete(file)}
                            className="h-8 px-2 text-red-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRecycleBin(false)}>
              Close
            </Button>
            {deletedFiles.length > 0 && (
              <Button
                variant="destructive"
                onClick={() => {
                  if (window.confirm('Permanently delete all items in the recycle bin? This cannot be undone.')) {
                    Promise.all(deletedFiles.map(file => deleteMedia(file)))
                      .then(() => {
                        setDeletedFiles([]);
                        toast.success('Recycle bin emptied');
                      })
                      .catch(error => {
                        console.error('Error emptying recycle bin:', error);
                        toast.error('Failed to empty recycle bin');
                      });
                  }
                }}
              >
                Empty Recycle Bin
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
