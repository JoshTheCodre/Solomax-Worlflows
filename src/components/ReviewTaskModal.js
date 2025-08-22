'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import useTaskStore from '@/store/taskStore';
import useAuthStore from '@/lib/store';
import { toast } from '@/components/Toast';
import { CheckCircle2 } from 'lucide-react';

export function ReviewTaskModal({ task, onClose, onSubmit }) {
  const isOpen = !!task;
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { requestReview } = useTaskStore();
  const { user } = useAuthStore();

  const handleSubmit = async () => {
    if (!task) return;
    
    setIsSubmitting(true);
    
    try {
      await onSubmit(task.id, {
        notes,
        requestedBy: user?.email,
      });
      resetForm();
    } catch (error) {
      console.error('Error requesting review:', error);
      toast.error('Error', 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setNotes('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        resetForm();
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-blue-500" />
            Request Task Review
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          {task && (
            <div>
              <h3 className="font-medium text-lg">{task.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{task.description || 'No description'}</p>
            </div>
          )}
          
          <div className="space-y-2">
            <label htmlFor="notes" className="text-sm font-medium">
              Review Notes
            </label>
            <Textarea
              id="notes"
              placeholder="Provide details about what should be reviewed..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[120px]"
            />
            <p className="text-xs text-gray-500">
              Include any information that would help with the review process.
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit for Review'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
