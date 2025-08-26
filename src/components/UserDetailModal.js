'use client';

import { useState, useEffect } from 'react';
import { format, isSameDay, subDays } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { TASK_STATUS, getStatusColor } from '@/lib/utils';
import { createTasksListener } from '@/lib/listeners';
import { 
  History, 
  LineChart, 
  CheckCheck, 
  Clock, 
  User, 
  Calendar,
  BarChart3,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  CircleDot,
  X,
  PieChart,
  BarChart,
  FolderKanban,
  Activity as ActivityIcon,
  Timer,
  ChartPie,
  ListFilter
} from 'lucide-react';

export function UserDetailModal({ user, isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('history');
  const [userTasks, setUserTasks] = useState([]);
  const [analytics, setAnalytics] = useState({
    completed: 0,
    active: 0,
    overdue: 0,
    efficiency: 0,
    weeklyCompletion: [0, 0, 0, 0, 0, 0, 0], // last 7 days
    completionRate: 0,
    averageCompletionTime: 0,
  });
  const [timeframe, setTimeframe] = useState('all');
  
  useEffect(() => {
    if (!isOpen || !user) return;
    
    // Set up listener for this user's tasks
    const unsubscribe = createTasksListener((tasks) => {
      setUserTasks(tasks);
      
      // Calculate analytics
      calculateAnalytics(tasks);
    }, { assignee: user.email });
    
    return () => unsubscribe();
  }, [isOpen, user]);
  
  const calculateAnalytics = (tasks) => {
    if (!tasks.length) return;
    
    const now = new Date();
    const completed = tasks.filter(t => t.status === TASK_STATUS.COMPLETED).length;
    const active = tasks.filter(t => t.status === TASK_STATUS.ACTIVE || t.status === TASK_STATUS.IN_PROGRESS).length;
    const overdue = tasks.filter(t => {
      if (!t.deadline || t.status === TASK_STATUS.COMPLETED) return false;
      const deadline = t.deadline.toDate ? t.deadline.toDate() : new Date(t.deadline);
      return deadline < now;
    }).length;
    
    // Completion rate
    const completionRate = tasks.length > 0 ? (completed / tasks.length * 100).toFixed(0) : 0;
    
    // Weekly completion (last 7 days)
    const weeklyCompletion = Array(7).fill(0);
    tasks.forEach(task => {
      if (task.status !== TASK_STATUS.COMPLETED || !task.completedAt) return;
      
      const completedDate = task.completedAt.toDate ? task.completedAt.toDate() : new Date(task.completedAt);
      for (let i = 0; i < 7; i++) {
        const day = subDays(now, i);
        if (isSameDay(completedDate, day)) {
          weeklyCompletion[6 - i]++;
          break;
        }
      }
    });
    
    // Average completion time (in hours)
    let totalCompletionTime = 0;
    let completedCount = 0;
    
    tasks.forEach(task => {
      if (task.status === TASK_STATUS.COMPLETED && task.completedAt && task.createdAt) {
        const completedAt = task.completedAt.toDate ? task.completedAt.toDate() : new Date(task.completedAt);
        const createdAt = task.createdAt.toDate ? task.createdAt.toDate() : new Date(task.createdAt);
        const timeDiff = completedAt - createdAt;
        totalCompletionTime += timeDiff;
        completedCount++;
      }
    });
    
    const averageCompletionTime = completedCount > 0 
      ? (totalCompletionTime / completedCount / (1000 * 60 * 60)).toFixed(1) 
      : 0;
    
    // Efficiency score (0-100)
    // Factors: completion rate, overdue tasks, average completion time
    const timeFactor = Math.min(100, Math.max(0, 100 - (averageCompletionTime / 24 * 100)));
    const overdueFactor = Math.min(100, Math.max(0, 100 - (overdue / Math.max(1, tasks.length) * 100)));
    const efficiency = ((parseInt(completionRate) + timeFactor + overdueFactor) / 3).toFixed(0);
    
    setAnalytics({
      completed,
      active,
      overdue,
      weeklyCompletion,
      completionRate,
      averageCompletionTime,
      efficiency
    });
  };
  
  // Group tasks by date for history view (like WhatsApp)
  const groupTasksByDate = (tasks) => {
    const groups = {};
    
    tasks.forEach(task => {
      let date;
      
      if (task.status === TASK_STATUS.COMPLETED && task.completedAt) {
        date = task.completedAt.toDate ? task.completedAt.toDate() : new Date(task.completedAt);
      } else {
        date = task.createdAt.toDate ? task.createdAt.toDate() : new Date(task.createdAt);
      }
      
      const dateStr = format(date, 'yyyy-MM-dd');
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      
      groups[dateStr].push(task);
    });
    
    // Sort each group by time
    Object.keys(groups).forEach(date => {
      groups[date].sort((a, b) => {
        const aDate = a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const bDate = b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return bDate - aDate;
      });
    });
    
    return groups;
  };
  
  // Format date header for history groups (like WhatsApp)
  const formatDateHeader = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (isSameDay(date, today)) {
      return 'Today';
    } else if (isSameDay(date, yesterday)) {
      return 'Yesterday';
    } else {
      return format(date, 'EEEE, MMMM d, yyyy');
    }
  };
  
  // Filter tasks based on selected timeframe
  const getFilteredTasks = () => {
    if (timeframe === 'all') return userTasks;
    
    const now = new Date();
    let cutoffDate;
    
    switch (timeframe) {
      case 'day':
        cutoffDate = subDays(now, 1);
        break;
      case 'week':
        cutoffDate = subDays(now, 7);
        break;
      case 'month':
        cutoffDate = subDays(now, 30);
        break;
      default:
        return userTasks;
    }
    
    return userTasks.filter(task => {
      const taskDate = task.createdAt.toDate ? task.createdAt.toDate() : new Date(task.createdAt);
      return taskDate >= cutoffDate;
    });
  };
  
  const filteredTasks = getFilteredTasks();
  const groupedTasks = groupTasksByDate(filteredTasks);
  const dateGroups = Object.keys(groupedTasks).sort().reverse();
  
  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden p-0">
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6">
          <div className="flex items-center gap-5">
            <Avatar className="h-16 w-16 ring-4 ring-white/20 shadow-md">
              <div className="bg-white h-full w-full flex items-center justify-center text-blue-600 text-xl font-bold rounded-full uppercase">
                {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
              </div>
            </Avatar>
            <div className="flex-1 text-white">
              <div className="flex items-center gap-3 flex-wrap">
                <DialogTitle className="text-2xl font-bold">
                  {user.name || user.email}
                </DialogTitle>
                <Badge 
                  className="bg-blue-700/30 text-white border-0 font-medium capitalize px-2.5"
                >
                  {user.role || 'Member'}
                </Badge>
                <div className="flex items-center gap-1.5 bg-emerald-500/20 px-2 py-0.5 rounded-full ml-auto">
                  <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-xs font-medium text-white">Online</span>
                </div>
              </div>
              <div className="flex items-center mt-1">
                <p className="text-sm text-blue-100">{user.email}</p>
                <div className="flex ml-auto gap-2">
                  {user.tasks > 0 && (
                    <div className="flex items-center gap-1 bg-white/10 rounded-full px-2.5 py-0.5 text-xs font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{user.tasks} Tasks</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col h-full overflow-hidden">
          {/* Improved tabs with clear distinction */}
          <div className="bg-gray-50 border-b px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <Tabs 
                defaultValue="history" 
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-auto"
              >
                <TabsList className="bg-white border border-gray-200 shadow-sm p-1 rounded-lg">
                  <TabsTrigger 
                    value="history"
                    className="flex items-center gap-1.5 px-5 py-2 rounded-md font-medium transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow"
                  >
                    <History className="w-4 h-4" />
                    Task History
                  </TabsTrigger>
                  <TabsTrigger 
                    value="analytics"
                    className="flex items-center gap-1.5 px-5 py-2 rounded-md font-medium transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow"
                  >
                    <LineChart className="w-4 h-4" />
                    Analytics
                  </TabsTrigger>
                </TabsList>
                <TabsContent 
                  value="history" 
                  className="hidden data-[state=active]:block mt-6"
                >
                  <div className="space-y-6 p-6 pb-8 overflow-auto max-h-[calc(100vh-300px)]">
                    {dateGroups.length > 0 ? (
                      dateGroups.map(dateStr => (
                        <div key={dateStr} className="space-y-4">
                          <div className="flex items-center">
                            <div className="flex-1 h-px bg-gray-200"></div>
                            <div className="px-4 py-1 bg-blue-50 rounded-full text-xs font-medium text-blue-700 mx-2 shadow-sm">
                              {formatDateHeader(dateStr)}
                            </div>
                            <div className="flex-1 h-px bg-gray-200"></div>
                          </div>
                          
                          <div className="space-y-4">
                            {groupedTasks[dateStr].map(task => {
                              const isCompleted = task.status === TASK_STATUS.COMPLETED;
                              const isRejected = task.status === TASK_STATUS.REJECTED;
                              
                              let statusColor = "border-blue-100 bg-blue-50/50";
                              if (isCompleted) statusColor = "border-green-100 bg-green-50/50";
                              if (isRejected) statusColor = "border-red-100 bg-red-50/50";
                              
                              return (
                                <div 
                                  key={task.id}
                                  className={`border ${statusColor} rounded-xl p-4 shadow-sm hover:shadow transition-all`}
                                >
                                  <div className="flex items-start">
                                    {/* Status icon */}
                                    <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                                      isCompleted
                                        ? 'bg-green-100 text-green-600 border border-green-200' 
                                        : isRejected
                                        ? 'bg-red-100 text-red-600 border border-red-200'
                                        : 'bg-blue-100 text-blue-600 border border-blue-200'
                                    }`}>
                                      {isCompleted ? (
                                        <CheckCheck className="w-5 h-5" />
                                      ) : isRejected ? (
                                        <X className="w-5 h-5" />
                                      ) : (
                                        <Clock className="w-5 h-5" />
                                      )}
                                    </div>
                                    
                                    {/* Task content */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                                        <h4 className="font-semibold text-gray-900">{task.title}</h4>
                                        <Badge className={`${getStatusColor(task.status)} text-xs px-2 py-1 shadow-sm`}>
                                          <div className="flex items-center gap-1.5">
                                            {isCompleted ? (
                                              <CheckCircle2 className="w-3.5 h-3.5" />
                                            ) : (
                                              <CircleDot className="w-3.5 h-3.5" />
                                            )}
                                            <span className="capitalize">{task.status}</span>
                                          </div>
                                        </Badge>
                                      </div>
                                      
                                      {task.description && (
                                        <p className="text-sm text-gray-600 mb-3">
                                          {task.description}
                                        </p>
                                      )}
                                      
                                      <div className="flex flex-wrap items-center gap-2.5">
                                        <span className="text-xs font-medium text-gray-500 bg-white px-2.5 py-1 rounded-full border shadow-sm">
                                          {format(task.createdAt.toDate ? task.createdAt.toDate() : new Date(task.createdAt), 'h:mm a')}
                                        </span>
                                        
                                        <div className="flex items-center gap-1 text-xs font-medium text-gray-600 bg-white px-2.5 py-1 rounded-full border shadow-sm">
                                          <Calendar className="w-3.5 h-3.5" />
                                          <span>Due: {task.deadline ? format(task.deadline.toDate ? task.deadline.toDate() : new Date(task.deadline), 'MMM d') : 'None'}</span>
                                        </div>
                                        
                                        {task.type && (
                                          <div className="text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100 shadow-sm">
                                            {task.type}
                                          </div>
                                        )}
                                        
                                        {task.completedAt && (
                                          <div className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-100 shadow-sm">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            <span>Completed: {format(task.completedAt.toDate ? task.completedAt.toDate() : new Date(task.completedAt), 'MMM d')}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-16">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-50 text-blue-400 mb-5 shadow-inner">
                          <History className="w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800">No task history</h3>
                        <p className="text-gray-500 max-w-sm mx-auto mt-2 text-sm">
                          {timeframe !== 'all' 
                            ? `No tasks found in the selected time period. Try selecting a different timeframe.` 
                            : `This user hasn't been assigned any tasks yet. Tasks will appear here once they're assigned.`
                          }
                        </p>
                        <Button
                          variant="outline" 
                          size="sm"
                          className="mt-5 bg-white border-gray-200 text-blue-600 hover:border-blue-200 shadow-sm"
                          onClick={() => setTimeframe('all')}
                        >
                          {timeframe !== 'all' ? 'View all time' : 'Refresh'}
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent 
                  value="analytics" 
                  className="hidden data-[state=active]:block mt-6"
                >
                  <div className="p-6 pb-8 overflow-auto max-h-[calc(100vh-300px)]">
                    {/* Performance Score Card */}
                    <Card className="p-6 border-0 shadow-md bg-gradient-to-br from-white to-blue-50/30 rounded-2xl mb-6">
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center">
                          <div className="bg-blue-100 rounded-full p-2 mr-3">
                            <BarChart3 className="w-5 h-5 text-blue-600" />
                          </div>
                          <h3 className="text-xl font-semibold text-gray-800">Performance Score</h3>
                        </div>
                        <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100 shadow-sm px-3 py-1">
                          All Time
                        </Badge>
                      </div>
                      
                      <div className="flex flex-col gap-6">
                        <div className="flex flex-col items-center justify-center w-full">
                          <div className="relative w-40 h-40">
                            <div className="absolute inset-0 flex items-center justify-center flex-col">
                              <span className={`text-5xl font-bold ${
                                parseInt(analytics.efficiency) >= 70 ? 'text-green-600' : 
                                parseInt(analytics.efficiency) >= 50 ? 'text-blue-600' : 'text-amber-500'
                              }`}>
                                {analytics.efficiency}%
                              </span>
                              <span className="text-sm text-gray-500 font-medium mt-1">Efficiency</span>
                            </div>
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                              <circle
                                className="text-gray-100"
                                strokeWidth="8"
                                stroke="currentColor"
                                fill="transparent"
                                r="42"
                                cx="50"
                                cy="50"
                              />
                              <circle
                                className={
                                  parseInt(analytics.efficiency) >= 70 ? 'text-green-500' : 
                                  parseInt(analytics.efficiency) >= 50 ? 'text-blue-500' : 'text-amber-500'
                                }
                                strokeWidth="8"
                                strokeDasharray={`${2 * Math.PI * 42}`}
                                strokeDashoffset={`${2 * Math.PI * 42 * (1 - analytics.efficiency / 100)}`}
                                strokeLinecap="round"
                                stroke="currentColor"
                                fill="transparent"
                                r="42"
                                cx="50"
                                cy="50"
                              />
                            </svg>
                          </div>
                          
                          <div className="mt-2 text-center">
                            <span className="text-sm text-gray-500">
                              {parseInt(analytics.efficiency) >= 80 ? 'Excellent Performance' : 
                              parseInt(analytics.efficiency) >= 60 ? 'Good Performance' : 
                              parseInt(analytics.efficiency) >= 40 ? 'Average Performance' : 'Needs Improvement'}
                            </span>
                          </div>
                          
                          <div className="w-full text-center mt-4">
                            <h4 className="text-sm font-medium text-gray-700">Task Performance Metrics</h4>
                            <div className="w-20 h-1 bg-blue-100 mx-auto mt-2 rounded-full"></div>
                          </div>
                        </div>
                        
                        <div className="w-full space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
                            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-500 mb-2">Completion Rate</span>
                                <span className={`text-2xl font-bold ${
                                  parseInt(analytics.completionRate) >= 70 ? 'text-green-600' : 
                                  parseInt(analytics.completionRate) >= 50 ? 'text-blue-600' : 'text-amber-500'
                                }`}>{analytics.completionRate}%</span>
                                
                                <Progress 
                                  value={analytics.completionRate} 
                                  className="h-2.5 bg-gray-100 mt-3" 
                                  indicatorClassName={`${
                                    parseInt(analytics.completionRate) >= 70 ? 'bg-green-500' : 
                                    parseInt(analytics.completionRate) >= 50 ? 'bg-blue-500' : 'bg-amber-500'
                                  }`}
                                />
                              </div>
                            </div>
                            
                            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-500 mb-2">Tasks</span>
                                <span className="text-2xl font-bold text-blue-600">{userTasks.length}</span>
                                
                                <div className="flex items-center gap-4 mt-3">
                                  <div className="flex items-center text-sm">
                                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                                    <span>{analytics.completed}</span>
                                  </div>
                                  <div className="flex items-center text-sm">
                                    <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                                    <span>{analytics.active}</span>
                                  </div>
                                  <div className="flex items-center text-sm">
                                    <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                                    <span>{analytics.overdue}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Task Status Breakdown */}
                          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                            <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                              <PieChart className="w-4 h-4 mr-1.5 text-gray-400" />
                              Task Status Breakdown
                            </h4>
                            
                            <div className="space-y-3">
                              <div className="flex items-center">
                                <div className="w-28 text-sm font-medium flex items-center">
                                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                                  Completed
                                </div>
                                <div className="flex-1">
                                  <div className="relative w-full h-7">
                                    <div className="absolute inset-0 bg-green-100 rounded-md"></div>
                                    <div 
                                      className="absolute inset-y-0 left-0 bg-green-500 rounded-md"
                                      style={{ width: `${analytics.completed / Math.max(1, userTasks.length) * 100}%` }}
                                    ></div>
                                    {analytics.completed > 0 && (
                                      <div className="absolute inset-0 flex items-center px-2 text-xs text-white font-medium">
                                        {Math.round(analytics.completed / Math.max(1, userTasks.length) * 100)}%
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="w-10 text-right text-sm font-medium">
                                  {analytics.completed}
                                </div>
                              </div>
                              
                              <div className="flex items-center">
                                <div className="w-28 text-sm font-medium flex items-center">
                                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                                  Active
                                </div>
                                <div className="flex-1">
                                  <div className="relative w-full h-7">
                                    <div className="absolute inset-0 bg-blue-100 rounded-md"></div>
                                    <div 
                                      className="absolute inset-y-0 left-0 bg-blue-500 rounded-md"
                                      style={{ width: `${analytics.active / Math.max(1, userTasks.length) * 100}%` }}
                                    ></div>
                                    {analytics.active > 0 && (
                                      <div className="absolute inset-0 flex items-center px-2 text-xs text-white font-medium">
                                        {Math.round(analytics.active / Math.max(1, userTasks.length) * 100)}%
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="w-10 text-right text-sm font-medium">
                                  {analytics.active}
                                </div>
                              </div>
                              
                              <div className="flex items-center">
                                <div className="w-28 text-sm font-medium flex items-center">
                                  <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                                  Overdue
                                </div>
                                <div className="flex-1">
                                  <div className="relative w-full h-7">
                                    <div className="absolute inset-0 bg-red-100 rounded-md"></div>
                                    <div 
                                      className="absolute inset-y-0 left-0 bg-red-500 rounded-md"
                                      style={{ width: `${analytics.overdue / Math.max(1, userTasks.length) * 100}%` }}
                                    ></div>
                                    {analytics.overdue > 0 && (
                                      <div className="absolute inset-0 flex items-center px-2 text-xs text-white font-medium">
                                        {Math.round(analytics.overdue / Math.max(1, userTasks.length) * 100)}%
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="w-10 text-right text-sm font-medium">
                                  {analytics.overdue}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                    
                    {/* Weekly Activity */}
                    <Card className="p-6 border-0 shadow-md bg-gradient-to-br from-white to-blue-50/30 rounded-2xl mb-6">
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center">
                          <div className="bg-emerald-100 rounded-full p-2 mr-3">
                            <ActivityIcon className="w-5 h-5 text-emerald-600" />
                          </div>
                          <h3 className="text-xl font-semibold text-gray-800">Weekly Activity</h3>
                        </div>
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm px-3 py-1">
                          Last 7 days
                        </Badge>
                      </div>
                      
                      <div className="h-52 flex items-end justify-between mt-5">
                        {analytics.weeklyCompletion.map((count, index) => {
                          const day = format(subDays(new Date(), 6 - index), 'EEE');
                          const today = format(new Date(), 'EEE');
                          const isToday = day === today;
                          const height = count > 0 ? Math.max(25, Math.min(100, count * 20)) : 4;
                          
                          // Color gradient based on activity
                          let bgColor = 'rgb(226 232 240)'; // Default light gray
                          if (count > 0) {
                            const intensity = Math.min(0.4 + (height / 100) * 0.6, 1);
                            bgColor = `rgba(16, 185, 129, ${intensity})`;
                          }
                          
                          return (
                            <div key={index} className="flex flex-col items-center group relative">
                              <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                {count} task{count !== 1 ? 's' : ''} completed
                              </div>
                              <div 
                                className={`w-12 rounded-t-lg shadow-sm ${isToday ? 'ring-2 ring-blue-300 ring-offset-2' : ''}`}
                                style={{ 
                                  height: `${height}px`,
                                  backgroundColor: bgColor
                                }}
                              />
                              <div className={`w-full text-center mt-2 ${isToday ? 'bg-blue-50 rounded-full px-2' : ''}`}>
                                <span className={`text-xs ${isToday ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>{day}</span>
                                <span className={`block text-sm font-medium ${count > 0 ? 'text-gray-700' : 'text-gray-400'}`}>{count}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between text-sm">
                          <div className="text-gray-500">
                            Total tasks completed this week: <span className="font-semibold text-blue-600">{analytics.weeklyCompletion.reduce((a, b) => a + b, 0)}</span>
                          </div>
                          {analytics.weeklyCompletion.reduce((a, b) => a + b, 0) > 0 && (
                            <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-3 py-0.5 rounded-full text-xs font-medium border border-emerald-100 shadow-sm">
                              <ArrowUp className="w-3 h-3" />
                              <span>Active</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="flex items-center gap-2">
                {activeTab === 'history' && (
                  <div className="flex items-center text-sm bg-white border border-gray-200 rounded-lg shadow-sm p-1">
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className={`px-3 py-1 h-auto rounded-md font-medium ${timeframe === 'day' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:text-gray-900'}`}
                      onClick={() => setTimeframe('day')}
                    >
                      24h
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className={`px-3 py-1 h-auto rounded-md font-medium ${timeframe === 'week' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:text-gray-900'}`}
                      onClick={() => setTimeframe('week')}
                    >
                      Week
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className={`px-3 py-1 h-auto rounded-md font-medium ${timeframe === 'month' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:text-gray-900'}`}
                      onClick={() => setTimeframe('month')}
                    >
                      Month
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className={`px-3 py-1 h-auto rounded-md font-medium ${timeframe === 'all' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:text-gray-900'}`}
                      onClick={() => setTimeframe('all')}
                    >
                      All
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-hidden">
            {/* TabsContent components are now inside Tabs component */}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
