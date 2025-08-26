'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { DragDropOverlay } from './DragDropOverlay';
import { UploadProgressSidebar } from './UploadProgressSidebar';
import useAuthStore from '@/lib/store';
import useMediaStore from '@/store/mediaStore';

export function MediaUploadWrapper({ children }) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const dragCounter = useRef(0);
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { uploads, uploadFiles, removeUpload, initializeMediaListener } = useMediaStore();

  // Only enable drag-and-drop on authenticated pages
  const isUploadEnabled = user && pathname !== '/';

  // Initialize media listener on mount
  useEffect(() => {
    if (user) {
      const unsubscribe = initializeMediaListener();
      return () => unsubscribe();
    }
  }, [user, initializeMediaListener]);

  useEffect(() => {
    if (!isUploadEnabled) return;

    const handleDragEnter = (e) => {
      e.preventDefault();
      dragCounter.current++;
      if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        setIsDragActive(true);
      }
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      dragCounter.current--;
      if (dragCounter.current === 0) {
        setIsDragActive(false);
      }
    };

    const handleDragOver = (e) => {
      e.preventDefault();
    };

    const handleDrop = (e) => {
      e.preventDefault();
      setIsDragActive(false);
      dragCounter.current = 0;
      
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        uploadFiles(e.dataTransfer.files, user);
        setShowSidebar(true);
      }
    };

    // Add global event listeners
    document.addEventListener('dragenter', handleDragEnter);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);

    return () => {
      document.removeEventListener('dragenter', handleDragEnter);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('drop', handleDrop);
    };
  }, [isUploadEnabled, uploadFiles, user]);

  // Auto-show sidebar when new uploads start
  useEffect(() => {
    if (uploads.length > 0 && isUploadEnabled) {
      setShowSidebar(true);
    }
  }, [uploads.length, isUploadEnabled]);

  return (
    <>
      {children}
      
      {isUploadEnabled && (
        <>
          <DragDropOverlay 
            isActive={isDragActive}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragActive(false);
              dragCounter.current = 0;
              
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                uploadFiles(e.dataTransfer.files, user);
                setShowSidebar(true);
              }
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              dragCounter.current--;
              if (dragCounter.current === 0) {
                setIsDragActive(false);
              }
            }}
          />
          
          <UploadProgressSidebar
            uploads={uploads}
            onRemoveUpload={removeUpload}
            isVisible={showSidebar}
            onToggle={() => setShowSidebar(!showSidebar)}
          />
          
          {/* Upload indicator button */}
          {uploads.length > 0 && !showSidebar && (
            <button
              onClick={() => setShowSidebar(true)}
              className="fixed bottom-4 right-4 bg-blue-500 text-white rounded-full p-3 shadow-lg hover:bg-blue-600 transition-colors z-50 group"
            >
              <div className="flex items-center gap-2">
                {uploads.filter(u => u.status === 'uploading').length > 0 ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle className="w-5 h-5" />
                )}
                <span className="text-sm font-medium">
                  {uploads.filter(u => u.status === 'uploading').length > 0 
                    ? uploads.filter(u => u.status === 'uploading').length
                    : uploads.filter(u => u.status === 'completed').length
                  }
                </span>
              </div>
              <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploads.filter(u => u.status === 'completed').length}
              </div>
            </button>
          )}
        </>
      )}
    </>
  );
}
