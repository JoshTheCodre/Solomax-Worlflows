'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { AddTaskModal } from './AddTaskModal';
import { Plus, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

export function DragDropTaskButton({ onSubmit, className, children, ...props }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const addTaskModalRef = useRef(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);
    
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev - 1);
    
    if (dragCounter === 1) {
      setIsDragOver(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragOver(false);
    setDragCounter(0);
    
    const files = Array.from(e.dataTransfer.files);
    
    if (files.length > 0) {
      // Filter for supported file types
      const supportedFiles = files.filter(file => {
        const fileType = file.type.toLowerCase();
        const fileName = file.name.toLowerCase();
        
        // Check for common file types
        return (
          // Adobe files
          fileName.endsWith('.psd') || fileName.endsWith('.ai') || fileName.endsWith('.indd') ||
          // Audio files
          fileType.startsWith('audio/') || fileName.endsWith('.mp3') || fileName.endsWith('.wav') || fileName.endsWith('.aac') ||
          // Video files
          fileType.startsWith('video/') || fileName.endsWith('.mp4') || fileName.endsWith('.mov') || fileName.endsWith('.avi') ||
          // Document files
          fileType === 'application/pdf' || fileName.endsWith('.pdf') ||
          fileType.startsWith('text/') || fileName.endsWith('.txt') || fileName.endsWith('.doc') || fileName.endsWith('.docx') ||
          // Image files
          fileType.startsWith('image/') ||
          // Other common files
          fileName.endsWith('.zip') || fileName.endsWith('.rar')
        );
      });
      
      if (supportedFiles.length > 0) {
        // Open the AddTaskModal with the files
        addTaskModalRef.current?.openWithFiles(supportedFiles);
      }
    }
  };

  return (
    <>
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="relative"
      >
        <AddTaskModal ref={addTaskModalRef} onSubmit={onSubmit}>
          <Button 
            className={cn(
              "bg-gradient-to-r from-blue-900 to-blue-700 text-white gap-2 shadow-lg hover:shadow-blue-200 font-medium px-6 border border-blue-800 hover:from-blue-800 hover:to-blue-600 transition-all duration-300",
              isDragOver && "ring-2 ring-blue-400 ring-offset-2 bg-gradient-to-r from-blue-800 to-blue-600 scale-105 shadow-xl",
              className
            )}
            {...props}
          >
            {isDragOver ? (
              <>
                <Upload className="h-4 w-4 animate-bounce" /> 
                Drop Files Here
              </>
            ) : (
              children || (
                <>
                  <Plus className="h-4 w-4" /> 
                  Create Task
                </>
              )
            )}
          </Button>
        </AddTaskModal>
        
        {/* Drag overlay for better visual feedback */}
        {isDragOver && (
          <div className="absolute inset-0 bg-blue-500/20 border-2 border-dashed border-blue-400 rounded-md flex items-center justify-center pointer-events-none z-10">
            <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-blue-700 font-medium">
              <Upload className="h-5 w-5" />
              Drop files to create task
            </div>
          </div>
        )}
      </div>
    </>
  );
}
