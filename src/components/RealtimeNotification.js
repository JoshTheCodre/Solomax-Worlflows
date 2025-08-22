'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Wifi } from 'lucide-react';

export function RealtimeNotification({ show, message = "Data updated" }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!visible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
      <Badge 
        variant="outline" 
        className="bg-green-50 text-green-700 border-green-200 px-3 py-2 flex items-center gap-2 shadow-md"
      >
        <Wifi className="w-4 h-4" />
        {message}
        <CheckCircle className="w-4 h-4" />
      </Badge>
    </div>
  );
}
