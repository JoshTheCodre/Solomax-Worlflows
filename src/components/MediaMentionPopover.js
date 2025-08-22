'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card } from '@/components/ui/card';

export function MediaMentionPopover({ type, searchText, onSelect, className }) {
  const [media, setMedia] = useState([]);

  useEffect(() => {
    if (!searchText) return;

    const q = query(
      collection(db, 'media'),
      where('type', '==', type)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const mediaData = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(item => 
          item.filename.toLowerCase().includes(searchText.toLowerCase())
        )
        .slice(0, 5); // Limit to 5 results

      setMedia(mediaData);
    });

    return () => unsubscribe();
  }, [type, searchText]);

  if (media.length === 0) return null;

  return (
    <Card className={`p-2 space-y-2 max-h-60 overflow-y-auto ${className}`}>
      {media.map((item) => (
        <div
          key={item.id}
          className="p-2 hover:bg-gray-50 cursor-pointer rounded-md"
          onClick={() => onSelect(item)}
        >
          <div className="flex items-center gap-2">
            {item.type === 'v0' && <span>🎥</span>}
            {item.type === 'document' && <span>📄</span>}
            {item.type === 'cut' && <span>✂️</span>}
            <span className="truncate">{item.filename}</span>
          </div>
        </div>
      ))}
    </Card>
  );
}
