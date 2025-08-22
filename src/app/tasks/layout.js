'use client';

import DashboardLayout from '@/components/DashboardLayout';

export default function TasksLayout({ children }) {
  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
}
