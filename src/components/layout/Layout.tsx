"use client";

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Outlet } from "react-router-dom";
import { Home, FileText, Briefcase, Users, Shield, User, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useAppSelector } from "@/hooks/useAppSelector";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { usePermissions } from "@/hooks/usePermissions";
import { useIsMobile } from "@/hooks/use-mobile";
import { useProfile } from "@/hooks/useProfile";
import { setSidebarOpen } from "@/lib/sidebarSlice";
import { logout } from "@/lib/authSlice";
import { ProfileDialog } from "@/components/common/ProfileDialog";
import { getInitials } from "@/utils/format";
import { getProfileImageUrl } from "@/utils/profileUtils";
import { authAPI } from "@/lib/auth";

export default function Layout() {
  const isOpen = useAppSelector((state) => state.sidebar.open);
  const currentUser = useAppSelector((state) => state.auth.user);
  const { profile: userProfile, refreshProfile } = useProfile();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const isMobile = useIsMobile();
  const [profileOpen, setProfileOpen] = useState(false);
  const [shouldNavigateToLogin, setShouldNavigateToLogin] = useState(false);

  const handleLogout = async () => {
    await authAPI.logout();

    dispatch(logout());
    toast.success('Berhasil logout');

    setShouldNavigateToLogin(true);
  };

  useEffect(() => {
    if (shouldNavigateToLogin) {
      navigate('/login');
      setShouldNavigateToLogin(false);
    }
  }, [shouldNavigateToLogin, navigate]);

  const handleProfileUpdate = () => {
    refreshProfile();
  };

  const hasModulRead = hasPermission('modul', 'read');
  const hasProjectRead = hasPermission('Project', 'read');
  const hasUserRead = hasPermission('user', 'read');
  const hasRoleRead = hasPermission('Role', 'read');
  const hasPermissionRead = hasPermission('Permission', 'read');

  const hasFileManagerAccess = hasModulRead || hasProjectRead;
  const hasUserManagementAccess = hasUserRead || (hasRoleRead && hasPermissionRead);


  const sidebarContent = (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 border-b">
        <div className="flex items-center justify-between px-2 group-data-[collapsible=icon]:justify-center h-full">
          <h2 className="text-lg font-semibold group-data-[collapsible=icon]:hidden">Invento</h2>
          <SidebarTrigger />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/dashboard">
                    <Home />
                    Dashboard
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {hasFileManagerAccess && (
          <SidebarGroup>
            <SidebarGroupLabel>File Manager</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {hasModulRead && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link to="/modul">
                        <FileText />
                        Modul
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {hasProjectRead && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link to="/project">
                        <Briefcase />
                        Project
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        {hasUserManagementAccess && (
          <SidebarGroup>
            <SidebarGroupLabel>User Management</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {hasUserRead && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link to="/user">
                        <Users />
                        User
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {hasRoleRead && hasPermissionRead && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link to="/role">
                        <Shield />
                        Role & Permission
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <SidebarSeparator />
        <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex items-center gap-2 p-2 rounded-md hover:bg-sidebar-accent cursor-pointer group-data-[collapsible=icon]:justify-center">
            <Avatar className="h-8 w-8">
              <AvatarImage src={getProfileImageUrl(userProfile?.foto_profil, userProfile?.created_at)} alt="User" />
              <AvatarFallback>{userProfile?.name ? getInitials(userProfile.name) : (currentUser ? getInitials(currentUser.email) : 'U')}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col group-data-[collapsible=icon]:hidden min-w-0">
              <span className="text-sm font-medium truncate">{userProfile?.name || currentUser?.name || 'Admin'}</span>
              <span className="text-xs text-muted-foreground truncate">{userProfile?.role || 'Admin'}</span>
            </div>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5 text-sm flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={getProfileImageUrl(userProfile?.foto_profil, userProfile?.created_at)} alt="User" />
              <AvatarFallback className="text-xs">{userProfile?.name ? getInitials(userProfile.name) : (currentUser ? getInitials(currentUser.email) : 'U')}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{userProfile?.name || currentUser?.name || 'Admin'}</div>
              <div className="text-muted-foreground">{userProfile?.role || 'Admin'}</div>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setProfileOpen(true)}>
            <User className="mr-2 h-4 w-4" />
            Profil
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Keluar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarFooter>
    </Sidebar>
  );

  const headerContent = (
    <header className={`flex h-16 shrink-0 items-center border-b px-4 md:px-6 ${isMobile ? 'justify-between' : ''}`}>
      {isMobile && (
        <SidebarTrigger />
      )}
      <div className={`flex items-center gap-2 ${isMobile ? '' : 'ml-auto'}`}>
        <ThemeToggle />
        {!isMobile && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-2 cursor-pointer p-2 rounded-md hover:bg-accent">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={getProfileImageUrl(userProfile?.foto_profil, userProfile?.created_at)} alt="User" />
                  <AvatarFallback>{userProfile?.name ? getInitials(userProfile.name) : (currentUser ? getInitials(currentUser.email) : 'U')}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium truncate">{userProfile?.name || currentUser?.name || 'Admin'}</span>
                  <span className="text-xs text-muted-foreground truncate">{userProfile?.role || 'Admin'}</span>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5 text-sm flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={getProfileImageUrl(userProfile?.foto_profil, userProfile?.created_at)} alt="User" />
                  <AvatarFallback className="text-xs">{userProfile?.name ? getInitials(userProfile.name) : (currentUser ? getInitials(currentUser.email) : 'U')}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{userProfile?.name || currentUser?.name || 'Admin'}</div>
                  <div className="text-muted-foreground">{userProfile?.role || 'Admin'}</div>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setProfileOpen(true)}>
                <User className="mr-2 h-4 w-4" />
                Profil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Keluar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );

  return (
    <SidebarProvider open={isOpen} onOpenChange={(open) => dispatch(setSidebarOpen(open))}>
      {sidebarContent}
      <main className="flex flex-1 flex-col h-screen overflow-hidden">
        {headerContent}
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