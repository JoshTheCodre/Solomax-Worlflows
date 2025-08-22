'use client';

import { useState, useEffect, useRef } from 'react';
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
import { cn, TASK_TYPES, TASK_STATUS, TASK_PRIORITY } from '@/lib/utils';
import useTaskStore from '@/store/taskStore';
import useAuthStore from '@/lib/store';

export function TaskFilters({ hideSearch = false, compact = false, onFilterChange }) {
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
    
    if (filterCriteria.due) {
      updatedFilters.push({
        key: 'due',
        label: 'Due tasks',
      });
    }
    
    setActiveFilters(updatedFilters);
  }, [searchQuery, filterCriteria, user]);
  
  // Use a ref to store the latest onFilterChange callback
  const onFilterChangeRef = useRef(onFilterChange);
  
  // Update the ref whenever onFilterChange changes
  useEffect(() => {
    onFilterChangeRef.current = onFilterChange;
  }, [onFilterChange]);
  
  // Update filter criteria when search changes
  useEffect(() => {
    const newCriteria = { ...filterCriteria };
    
    if (searchQuery) {
      newCriteria.search = searchQuery;
    } else {
      delete newCriteria.search;
    }
    
    setFilterCriteria(newCriteria);
    
    // Call the external handler if provided using the ref
    if (onFilterChangeRef.current) {
      onFilterChangeRef.current(newCriteria);
    }
  }, [searchQuery, setFilterCriteria]);
  
  const clearFilter = (key) => {
    const newCriteria = { ...filterCriteria };
    delete newCriteria[key];
    setFilterCriteria(newCriteria);
    
    if (key === 'search') {
      setSearchQuery('');
    }
    
    // Call the external handler if provided using the ref
    if (onFilterChangeRef.current) {
      onFilterChangeRef.current(newCriteria);
    }
  };
  
  const clearAllFilters = () => {
    setFilterCriteria({});
    setSearchQuery('');
    
    // Call the external handler if provided using the ref
    if (onFilterChangeRef.current) {
      onFilterChangeRef.current({});
    }
  };
  
  const setFilter = (key, value) => {
    const newFilters = {
      ...filterCriteria,
      [key]: value
    };
    
    setFilterCriteria(newFilters);
    
    // Call the external handler if provided using the ref
    if (onFilterChangeRef.current) {
      onFilterChangeRef.current(newFilters);
    }
  };
  
  // Handle sort order changes with logging
  const handleSortOrderChange = (order) => {
    console.log(`Changing sort order to: ${order}`);
    setSortOrder(order);
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
            {[
              { value: TASK_STATUS.ACTIVE, label: 'Active' },
              { value: TASK_STATUS.IN_PROGRESS, label: 'In Progress' },
              { value: TASK_STATUS.COMPLETED, label: 'Completed' },
              { value: TASK_STATUS.PENDING_APPROVAL, label: 'Pending Review' }
            ].map(status => (
              <DropdownMenuItem key={status.value} onClick={() => setFilter('status', status.value)}>
                <div className={cn(
                  "h-2 w-2 rounded-full mr-2",
                  status.value === TASK_STATUS.ACTIVE ? "bg-green-500" :
                  status.value === TASK_STATUS.COMPLETED ? "bg-blue-500" :
                  status.value === TASK_STATUS.PENDING_APPROVAL ? "bg-purple-500" :
                  status.value === TASK_STATUS.IN_PROGRESS ? "bg-orange-500" :
                  "bg-amber-500"
                )} />
                {status.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            
            {/* Priority Filter */}
            <DropdownMenuLabel className="text-xs font-normal text-gray-500 pt-1">Priority</DropdownMenuLabel>
            {Object.values(TASK_PRIORITY).map(priority => (
              <DropdownMenuItem key={priority} onClick={() => setFilter('priority', priority)}>
                <div className={cn(
                  "h-2 w-2 rounded-full mr-2",
                  priority.toLowerCase() === 'high' ? "bg-red-500" :
                  priority.toLowerCase() === 'medium' ? "bg-orange-500" :
                  "bg-green-500"
                )} />
                {priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase()}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            
            {/* Type Filter */}
            <DropdownMenuLabel className="text-xs font-normal text-gray-500 pt-1">Type</DropdownMenuLabel>
            {Object.values(TASK_TYPES).map(type => (
              <DropdownMenuItem key={type} onClick={() => setFilter('type', type)}>
                <Briefcase className="h-4 w-4 mr-2" />
                {type}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            
            {/* Assignee Filter */}
            <DropdownMenuLabel className="text-xs font-normal text-gray-500 pt-1">Assignee</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setFilter('assignee', user?.email)}>
              <User className="h-4 w-4 mr-2" />
              Assigned to me
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            {/* Special Filters */}
            <DropdownMenuLabel className="text-xs font-normal text-gray-500 pt-1">Special Filters</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setFilter('due', true)}>
              <Clock className="h-4 w-4 mr-2 text-orange-500" />
              Due Tasks
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Sort Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className={`h-10 gap-2 ${sortOrder ? 'bg-blue-50 border-blue-200 text-blue-600' : ''}`}>
              <ArrowUpDown className="h-4 w-4" />
              <span className={compact ? "hidden" : "hidden sm:inline"}>
                {sortOrder ? 
                  `Sort: ${sortOrder.charAt(0).toUpperCase() + sortOrder.slice(1)}` : 
                  "Sort"}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => handleSortOrderChange('newest')}
              className={sortOrder === 'newest' ? 'bg-blue-50 text-blue-700 font-medium' : ''}
            >
              <Clock className={`h-4 w-4 mr-2 ${sortOrder === 'newest' ? 'text-blue-500' : ''}`} />
              Newest first
              {sortOrder === 'newest' && <span className="ml-2 text-blue-500">✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleSortOrderChange('oldest')}
              className={sortOrder === 'oldest' ? 'bg-blue-50 text-blue-700 font-medium' : ''}
            >
              <Clock className={`h-4 w-4 mr-2 ${sortOrder === 'oldest' ? 'text-blue-500' : ''}`} />
              Oldest first
              {sortOrder === 'oldest' && <span className="ml-2 text-blue-500">✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleSortOrderChange('deadline')}
              className={sortOrder === 'deadline' ? 'bg-blue-50 text-blue-700 font-medium' : ''}
            >
              <CalendarRange className={`h-4 w-4 mr-2 ${sortOrder === 'deadline' ? 'text-blue-500' : ''}`} />
              Due date
              {sortOrder === 'deadline' && <span className="ml-2 text-blue-500">✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleSortOrderChange('priority')}
              className={sortOrder === 'priority' ? 'bg-blue-50 text-blue-700 font-medium' : ''}
            >
              <Star className={`h-4 w-4 mr-2 ${sortOrder === 'priority' ? 'text-blue-500' : ''}`} />
              Priority
              {sortOrder === 'priority' && <span className="ml-2 text-blue-500">✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleSortOrderChange('alphabetical')}
              className={sortOrder === 'alphabetical' ? 'bg-blue-50 text-blue-700 font-medium' : ''}
            >
              <ArrowDown01 className={`h-4 w-4 mr-2 ${sortOrder === 'alphabetical' ? 'text-blue-500' : ''}`} />
              A-Z
              {sortOrder === 'alphabetical' && <span className="ml-2 text-blue-500">✓</span>}
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
