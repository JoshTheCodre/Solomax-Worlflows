'use client';

import { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Upload } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

export function UploadProgressSidebar({ uploads, onRemoveUpload, isVisible, onToggle }) {
  if (!isVisible || uploads.length === 0) return null;

  const completedCount = uploads.filter(upload => upload.status === 'completed').length;
  const failedCount = uploads.filter(upload => upload.status === 'failed').length;
  const uploadingCount = uploads.filter(upload => upload.status === 'uploading').length;

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white border-l border-gray-200 shadow-lg z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          <h3 className="font-semibold">Upload Progress</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onToggle}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Summary */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span>Uploading:</span>
            <span className="font-medium text-blue-600">{uploadingCount}</span>
          </div>
          <div className="flex justify-between">
            <span>Completed:</span>
            <span className="font-medium text-green-600">{completedCount}</span>
          </div>
          <div className="flex justify-between">
            <span>Failed:</span>
            <span className="font-medium text-red-600">{failedCount}</span>
          </div>
        </div>
      </div>

      {/* Upload List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {uploads.map((upload) => (
          <UploadItem 
            key={upload.id} 
            upload={upload} 
            onRemove={() => onRemoveUpload(upload.id)}
          />
        ))}
      </div>

      {/* Footer */}
      {uploads.length > 0 && (
        <div className="p-4 border-t border-gray-200">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => uploads.forEach(upload => onRemoveUpload(upload.id))}
            className="w-full"
          >
            Clear All
          </Button>
        </div>
      )}
    </div>
  );
}

function UploadItem({ upload, onRemove }) {
  const getStatusIcon = () => {
    switch (upload.status) {
      case 'uploading':
        return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Upload className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (upload.status) {
      case 'uploading':
        return 'text-blue-600';
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-white">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {getStatusIcon()}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{upload.filename}</p>
            <p className="text-xs text-gray-500">
              {upload.type} • {(upload.size / 1024 / 1024).toFixed(1)}MB
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onRemove} className="p-1 h-auto">
          <X className="w-3 h-3" />
        </Button>
      </div>

      {upload.status === 'uploading' && (
        <div className="space-y-1">
          <Progress value={upload.progress} className="h-2" />
          <div className="flex justify-between text-xs text-gray-500">
            <span>{upload.progress}%</span>
            <span>{upload.speed || '0 KB/s'}</span>
          </div>
        </div>
      )}

      {upload.status === 'failed' && upload.error && (
        <p className="text-xs text-red-500 mt-1">{upload.error}</p>
      )}

      <p className={`text-xs mt-1 capitalize ${getStatusColor()}`}>
        {upload.status}
      </p>
    </div>
  );
}
