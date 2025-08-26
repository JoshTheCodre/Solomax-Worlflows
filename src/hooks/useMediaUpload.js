'use client';

import { useState, useCallback } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MEDIA_TYPES } from '@/lib/utils';

export function useMediaUpload() {
  const [uploads, setUploads] = useState([]);

  const getFileType = (file) => {
    const extension = file.name.split('.').pop().toLowerCase();
    
    // Project files
    if (['psd', 'ai', 'indd', 'aep', 'prproj', 'fig', 'sketch'].includes(extension)) {
      return MEDIA_TYPES.PROJECT_FILES;
    }
    
    // Audio files
    if (['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a'].includes(extension)) {
      return MEDIA_TYPES.AUDIO;
    }
    
    // Video files
    if (['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv', 'wmv'].includes(extension)) {
      return MEDIA_TYPES.VIDEO;
    }
    
    // Documents (default)
    return MEDIA_TYPES.DOCUMENT;
  };

  const createUploadRecord = (file) => ({
    id: Date.now() + Math.random(),
    filename: file.name,
    size: file.size,
    type: getFileType(file),
    status: 'uploading',
    progress: 0,
    speed: null,
    error: null,
    file
  });

  const simulateUpload = async (uploadId, file) => {
    const updateProgress = (progress, speed = null) => {
      setUploads(prev => prev.map(upload => 
        upload.id === uploadId 
          ? { ...upload, progress, speed }
          : upload
      ));
    };

    const updateStatus = (status, error = null) => {
      setUploads(prev => prev.map(upload => 
        upload.id === uploadId 
          ? { ...upload, status, error }
          : upload
      ));
    };

    try {
      // Simulate upload progress
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        const speed = `${(Math.random() * 500 + 100).toFixed(0)} KB/s`;
        updateProgress(progress, speed);
      }

      // Simulate saving to database
      await addDoc(collection(db, 'media'), {
        type: getFileType(file),
        filename: file.name,
        uploadedBy: 'Current User', // Replace with actual user
        url: 'https://placeholder.url/' + file.name, // Replace with actual upload URL
        size: file.size,
        createdAt: new Date()
      });

      updateStatus('completed');
      
      // Show success notification
      if (typeof window !== 'undefined' && window.showToast) {
        window.showToast(`${file.name} uploaded successfully`, 'success');
      }
    } catch (error) {
      updateStatus('failed', error.message);
      
      // Show error notification
      if (typeof window !== 'undefined' && window.showToast) {
        window.showToast(`Failed to upload ${file.name}: ${error.message}`, 'error');
      }
    }
  };

  const startUpload = useCallback((files) => {
    const fileArray = Array.from(files);
    const newUploads = fileArray.map(createUploadRecord);
    
    setUploads(prev => [...prev, ...newUploads]);
    
    // Start upload simulation for each file
    newUploads.forEach(upload => {
      simulateUpload(upload.id, upload.file);
    });
  }, []);

  const removeUpload = useCallback((uploadId) => {
    setUploads(prev => prev.filter(upload => upload.id !== uploadId));
  }, []);

  const clearCompleted = useCallback(() => {
    setUploads(prev => prev.filter(upload => 
      upload.status !== 'completed' && upload.status !== 'failed'
    ));
  }, []);

  return {
    uploads,
    startUpload,
    removeUpload,
    clearCompleted
  };
}
