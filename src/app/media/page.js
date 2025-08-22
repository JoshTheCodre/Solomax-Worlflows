'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { MediaLibrary } from '@/components/MediaLibrary';

export default function MediaPage() {
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-6">Media Library</h1>
      <MediaLibrary />
    </DashboardLayout>
  );
}
