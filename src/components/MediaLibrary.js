'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MEDIA_TYPES } from '@/lib/utils';

export function MediaLibrary({ onSelect }) {
  const [media, setMedia] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(MEDIA_TYPES.V0);

  useEffect(() => {
    const q = query(collection(db, 'media'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const mediaData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMedia(mediaData);
    });

    return () => unsubscribe();
  }, []);

  const filteredMedia = media.filter(item => 
    item.type === activeTab && 
    (item.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
     item.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      // Here you would normally upload to Cloudinary first
      // For now, we'll just add to Firestore
      await addDoc(collection(db, 'media'), {
        type: activeTab,
        filename: file.name,
        uploadedBy: 'Current User', // Replace with actual user
        url: 'https://placeholder.url', // Replace with Cloudinary URL
        createdAt: new Date()
      });
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          type="text"
          placeholder="Search media..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <Input
          type="file"
          onChange={handleFileUpload}
          className="max-w-xs"
        />
      </div>

      <Tabs defaultValue={MEDIA_TYPES.V0} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value={MEDIA_TYPES.V0}>V0</TabsTrigger>
          <TabsTrigger value={MEDIA_TYPES.DOCUMENT}>Documents</TabsTrigger>
          <TabsTrigger value={MEDIA_TYPES.CUT}>Cuts</TabsTrigger>
        </TabsList>

        {Object.values(MEDIA_TYPES).map((type) => (
          <TabsContent key={type} value={type} className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredMedia.map((item) => (
                <Card key={item.id} className="p-4 cursor-pointer hover:bg-gray-50" onClick={() => onSelect?.(item)}>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate">{item.filename}</span>
                      <span className="text-sm text-gray-500">{type}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      Uploaded by {item.uploadedBy}
                    </div>
                    {item.type === MEDIA_TYPES.V0 && (
                      <div className="aspect-video bg-gray-100 rounded-md">
                        {/* Video preview would go here */}
                      </div>
                    )}
                    {item.type === MEDIA_TYPES.DOCUMENT && (
                      <div className="h-20 bg-gray-100 rounded-md flex items-center justify-center">
                        {/* Document preview would go here */}
                        📄 {item.filename}
                      </div>
                    )}
                    {item.type === MEDIA_TYPES.CUT && (
                      <div className="aspect-video bg-gray-100 rounded-md">
                        {/* Cut preview would go here */}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
