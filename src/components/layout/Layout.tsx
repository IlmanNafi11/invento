"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Outlet } from "react-router-dom";
import { toast } from "sonner";
import {
  SidebarProvider,
} from "@/components/ui/sidebar";
import { useAppSelector } from "@/hooks/useAppSelector";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { usePermissions } from "@/hooks/usePermissions";
import { useIsMobile } from "@/hooks/use-mobile";
import { useProfile } from "@/hooks/useProfile";
import { setSidebarOpen } from "@/lib/sidebarSlice";
import { logout } from "@/lib/authSlice";
import { ProfileDialog } from "@/components/common/ProfileDialog";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";

export default function Layout() {
  const isOpen = useAppSelector((state) => state.sidebar.open);
  const currentUser = useAppSelector((state) => state.auth.user);
  const { profile: userProfile, refreshProfile } = useProfile();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const isMobile = useIsMobile();
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = async () => {
    await dispatch(logout());
    toast.success('Berhasil logout');
    navigate('/login', { replace: true });
  };

  const handleProfileUpdate = () => {
    refreshProfile();
  };

  const hasModulRead = hasPermission('modul', 'read');
  const hasProjectRead = hasPermission('Project', 'read');
  const hasUserRead = hasPermission('user', 'read');
  const hasRoleRead = hasPermission('Role', 'read');
  const hasPermissionRead = hasPermission('Permission', 'read');

  return (
    <SidebarProvider open={isOpen} onOpenChange={(open) => dispatch(setSidebarOpen(open))}>
      <AppSidebar
        userProfile={userProfile}
        currentUserName={currentUser?.name || currentUser?.email || 'Admin'}
        onProfileClick={() => setProfileOpen(true)}
        onLogoutClick={handleLogout}
        hasModulRead={hasModulRead}
        hasProjectRead={hasProjectRead}
        hasUserRead={hasUserRead}
        hasRoleRead={hasRoleRead}
        hasPermissionRead={hasPermissionRead}
      />
      <main className="flex flex-1 flex-col h-screen overflow-hidden">
        <AppHeader
          userProfile={userProfile}
          currentUserName={currentUser?.name || currentUser?.email || 'Admin'}
          isMobile={isMobile}
          onProfileClick={() => setProfileOpen(true)}
          onLogoutClick={handleLogout}
        />
        <div className="flex-1 p-4 md:p-6 overflow-hidden">
          <div className="h-full w-full overflow-auto">
            <Outlet />
          </div>
        </div>
      </main>
      <ProfileDialog
        user={userProfile}
        open={profileOpen}
        onOpenChange={setProfileOpen}
        onProfileUpdate={handleProfileUpdate}
      />
    </SidebarProvider>
  );
}