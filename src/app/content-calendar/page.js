'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Video, 
  Clock, 
  Users,
  BarChart3,
  TrendingUp,
  Eye,
  Heart,
  MessageSquare
} from 'lucide-react';

const SAMPLE_CONTENT = [
  {
    id: 1,
    title: "Epic Gaming Montage - Best Moments 2024",
    channel: "EpicToons",
    publishDate: "2024-08-30",
    status: "scheduled",
    type: "video",
    thumbnail: "/api/placeholder/300/200",
    views: 0,
    likes: 0,
    comments: 0,
    duration: "10:45"
  },
  {
    id: 2,
    title: "Animation Tutorial: Character Design Basics",
    channel: "Alpha Recap",
    publishDate: "2024-08-29",
    status: "published",
    type: "video",
    thumbnail: "/api/placeholder/300/200",
    views: 15420,
    likes: 892,
    comments: 156,
    duration: "15:30"
  },
  {
    id: 3,
    title: "Top 10 Anime Moments That Made Us Cry",
    channel: "Super Recap",
    publishDate: "2024-08-31",
    status: "draft",
    type: "video",
    thumbnail: "/api/placeholder/300/200",
    views: 0,
    likes: 0,
    comments: 0,
    duration: "12:20"
  },
  {
    id: 4,
    title: "Quick Cooking Tips for Busy Students",
    channel: "Animation Fastfood",
    publishDate: "2024-09-01",
    status: "scheduled",
    type: "video",
    thumbnail: "/api/placeholder/300/200",
    views: 0,
    likes: 0,
    comments: 0,
    duration: "8:15"
  },
  {
    id: 5,
    title: "Behind the Scenes: Our Animation Process",
    channel: "Beta Recap",
    publishDate: "2024-08-28",
    status: "published",
    type: "video",
    thumbnail: "/api/placeholder/300/200",
    views: 8930,
    likes: 445,
    comments: 89,
    duration: "18:45"
  }
];

const getStatusColor = (status) => {
  switch (status) {
    case 'published':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'scheduled':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'draft':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getChannelColor = (channel) => {
  const colors = {
    'EpicToons': 'bg-purple-100 text-purple-800',
    'Alpha Recap': 'bg-blue-100 text-blue-800',
    'Super Recap': 'bg-red-100 text-red-800',
    'Animation Fastfood': 'bg-green-100 text-green-800',
    'Beta Recap': 'bg-amber-100 text-amber-800'
  };
  return colors[channel] || 'bg-gray-100 text-gray-800';
};

export default function ContentCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedView, setSelectedView] = useState('calendar');
  const [content, setContent] = useState(SAMPLE_CONTENT);

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const getContentForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return content.filter(item => item.publishDate === dateStr);
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Content Calendar</h1>
            <p className="text-gray-600 mt-1">Plan and schedule your content across all channels</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Schedule Content
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Views</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Eye className="w-4 h-4 text-blue-500 mr-2" />
                <span className="text-2xl font-bold">24.4K</span>
                <span className="text-sm text-green-600 ml-2">+12%</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Likes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Heart className="w-4 h-4 text-red-500 mr-2" />
                <span className="text-2xl font-bold">1.3K</span>
                <span className="text-sm text-green-600 ml-2">+8%</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <MessageSquare className="w-4 h-4 text-green-500 mr-2" />
                <span className="text-2xl font-bold">245</span>
                <span className="text-sm text-green-600 ml-2">+15%</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Scheduled</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Clock className="w-4 h-4 text-orange-500 mr-2" />
                <span className="text-2xl font-bold">{content.filter(c => c.status === 'scheduled').length}</span>
                <span className="text-sm text-blue-600 ml-2">This week</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="calendar" value={selectedView} onValueChange={setSelectedView}>
          <TabsList className="grid w-full grid-cols-3 lg:w-96">
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Calendar View
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              List View
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Calendar View */}
          <TabsContent value="calendar" className="space-y-4">
            <Card className="border border-gray-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigateMonth(-1)}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                      Today
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigateMonth(1)}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {getCalendarDays().map((date, index) => {
                    const dayContent = getContentForDate(date);
                    const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                    const isToday = date.toDateString() === new Date().toDateString();
                    
                    return (
                      <div
                        key={index}
                        className={`min-h-24 p-2 border border-gray-100 rounded-lg ${
                          isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                        } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                      >
                        <div className={`text-sm font-medium mb-1 ${
                          isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                        } ${isToday ? 'text-blue-600' : ''}`}>
                          {date.getDate()}
                        </div>
                        <div className="space-y-1">
                          {dayContent.map(item => (
                            <div
                              key={item.id}
                              className={`text-xs p-1 rounded truncate ${getChannelColor(item.channel)}`}
                              title={item.title}
                            >
                              {item.title}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* List View */}
          <TabsContent value="list" className="space-y-4">
            <div className="grid gap-4">
              {content.map(item => (
                <Card key={item.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Video className="w-6 h-6 text-gray-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className={getChannelColor(item.channel)}>
                                {item.channel}
                              </Badge>
                              <Badge variant="outline" className={getStatusColor(item.status)}>
                                {item.status}
                              </Badge>
                              <span className="text-sm text-gray-500">{item.duration}</span>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">{item.publishDate}</div>
                        </div>
                        {item.status === 'published' && (
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              {formatNumber(item.views)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Heart className="w-4 h-4" />
                              {formatNumber(item.likes)}
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="w-4 h-4" />
                              {formatNumber(item.comments)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Analytics View */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle>Performance by Channel</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {['EpicToons', 'Alpha Recap', 'Super Recap', 'Animation Fastfood', 'Beta Recap'].map(channel => {
                      const channelContent = content.filter(c => c.channel === channel && c.status === 'published');
                      const totalViews = channelContent.reduce((sum, c) => sum + c.views, 0);
                      
                      return (
                        <div key={channel} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${getChannelColor(channel).split(' ')[0]}`}></div>
                            <span className="font-medium">{channel}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{formatNumber(totalViews)}</div>
                            <div className="text-sm text-gray-500">{channelContent.length} videos</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle>Upcoming Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {content
                      .filter(c => c.status === 'scheduled')
                      .sort((a, b) => new Date(a.publishDate) - new Date(b.publishDate))
                      .map(item => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <div>
                            <div className="font-medium text-sm">{item.title}</div>
                            <div className="text-xs text-gray-600">{item.channel}</div>
                          </div>
                          <div className="text-sm font-medium text-blue-600">
                            {new Date(item.publishDate).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
