'use client';

import DashboardLayout from '@/components/DashboardLayout';

export default function AdminDashboardLayout({ children }) {
  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
}
