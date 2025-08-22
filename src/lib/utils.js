import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const TASK_STATUS = {
  ACTIVE: 'active',
  IN_PROGRESS: 'in_progress',
  PENDING_APPROVAL: 'pending_approval',
  COMPLETED: 'completed',
  REJECTED: 'rejected'
};

export const TASK_TYPES = {
  VOICE_RECAP_LONG: 'Voice Recap (Long)',
  SHORT_RECAPS: 'Short Recaps',
  JANE_STYLE: 'Jane Style',
  MOMENTS_SHORTS: 'Moments (Shorts)',
  TRANSFER: 'Transfer'
};

export const CONTENT_CHANNELS = {
  MAIN: 'ch1',
  VLOG: 'ch2',
  TUTORIAL: 'ch3'
};

export const MEDIA_TYPES = {
  V0: 'v0',
  DOCUMENT: 'document',
  CUT: 'cut'
};

export const TASK_PRIORITY = {
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low'
};

export const TEAM_MEMBERS = [
  'Merit',
  'Success',
  'Joshua',
  'Oluchi',
  'Ellen',
  'Ubani',
  'Humpany',
  'Joseph',
  'Sunday'
];

export const getStatusColor = (status) => {
  switch (status) {
    case TASK_STATUS.ACTIVE:
      return 'bg-yellow-500/10 text-yellow-500';
    case TASK_STATUS.IN_PROGRESS:
      return 'bg-blue-500/10 text-blue-500';
    case TASK_STATUS.PENDING_APPROVAL:
      return 'bg-purple-500/10 text-purple-500';
    case TASK_STATUS.COMPLETED:
      return 'bg-green-500/10 text-green-500';
    case TASK_STATUS.REJECTED:
      return 'bg-red-500/10 text-red-500';
    case 'due':
      return 'bg-orange-500/10 text-orange-500';
    default:
      return 'bg-gray-500/10 text-gray-500';
  }
};

export const getPriorityColor = (priority) => {
  switch (priority) {
    case TASK_PRIORITY.HIGH:
      return 'bg-red-500/10 text-red-500';
    case TASK_PRIORITY.MEDIUM:
      return 'bg-yellow-500/10 text-yellow-500';
    case TASK_PRIORITY.LOW:
      return 'bg-blue-500/10 text-blue-500';
    default:
      return 'bg-gray-500/10 text-gray-500';
  }
};

export const getFormattedStatus = (status, isDue = false) => {
  if (isDue && status !== TASK_STATUS.COMPLETED) {
    return 'Due';
  }
  
  switch (status) {
    case TASK_STATUS.ACTIVE:
      return 'Active';
    case TASK_STATUS.IN_PROGRESS:
      return 'In Progress';
    case TASK_STATUS.PENDING_APPROVAL:
      return 'Pending Review';
    case TASK_STATUS.COMPLETED:
      return 'Completed';
    case TASK_STATUS.REJECTED:
      return 'Rejected';
    case 'due':
      return 'Due';
    default:
      return 'Active';
  }
};
