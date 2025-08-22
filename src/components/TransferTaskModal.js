'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, Send } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function TransferTaskModal({ open, onClose, onTransfer, task, currentAssignee }) {
  const [newAssignee, setNewAssignee] = useState('');
  const [transferNote, setTransferNote] = useState('');
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const q = query(
          collection(db, 'users'),
          where('role', '==', 'user')
        );
        const querySnapshot = await getDocs(q);
        const userData = querySnapshot.docs.map(doc => ({
          email: doc.data().email,
          displayName: doc.data().displayName || doc.data().email
        }));
        setUsers(userData);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    if (open) {
      fetchUsers();
    }
  }, [open]);

  const handleTransfer = () => {
    onTransfer({
      newAssignee,
      transferNote,
      previousAssignee: currentAssignee,
      transferredAt: new Date(),
    });
    setNewAssignee('');
    setTransferNote('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-3">
            Transfer Task
            <div className="h-px flex-1 bg-gray-200" />
          </DialogTitle>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          {/* Current and New Assignee Section */}
          <div className="flex items-center gap-4">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium text-gray-700">Current Assignee</label>
              <div className="p-3 rounded-lg bg-gray-50 border text-gray-600">
                {currentAssignee}
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400 mt-8" />
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium text-gray-700">New Assignee</label>
              <Select value={newAssignee} onValueChange={setNewAssignee}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  {users
                    .filter(user => user.email !== currentAssignee)
                    .map((user) => (
                      <SelectItem key={user.email} value={user.email}>
                        {user.displayName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Transfer Note Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Transfer Note</label>
            <Textarea
              placeholder="Add a note about this transfer..."
              value={transferNote}
              onChange={(e) => setTransferNote(e.target.value)}
              className="h-24 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleTransfer}
              disabled={!newAssignee}
              className="gap-2 bg-black hover:bg-gray-900 text-white"
            >
              <Send className="h-4 w-4" />
              Transfer Task
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
