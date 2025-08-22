'use client';

import { useState, useEffect } from 'react';
import { Bell, X, Clock, User, Flag, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import useNotificationStore from '@/store/notificationStore';
import useAuthStore from '@/lib/store';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export function NotificationBell() {
  const { user } = useAuthStore();
  const {
    notifications,
    unreadCount,
    isOpen,
    setIsOpen,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications
  } = useNotificationStore();

  const [showRipple, setShowRipple] = useState(false);

  // Prevent body scroll when popup is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Remove temporary ripple effect since we now have continuous ripple
  // useEffect(() => {
  //   if (unreadCount > 0) {
  //     setShowRipple(true);
  //     const timer = setTimeout(() => setShowRipple(false), 600);
  //     return () => clearTimeout(timer);
  //   }
  // }, [unreadCount]);

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatDeadline = (deadline) => {
    if (!deadline) return 'No deadline';
    
    try {
      let date;
      if (deadline.toDate && typeof deadline.toDate === 'function') {
        // Firebase Timestamp
        date = deadline.toDate();
      } else if (deadline instanceof Date) {
        date = deadline;
      } else if (typeof deadline === 'string' || typeof deadline === 'number') {
        date = new Date(deadline);
      } else {
        return 'No deadline';
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'No deadline';
      }
      
      return format(date, 'MMM dd, yyyy');
    } catch (error) {
      console.warn('Error formatting deadline:', error);
      return 'No deadline';
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <Button
        variant="ghost"
        size="sm"
        className="relative p-3 hover:bg-gray-100 transition-all duration-200" // Adjusted padding for better look
        onClick={() => setIsOpen(!isOpen)}
      >
        <motion.div 
          className="relative"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            whileHover={{ rotate: [0, -10, 10, -10, 10, 0] }}
            transition={{ duration: 0.5 }}
          >
            <Bell className="h-12 w-12 text-gray-600" /> {/* Increased size */}
          </motion.div>

          {/* Unread Count Badge - scaled for larger bell */}
          {unreadCount > 0 && (
            <motion.div
              className={cn(
                "absolute -top-1 -right-1 h-6 w-6 flex items-center justify-center text-sm font-semibold p-0", // Larger badge
                "bg-red-600 rounded-full text-white shadow-md" // Continuous ripple effect with shadow
              )}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 10
              }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.div>
          )}

          {/* Continuous Ripple Effect for Badge */}
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full border-2 border-red-400 animate-ping opacity-30" />
          )}
        </motion.div>
      </Button>

      {/* Notifications Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="absolute right-0 top-full mt-2 z-50 overscroll-contain" 
            style={{ maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="w-80 shadow-lg border border-gray-200">
            <CardHeader className="pb-3 border-b sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Notifications</CardTitle>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Mark all read
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="p-1 h-6 w-6"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {notifications.length > 0 && (
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{notifications.length} total</span>
                </div>
              )}
            </CardHeader>

            <CardContent className="p-0 max-h-[500px] overflow-y-auto overscroll-contain">
              <div className="pb-4">
                {notifications.length === 0 ? (
                  <motion.div 
                    className="p-6 text-center text-gray-500"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No notifications yet</p>
                  </motion.div>
                ) : (
                  <motion.div 
                    className="divide-y divide-gray-100 pb-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >{/* Added padding bottom */}
                    {notifications.map((notification, index) => {
                      const isUserTask = notification.task?.assignee === user?.email;
                      
                      return (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={cn(
                            "p-4 transition-colors relative group",
                            !notification.read && "bg-blue-50/50 border-l-4 border-l-blue-500",
                            isUserTask && "bg-yellow-50/50 border-l-4 border-l-yellow-500", // Highlight user's own tasks
                            notification.read && isUserTask && "bg-yellow-25/25 border-l-2 border-l-yellow-300"
                          )}
                        >
                          {/* Notification Header */}
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-sm text-gray-900">
                                  {notification.title}
                                </h4>
                                {isUserTask && (
                                  <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-700 border-yellow-300">
                                    Your Task
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 mt-1">
                                {notification.message}
                              </p>
                            </div>
                          </div>

                          {/* Task Details */}
                          {notification.task && (
                            <div 
                              className={cn(
                                "rounded-md border p-3 mt-2",
                                isUserTask 
                                  ? "bg-yellow-50 border-yellow-200" 
                                  : "bg-white border-gray-200"
                              )}
                            >
                              <div className="space-y-2">
                                {/* Task Title & Priority */}
                                <div className="flex items-center justify-between">
                                  <h5 className="font-medium text-sm text-gray-900 truncate">
                                    {notification.task.title}
                                  </h5>
                                  <Badge
                                    variant="outline"
                                    className={cn("text-xs", getPriorityColor(notification.task.priority))}
                                  >
                                    <Flag className="h-3 w-3 mr-1" />
                                    {notification.task.priority}
                                  </Badge>
                                </div>

                                {/* Task Info Grid */}
                                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                                  <div className="flex items-center gap-1">
                                    <Briefcase className="h-3 w-3" />
                                    <span>{notification.task.type}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    <span className="truncate">{notification.task.assignee}</span>
                                  </div>
                                  <div className="flex items-center gap-1 col-span-2">
                                    <Clock className="h-3 w-3" />
                                    <span>{formatDeadline(notification.task.deadline)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Timestamp */}
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-xs text-gray-500">
                              {(() => {
                                try {
                                  return format(new Date(notification.timestamp), 'MMM dd, h:mm a');
                                } catch (error) {
                                  return 'Just now';
                                }
                              })()}
                            </span>
                            {!notification.read && (
                              <div 
                                className={cn(
                                  "h-2 w-2 rounded-full",
                                  isUserTask ? "bg-yellow-500" : "bg-blue-500"
                                )}
                              ></div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Overlay to close dropdown when clicking outside and prevent body scroll */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-black/5 backdrop-blur-sm overscroll-none"
          onClick={() => setIsOpen(false)}
          onWheel={(e) => e.stopPropagation()} // Better wheel event handling
          onTouchMove={(e) => e.stopPropagation()} // Prevent mobile scrolling
        />
      )}
    </div>
  );
}
