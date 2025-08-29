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
    <div className="fixed right-0 top-0 h-full w-80 bg-gradient-to-b from-slate-50 to-white border-l border-slate-200 shadow-2xl z-50 flex flex-col backdrop-blur-sm">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-slate-100 to-slate-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg shadow-md">
              <Upload className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Upload Center</h3>
              <p className="text-xs text-slate-600">{uploads.length} files</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onToggle} className="hover:bg-slate-100">
            <X className="w-4 h-4 text-slate-600" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="p-4 border-b border-slate-200">
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-blue-600">{uploadingCount}</div>
            <div className="text-xs text-blue-600">Uploading</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-green-600">{completedCount}</div>
            <div className="text-xs text-green-600">Completed</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-red-600">{failedCount}</div>
            <div className="text-xs text-red-600">Failed</div>
          </div>
        </div>
      </div>

      {/* Upload List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
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
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => uploads.forEach(upload => onRemoveUpload(upload.id))}
            className="w-full border-slate-300 hover:bg-slate-100 text-slate-700"
          >
            Clear All Uploads
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
    <div className="border border-slate-200 rounded-lg p-3 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex-shrink-0">
            {getStatusIcon()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate text-slate-800">{upload.filename}</p>
            <p className="text-xs text-slate-500">
              {upload.type} • {(upload.size / 1024 / 1024).toFixed(1)}MB
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onRemove} className="p-1 h-auto hover:bg-red-50 hover:text-red-600">
          <X className="w-3 h-3" />
        </Button>
      </div>

      {upload.status === 'uploading' && (
        <div className="space-y-2">
          <Progress value={upload.progress} className="h-2 bg-slate-100" />
          <div className="flex justify-between text-xs text-slate-500">
            <span className="font-medium">{upload.progress}%</span>
            <span>{upload.speed || '0 KB/s'}</span>
          </div>
        </div>
      )}

      {upload.status === 'failed' && upload.error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
          {upload.error}
        </div>
      )}

      {upload.status === 'completed' && (
        <div className="mt-2 p-1 bg-green-50 rounded text-xs text-green-600 font-medium">
          ✓ Upload completed
        </div>
      )}
    </div>
  );
}
