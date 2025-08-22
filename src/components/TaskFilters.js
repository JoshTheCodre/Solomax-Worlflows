'use client';

import { useState, useEffect } from 'react';
import { 
  Filter, 
  ArrowUpDown, 
  Clock, 
  CalendarRange, 
  ArrowDown01, 
  ArrowUp01, 
  Star, 
  X,
  Briefcase,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import useTaskStore from '@/store/taskStore';
import useAuthStore from '@/lib/store';

export function TaskFilters({ hideSearch = false, compact = false }) {
  const { 
    setSortOrder, 
    sortOrder, 
    filterCriteria, 
    setFilterCriteria 
  } = useTaskStore();
  const { user } = useAuthStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState([]);
  
  // Update active filters display based on current criteria
  useEffect(() => {
    const updatedFilters = [];
    
    if (searchQuery) {
      updatedFilters.push({
        key: 'search',
        label: `Search: ${searchQuery}`,
      });
    }
    
    if (filterCriteria.priority) {
      updatedFilters.push({
        key: 'priority',
        label: `Priority: ${filterCriteria.priority}`,
      });
    }
    
    if (filterCriteria.status) {
      updatedFilters.push({
        key: 'status',
        label: `Status: ${filterCriteria.status}`,
      });
    }
    
    if (filterCriteria.type) {
      updatedFilters.push({
        key: 'type',
        label: `Type: ${filterCriteria.type}`,
      });
    }
    
    if (filterCriteria.assignee) {
      updatedFilters.push({
        key: 'assignee',
        label: `Assignee: ${filterCriteria.assignee === user?.email ? 'Me' : filterCriteria.assignee}`,
      });
    }
    
    setActiveFilters(updatedFilters);
  }, [searchQuery, filterCriteria, user]);
  
  // Update filter criteria when search changes
  useEffect(() => {
    const newCriteria = { ...filterCriteria };
    
    if (searchQuery) {
      newCriteria.search = searchQuery;
    } else {
      delete newCriteria.search;
    }
    
    setFilterCriteria(newCriteria);
  }, [searchQuery, setFilterCriteria]);
  
  const clearFilter = (key) => {
    const newCriteria = { ...filterCriteria };
    delete newCriteria[key];
    setFilterCriteria(newCriteria);
    
    if (key === 'search') {
      setSearchQuery('');
    }
  };
  
  const clearAllFilters = () => {
    setFilterCriteria({});
    setSearchQuery('');
  };
  
  const setFilter = (key, value) => {
    setFilterCriteria({
      ...filterCriteria,
      [key]: value
    });
  };
  
  return (
    <div className={cn(
      compact ? "flex items-center gap-3" : "mb-4 space-y-3"
    )}>
      <div className={cn(
        "flex items-center", 
        compact ? "gap-2" : "flex-wrap gap-3"
      )}>
        {/* Search Input - only shown when not hidden */}
        {!hideSearch && (
          <div className="relative flex-1 min-w-[200px]">
            <Input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-3 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchQuery('')}
                className="absolute right-0 top-0 h-full w-10 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {/* Filter Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-10 gap-2">
              <Filter className="h-4 w-4" />
              <span className={compact ? "hidden" : "hidden sm:inline"}>Filter</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Filter by</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {/* Status Filter */}
            <DropdownMenuLabel className="text-xs font-normal text-gray-500 pt-1">Status</DropdownMenuLabel>
            {['active', 'completed', 'pending'].map(status => (
              <DropdownMenuItem key={status} onClick={() => setFilter('status', status)}>
                <div className={cn(
                  "h-2 w-2 rounded-full mr-2",
                  status === 'active' ? "bg-green-500" :
                  status === 'completed' ? "bg-blue-500" :
                  "bg-amber-500"
                )} />
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            
            {/* Priority Filter */}
            <DropdownMenuLabel className="text-xs font-normal text-gray-500 pt-1">Priority</DropdownMenuLabel>
            {['high', 'medium', 'low'].map(priority => (
              <DropdownMenuItem key={priority} onClick={() => setFilter('priority', priority)}>
                <div className={cn(
                  "h-2 w-2 rounded-full mr-2",
                  priority === 'high' ? "bg-red-500" :
                  priority === 'medium' ? "bg-orange-500" :
                  "bg-green-500"
                )} />
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            
            {/* Type Filter */}
            <DropdownMenuLabel className="text-xs font-normal text-gray-500 pt-1">Type</DropdownMenuLabel>
            {['feature', 'bug', 'enhancement', 'documentation'].map(type => (
              <DropdownMenuItem key={type} onClick={() => setFilter('type', type)}>
                <Briefcase className="h-4 w-4 mr-2" />
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            
            {/* Assignee Filter */}
            <DropdownMenuLabel className="text-xs font-normal text-gray-500 pt-1">Assignee</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setFilter('assignee', user?.email)}>
              <User className="h-4 w-4 mr-2" />
              Assigned to me
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Sort Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-10 gap-2">
              <ArrowUpDown className="h-4 w-4" />
              <span className={compact ? "hidden" : "hidden sm:inline"}>Sort</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => setSortOrder('newest')}
              className={sortOrder === 'newest' ? 'bg-gray-100' : ''}
            >
              <Clock className="h-4 w-4 mr-2" />
              Newest first
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setSortOrder('oldest')}
              className={sortOrder === 'oldest' ? 'bg-gray-100' : ''}
            >
              <Clock className="h-4 w-4 mr-2" />
              Oldest first
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setSortOrder('deadline')}
              className={sortOrder === 'deadline' ? 'bg-gray-100' : ''}
            >
              <CalendarRange className="h-4 w-4 mr-2" />
              Due date
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setSortOrder('priority')}
              className={sortOrder === 'priority' ? 'bg-gray-100' : ''}
            >
              <Star className="h-4 w-4 mr-2" />
              Priority
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setSortOrder('alphabetical')}
              className={sortOrder === 'alphabetical' ? 'bg-gray-100' : ''}
            >
              <ArrowDown01 className="h-4 w-4 mr-2" />
              A-Z
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className={cn(
          "flex items-center", 
          compact ? "gap-1" : "flex-wrap gap-2"
        )}>
          {activeFilters.map((filter) => (
            <Badge 
              key={filter.key} 
              variant="outline" 
              className={cn(
                "pl-2 pr-1 flex items-center gap-1 bg-gray-50",
                compact ? "py-0 text-xs" : "py-1"
              )}
            >
              {filter.label}
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 rounded-full hover:bg-gray-200"
                onClick={() => clearFilter(filter.key)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "text-xs text-gray-500 hover:text-gray-700",
              compact ? "h-6 px-1" : "h-7"
            )}
            onClick={clearAllFilters}
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
