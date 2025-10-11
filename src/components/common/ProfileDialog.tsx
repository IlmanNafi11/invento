"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Mail, Briefcase, FileText, Calendar } from "lucide-react";
import { formatDate } from "@/utils/format";
import { getInitials } from "@/utils/format";
import { UpdateProfileDialog } from "./UpdateProfileDialog";
import type { Profile } from "@/types";

interface ProfileDialogProps {
  user: Profile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProfileUpdate?: () => void;
}

export function ProfileDialog({ user, open, onOpenChange, onProfileUpdate }: ProfileDialogProps) {
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);

  const handleUpdateClick = () => {
    onOpenChange(false);
    setUpdateDialogOpen(true);
  };

  const handleUpdateSuccess = () => {
    onProfileUpdate?.();
    setUpdateDialogOpen(false);
    onOpenChange(true);
  };

  const handleUpdateCancel = () => {
    setUpdateDialogOpen(false);
    onOpenChange(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-2">
        <VisuallyHidden.Root>
          <DialogTitle>Profil</DialogTitle>
        </VisuallyHidden.Root>
        <div className="relative">
          {/* Card background with image */}
          <Card className="h-24 bg-[url('/images/bg-profil.webp')] bg-cover bg-center rounded-xl border-0 mb-4" />

          {/* Avatar positioned to overlap */}
          <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-10">
            <Avatar className="w-20 h-20 border-4 border-white">
              <AvatarImage
                src={user?.foto_profil ? `${import.meta.env.VITE_API_BASE_URL.replace('/api/v1', '')}${user.foto_profil.startsWith('/') ? user.foto_profil : `/${user.foto_profil}`}` : undefined}
                alt={user?.name || "User"}
              />
              <AvatarFallback className="text-lg">
                {user?.name ? getInitials(user.name) : "U"}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* User name */}
          <div className="pt-12 pb-4 text-center">
            <h2 className="text-xl font-semibold">{user?.name || "User"}</h2>
          </div>

          {/* Role and Join Date Container */}
          <div className="flex items-center justify-center gap-2 pb-4">
            <span className="text-xs text-muted-foreground">{user?.role || "Role"}</span>
            <span className="text-xs text-muted-foreground">|</span>
            <span className="text-xs text-muted-foreground">
              Bergabung {user?.created_at ? formatDate(new Date(user.created_at)) : "N/A"}
            </span>
          </div>

          {/* Information Section */}
          <div className="px-6 pb-6 space-y-4">
            <Separator className="w-full" />
            <h3 className="text-lg font-medium">Informasi</h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Email</span>
                </div>
                <span className="text-sm">{user?.email || "email@example.com"}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Project</span>
                </div>
                <span className="text-sm">{user?.jumlah_project || 0}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Modul</span>
                </div>
                <span className="text-sm">{user?.jumlah_modul || 0}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Bergabung</span>
                </div>
                <span className="text-sm">
                  {user?.created_at ? formatDate(new Date(user.created_at)) : "N/A"}
                </span>
              </div>
            </div>

            <Separator className="w-full" />

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleUpdateClick}>
                Perbarui
              </Button>
              <Button onClick={() => onOpenChange(false)}>Tutup</Button>
            </div>
          </div>
        </div>
      </DialogContent>
      <UpdateProfileDialog
        profile={user}
        open={updateDialogOpen}
        onOpenChange={setUpdateDialogOpen}
        onSuccess={handleUpdateSuccess}
        onCancel={handleUpdateCancel}
      />
    </Dialog>
  );
}