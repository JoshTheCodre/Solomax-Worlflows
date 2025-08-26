'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Upload, FileIcon } from 'lucide-react';

export function DragDropOverlay({ isActive, onDrop, onDragLeave }) {
  const pathname = usePathname();

  if (!isActive) return null;

  const getContextualMessage = () => {
    if (pathname === '/media') {
      return {
        title: "Drop files to upload",
        subtitle: "Release to add files to your media library"
      };
    } else if (pathname.includes('/tasks')) {
      return {
        title: "Drop files to upload",
        subtitle: "Files will be added to your media library for use in tasks"
      };
    } else if (pathname === '/home' || pathname.includes('/admin')) {
      return {
        title: "Drop files to upload",
        subtitle: "Files will be uploaded to your media library"
      };
    } else {
      return {
        title: "Drop files to upload",
        subtitle: "Release to start uploading your files to the media library"
      };
    }
  };

  const message = getContextualMessage();

  return (
    <div 
      className="fixed inset-0 bg-blue-500/20 backdrop-blur-sm z-40 flex items-center justify-center"
      onDrop={onDrop}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={onDragLeave}
    >
      <div className="bg-white rounded-lg p-8 shadow-xl border-2 border-dashed border-blue-500 max-w-md mx-4">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-blue-100 rounded-full">
              <Upload className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {message.title}
          </h3>
          <p className="text-gray-600 text-sm">
            {message.subtitle}
          </p>
          <div className="flex justify-center items-center gap-2 mt-4 text-sm text-gray-500">
            <FileIcon className="w-4 h-4" />
            <span>Supports images, videos, audio, documents & project files</span>
          </div>
        </div>
      </div>
    </div>
  );
}
