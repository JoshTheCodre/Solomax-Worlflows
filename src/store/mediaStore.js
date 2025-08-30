import { create } from 'zustand';
import { collection, addDoc, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { MEDIA_TYPES } from '@/lib/utils';

const useMediaStore = create((set, get) => ({
  // State
  media: [],
  uploads: [],
  loading: false,
  error: null,

  // Actions
  setMedia: (media) => set({ media }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  // Initialize media listener
  initializeMediaListener: () => {
    const q = query(collection(db, 'media'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const mediaData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      set({ media: mediaData });
    }, (error) => {
      console.error('Error listening to media changes:', error);
      set({ error: error.message });
    });

    return unsubscribe;
  },

  // File type detection
  getFileType: (file) => {
    const extension = file.name.split('.').pop().toLowerCase();
    
    // Project files
    if (['psd', 'ai', 'indd', 'aep', 'prproj', 'fig', 'sketch', 'xd', 'blend', 'c4d', 'max', '3ds'].includes(extension)) {
      return MEDIA_TYPES.PROJECT_FILES;
    }
    
    // Audio files
    if (['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a', 'wma', 'opus'].includes(extension)) {
      return MEDIA_TYPES.AUDIO;
    }
    
    // Video files
    if (['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv', 'wmv', 'mpg', 'mpeg', 'm4v'].includes(extension)) {
      return MEDIA_TYPES.VIDEO;
    }
    
    // Documents
    if (['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'pages'].includes(extension)) {
      return MEDIA_TYPES.DOCUMENT;
    }
    
    // Default to documents for unknown types
    return MEDIA_TYPES.DOCUMENT;
  },

  // Get file category folder
  getStoragePath: (fileType, filename) => {
    const folder = {
      [MEDIA_TYPES.PROJECT_FILES]: 'project-files',
      [MEDIA_TYPES.DOCUMENT]: 'documents',
      [MEDIA_TYPES.AUDIO]: 'audio',
      [MEDIA_TYPES.VIDEO]: 'video'
    }[fileType] || 'documents';
    
    // Create a unique filename to prevent conflicts
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 9);
    const fileExtension = filename.split('.').pop();
    const fileNameWithoutExt = filename.replace(`.${fileExtension}`, '');
    const uniqueFilename = `${fileNameWithoutExt}-${timestamp}-${randomId}.${fileExtension}`;
    
    return `media/${folder}/${uniqueFilename}`;
  },

  // Create upload record
  createUpload: (file, user) => {
    const fileType = get().getFileType(file);
    const upload = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${file.name}`,
      filename: file.name,
      originalName: file.name,
      size: file.size,
      type: fileType,
      status: 'uploading',
      progress: 0,
      speed: null,
      error: null,
      file,
      uploadedBy: user?.name || user?.email || 'Unknown User',
      uploadedById: user?.uid || 'unknown',
      createdAt: new Date(),
      storagePath: get().getStoragePath(fileType, file.name)
    };

    set(state => ({
      uploads: [...state.uploads, upload]
    }));

    return upload;
  },

  // Update upload progress
  updateUpload: (uploadId, updates) => {
    set(state => ({
      uploads: state.uploads.map(upload =>
        upload.id === uploadId ? { ...upload, ...updates } : upload
      )
    }));
  },

  // Remove upload
  removeUpload: (uploadId) => {
    set(state => ({
      uploads: state.uploads.filter(upload => upload.id !== uploadId)
    }));
  },

  // Start file upload
  uploadFile: async (file, user) => {
    const upload = get().createUpload(file, user);
    const storageRef = ref(storage, upload.storagePath);

    try {
      const uploadTask = uploadBytesResumable(storageRef, file);

      // Monitor upload progress
      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          const bytesPerSecond = snapshot.bytesTransferred / 
            ((Date.now() - upload.createdAt.getTime()) / 1000);
          const speed = `${(bytesPerSecond / 1024).toFixed(0)} KB/s`;

          get().updateUpload(upload.id, {
            progress: Math.round(progress),
            speed
          });
        },
        (error) => {
          console.error('Upload error:', error);
          get().updateUpload(upload.id, {
            status: 'failed',
            error: error.message
          });
        },
        async () => {
          try {
            // Get download URL
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

            // Save to Firestore
            const mediaDoc = await addDoc(collection(db, 'media'), {
              filename: upload.filename,
              originalName: upload.originalName,
              type: upload.type,
              size: upload.size,
              url: downloadURL,
              storagePath: upload.storagePath,
              uploadedBy: upload.uploadedBy,
              uploadedById: upload.uploadedById,
              createdAt: upload.createdAt,
              updatedAt: new Date()
            });

            // Update upload status
            get().updateUpload(upload.id, {
              status: 'completed',
              url: downloadURL,
              mediaId: mediaDoc.id
            });

            // Show success notification
            if (typeof window !== 'undefined' && window.showToast) {
              window.showToast(`${upload.filename} uploaded successfully`, 'success');
            }

          } catch (error) {
            console.error('Error saving to Firestore:', error);
            get().updateUpload(upload.id, {
              status: 'failed',
              error: 'Failed to save file information'
            });
          }
        }
      );

    } catch (error) {
      console.error('Error starting upload:', error);
      get().updateUpload(upload.id, {
        status: 'failed',
        error: error.message
      });
    }

    return upload;
  },

  // Upload multiple files
  uploadFiles: async (files, user) => {
    const fileArray = Array.from(files);
    const uploads = [];
    const existingMedia = get().media || [];
    const existingUploads = get().uploads || [];

    // Filter out files that are already uploaded or currently uploading
    const newFiles = fileArray.filter(file => {
      const isDuplicate = existingMedia.some(media => 
        media.filename === file.name && 
        media.size === file.size
      ) || existingUploads.some(upload => 
        upload.filename === file.name && 
        upload.size === file.size &&
        (upload.status === 'uploading' || upload.status === 'completed')
      );
      
      if (isDuplicate) {
        console.log(`Skipping duplicate file: ${file.name}`);
      }
      
      return !isDuplicate;
    });

    if (newFiles.length === 0) {
      console.log('No new files to upload');
      return [];
    }

    for (const file of newFiles) {
      const upload = await get().uploadFile(file, user);
      uploads.push(upload);
    }

    return uploads;
  },

  // Delete media file
  deleteMedia: async (mediaItem) => {
    try {
      set({ loading: true });

      // Delete from Firebase Storage
      if (mediaItem.storagePath) {
        const storageRef = ref(storage, mediaItem.storagePath);
        await deleteObject(storageRef);
      }

      // Delete from Firestore
      await deleteDoc(doc(db, 'media', mediaItem.id));

      // Show success notification
      if (typeof window !== 'undefined' && window.showToast) {
        window.showToast(`${mediaItem.filename} deleted successfully`, 'success');
      }

    } catch (error) {
      console.error('Error deleting media:', error);
      set({ error: error.message });
      
      if (typeof window !== 'undefined' && window.showToast) {
        window.showToast(`Failed to delete ${mediaItem.filename}`, 'error');
      }
    } finally {
      set({ loading: false });
    }
  },

  // Get media by type
  getMediaByType: (type) => {
    return get().media.filter(item => item.type === type);
  },

  // Clear completed uploads
  clearCompletedUploads: () => {
    set(state => ({
      uploads: state.uploads.filter(upload => 
        upload.status !== 'completed' && upload.status !== 'failed'
      )
    }));
  },

  // Clear all uploads
  clearAllUploads: () => {
    set({ uploads: [] });
  }
}));

export default useMediaStore;
