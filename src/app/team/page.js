'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { UserDetailModal } from '@/components/UserDetailModal';
import { createTeamDataListener } from '@/lib/listeners';
import { cn } from '@/lib/utils';
import { PenSquare, ListTodo, UserCircle } from 'lucide-react';

export default function TeamPage() {
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    // Set up real-time listener for team data (users + task counts)
    const unsubscribe = createTeamDataListener((updatedTeamData) => {
      setTeamMembers(updatedTeamData);
    });

    // Cleanup on unmount
    return () => unsubscribe();
  }, []);
  
  const handleOpenUserDetail = (user) => {
    setSelectedUser(user);
    setIsDetailModalOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Team Members</h1>
            <p className="text-sm text-gray-500 mt-1">View and manage team member profiles and task assignments</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge 
              variant="outline" 
              className="px-3 py-1.5 text-sm bg-blue-50/50 border-blue-200 text-blue-700 font-medium"
            >
              {teamMembers.length} {teamMembers.length === 1 ? 'Member' : 'Members'}
            </Badge>
          </div>
        </div>

        <Card className="overflow-hidden border-gray-100 shadow-md rounded-xl">
          <div className="divide-y divide-gray-100">
            {teamMembers.map((member) => (
              <div 
                key={member.id} 
                className="flex items-center justify-between p-5 hover:bg-gray-50/80 transition-colors cursor-pointer"
                onClick={() => handleOpenUserDetail(member)}
              >
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <Avatar className="h-10 w-10 shadow-sm">
                      {member.photoURL ? (
                        <img 
                          src={member.photoURL} 
                          alt={member.name}
                          className="h-full w-full object-cover rounded-full"
                        />
                      ) : (
                        <div className={cn(
                          "h-full w-full flex items-center justify-center text-white font-medium rounded-full uppercase",
                          member.tasks > 5 ? "bg-blue-600" :
                          member.tasks > 2 ? "bg-indigo-600" : "bg-violet-600"
                        )}>
                          {member.name.split(' ').map(n => n[0].toUpperCase()).join('')}
                        </div>
                      )}
                    </Avatar>
                    <span className={cn(
                      "absolute -bottom-0.5 -right-0.5 block h-2.5 w-2.5 rounded-full border-2 border-white",
                      member.status === 'active' ? "bg-emerald-500" : "bg-gray-300"
                    )} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-medium text-gray-900">
                        {member.name}
                      </h3>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "capitalize text-xs px-2 py-0.5",
                          member.role === "admin" 
                            ? "bg-blue-50/50 text-blue-700 border-blue-200" 
                            : "bg-gray-50 text-gray-600 border-gray-200"
                        )}
                      >
                        {member.role}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 truncate mt-0.5">
                      {member.email}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  {member.activeTasks > 0 && (
                    <div className="flex flex-col items-center">
                      <div className="flex items-center text-emerald-600">
                        <PenSquare className="h-4 w-4 mr-1.5" />
                        <span className="text-lg font-semibold">{member.activeTasks}</span>
                      </div>
                      <span className="text-xs text-gray-500">Active</span>
                    </div>
                  )}
                  
                  <div className="flex flex-col items-center">
                    <div className="flex items-center text-blue-600">
                      <ListTodo className="h-4 w-4 mr-1.5" />
                      <span className="text-lg font-semibold">{member.tasks}</span>
                    </div>
                    <span className="text-xs text-gray-500">Total</span>
                  </div>
                  
                  <div className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                    <UserCircle className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
        
        {/* WhatsApp-style User Detail Modal */}
        {selectedUser && (
          <UserDetailModal 
            user={selectedUser}
            isOpen={isDetailModalOpen}
            onClose={() => setIsDetailModalOpen(false)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
