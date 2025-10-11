"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
interface ProfileDialogProps {
  user: { email: string; role: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileDialog({ user, open, onOpenChange }: ProfileDialogProps) {

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Profil</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">
              Email
            </Label>
            <Input
              id="email"
              value={user?.email || 'admin@invento.com'}
              disabled
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">
              Role
            </Label>
            <Input
              id="role"
              value={user?.role || 'Admin'}
              disabled
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>Tutup</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}