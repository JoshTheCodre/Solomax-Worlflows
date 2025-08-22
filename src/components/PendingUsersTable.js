import { useEffect, useState } from 'react';
import useAuthStore from '@/lib/store';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';

export default function PendingUsersTable() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { fetchPendingUsers, pendingUsers, approveUser } = useAuthStore();

  useEffect(() => {
    const loadPendingUsers = async () => {
      try {
        setLoading(true);
        await fetchPendingUsers();
        setError(null);
      } catch (err) {
        console.error('Error loading pending users:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadPendingUsers();

    // Set up interval to refresh pending users list
    const interval = setInterval(loadPendingUsers, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [fetchPendingUsers]); // Include fetchPendingUsers in dependencies

  const handleApprove = async (userId) => {
    try {
      setLoading(true);
      const success = await store.approveUser(userId);
      if (success) {
        await store.fetchPendingUsers();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4 text-red-500">
        Error loading users: {error}
      </div>
    );
  }

  if (!pendingUsers?.length) {
    return <div className="text-center p-4 text-gray-500">No pending users</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pendingUsers.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{new Date(user.createdAt?.seconds * 1000).toLocaleDateString()}</TableCell>
              <TableCell>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleApprove(user.id)}
                >
                  Approve
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
