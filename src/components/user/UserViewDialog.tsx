import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { UserFileTable } from './UserFileTable';
import type { UserItem, UserFile } from '@/types';

interface UserViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserItem | null;
  files: UserFile[];
  loading?: boolean;
  canDownload: boolean;
  onDownloadFile: (file: UserFile) => void;
  onBulkDownload: (files: UserFile[]) => void;
}

export function UserViewDialog({
  open,
  onOpenChange,
  user,
  files,
  loading = false,
  canDownload,
  onDownloadFile,
  onBulkDownload,
}: UserViewDialogProps) {
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Detail User</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Email</Label>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <div>
            <Label>Role</Label>
            <p className="text-sm text-muted-foreground">{user.role.name}</p>
          </div>
          <div>
            <div className="mt-2">
              <UserFileTable
                files={files}
                loading={loading}
                canDownload={canDownload}
                onDownload={onDownloadFile}
                onBulkDownload={onBulkDownload}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
