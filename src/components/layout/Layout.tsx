"use client";

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Outlet } from "react-router-dom";
import { Home, Code, Briefcase, Users, Shield } from "lucide-react";
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
import { setSidebarOpen } from "@/lib/sidebarSlice";
import { logout } from "@/lib/authSlice";
import { ProfileDialog } from "@/components/common/ProfileDialog";
import { getInitials } from "@/utils/format";
import { authAPI } from "@/lib/auth";
import { userAPI } from "@/lib/userAPI";

export default function Layout() {
  const isOpen = useAppSelector((state) => state.sidebar.open);
  const currentUser = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [profileOpen, setProfileOpen] = useState(false);
  const [shouldNavigateToLogin, setShouldNavigateToLogin] = useState(false);
  const [userProfile, setUserProfile] = useState<{ email: string; role: string } | null>(null);

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout API failed:', error);
    }

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

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await userAPI.getProfile();
        setUserProfile(profile);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      }
    };

    if (currentUser) {
      fetchProfile();
    }
  }, [currentUser]);

  const hasModulRead = hasPermission('modul', 'read');
  const hasProjectRead = hasPermission('Project', 'read');
  const hasUserRead = hasPermission('user', 'read');
  const hasRoleRead = hasPermission('Role', 'read');
  const hasPermissionRead = hasPermission('Permission', 'read');

  const hasFileManagerAccess = hasModulRead || hasProjectRead;
  const hasUserManagementAccess = hasUserRead || (hasRoleRead && hasPermissionRead);

  console.log('[Layout] Permission checks:', {
    hasModulRead,
    hasProjectRead,
    hasUserRead,
    hasRoleRead,
    hasPermissionRead,
    hasFileManagerAccess,
    hasUserManagementAccess,
  });

  const sidebarContent = (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center justify-between">
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
                        <Code />
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex items-center gap-2 p-2 rounded-md hover:bg-sidebar-accent cursor-pointer">
            <Avatar className="h-8 w-8">
              <AvatarImage src="" alt="User" />
              <AvatarFallback>{currentUser ? getInitials(currentUser.email) : 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
              <span className="text-sm font-medium">{userProfile?.email || currentUser?.email || 'admin@invento.com'}</span>
              <span className="text-xs text-muted-foreground">{userProfile?.role || 'Admin'}</span>
            </div>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <div className="px-2 py-1.5 text-sm">
            <div className="font-medium">{userProfile?.email || currentUser?.email || 'admin@invento.com'}</div>
            <div className="text-muted-foreground">{userProfile?.role || 'Admin'}</div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setProfileOpen(true)}>Profil</DropdownMenuItem>
          <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarFooter>
    </Sidebar>
  );

  const headerContent = (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6">
      <div className="ml-auto flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="h-8 w-8 cursor-pointer">
              <AvatarImage src="" alt="User" />
              <AvatarFallback>{currentUser ? getInitials(currentUser.email) : 'U'}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="px-2 py-1.5 text-sm">
              <div className="font-medium">{userProfile?.email || currentUser?.email || 'admin@invento.com'}</div>
              <div className="text-muted-foreground">{userProfile?.role || 'Admin'}</div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setProfileOpen(true)}>Profil</DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <ThemeToggle />
      </div>
    </header>
  );

  return (
    <>
      <SidebarProvider open={isOpen} onOpenChange={(open) => dispatch(setSidebarOpen(open))}>
        {sidebarContent}
        <main className="flex flex-1 flex-col">
          {headerContent}
          <div className="flex-1 p-6">
            <Outlet />
          </div>
        </main>
      </SidebarProvider>
      <ProfileDialog
        user={userProfile}
        open={profileOpen}
        onOpenChange={setProfileOpen}
      />
    </>
  );
}