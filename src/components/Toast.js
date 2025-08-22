'use client';

import { useState, useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createRoot } from 'react-dom/client';

// Toast types
export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
  WARNING: 'warning',
};

// Toast Container Component
export function ToastContainer({ children }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full">
      {children}
    </div>
  );
}

// Individual Toast Component
export function Toast({ 
  id, 
  type = TOAST_TYPES.INFO, 
  title, 
  message, 
  duration = 5000, 
  onClose 
}) {
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose(id), 300); // Wait for transition
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);
  
  // Icons for different toast types
  const icons = {
    [TOAST_TYPES.SUCCESS]: <CheckCircle className="h-5 w-5 text-green-600" />,
    [TOAST_TYPES.ERROR]: <AlertTriangle className="h-5 w-5 text-red-600" />,
    [TOAST_TYPES.WARNING]: <AlertTriangle className="h-5 w-5 text-amber-600" />,
    [TOAST_TYPES.INFO]: <Info className="h-5 w-5 text-blue-600" />,
  };
  
  // Background colors for different toast types
  const bgColors = {
    [TOAST_TYPES.SUCCESS]: 'bg-green-50 border-green-200',
    [TOAST_TYPES.ERROR]: 'bg-red-50 border-red-200',
    [TOAST_TYPES.WARNING]: 'bg-amber-50 border-amber-200',
    [TOAST_TYPES.INFO]: 'bg-blue-50 border-blue-200',
  };
  
  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(id), 300); // Wait for transition
  };
  
  return (
    <div
      className={cn(
        'border rounded-md shadow-md p-4 transform transition-all duration-300',
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
        bgColors[type] || 'bg-gray-50 border-gray-200'
      )}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div className="flex-shrink-0">
          {icons[type] || <Info className="h-5 w-5 text-gray-600" />}
        </div>
        
        {/* Content */}
        <div className="flex-1 pt-[1px]">
          {title && <div className="font-medium">{title}</div>}
          {message && <div className="text-sm text-gray-700 mt-1">{message}</div>}
        </div>
        
        {/* Close Button */}
        <button 
          onClick={handleClose}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 focus:outline-none"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

// Toast Manager
class ToastManager {
  constructor() {
    this.toasts = [];
    this.containerId = 'toast-container';
    this.containerRoot = null;
    this.setupContainer();
  }
  
  setupContainer() {
    // Check if container already exists
    if (typeof window !== 'undefined') {
      let containerElement = document.getElementById(this.containerId);
      
      if (!containerElement) {
        containerElement = document.createElement('div');
        containerElement.id = this.containerId;
        document.body.appendChild(containerElement);
      }
      
      this.containerRoot = createRoot(containerElement);
      this.renderToasts();
    }
  }
  
  renderToasts() {
    if (this.containerRoot) {
      this.containerRoot.render(
        <ToastContainer>
          {this.toasts.map(toast => (
            <Toast
              key={toast.id}
              id={toast.id}
              type={toast.type}
              title={toast.title}
              message={toast.message}
              duration={toast.duration}
              onClose={this.removeToast}
            />
          ))}
        </ToastContainer>
      );
    }
  }
  
  // Add a new toast
  addToast = (toast) => {
    const id = Date.now().toString();
    this.toasts = [...this.toasts, { id, ...toast }];
    this.renderToasts();
    return id;
  };
  
  // Remove a toast by ID
  removeToast = (id) => {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.renderToasts();
  };
  
  // Clear all toasts
  clearToasts = () => {
    this.toasts = [];
    this.renderToasts();
  };
  
  // Shorthand methods for different toast types
  success = (title, message, duration) => {
    return this.addToast({
      type: TOAST_TYPES.SUCCESS,
      title,
      message,
      duration
    });
  };
  
  error = (title, message, duration) => {
    return this.addToast({
      type: TOAST_TYPES.ERROR,
      title,
      message,
      duration
    });
  };
  
  warning = (title, message, duration) => {
    return this.addToast({
      type: TOAST_TYPES.WARNING,
      title,
      message,
      duration
    });
  };
  
  info = (title, message, duration) => {
    return this.addToast({
      type: TOAST_TYPES.INFO,
      title,
      message,
      duration
    });
  };
}

// Create and export a singleton instance
export const toast = new ToastManager();
