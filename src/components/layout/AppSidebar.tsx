import { Link, useLocation } from "react-router-dom";
import { Home, FileText, Briefcase, Users, Shield, Menu } from "lucide-react";
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
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { UserProfileDropdown } from "./UserProfileDropdown";
import type { Profile } from "@/types";

interface AppSidebarProps {
  userProfile?: Profile | null;
  currentUserName?: string;
  onProfileClick: () => void;
  onLogoutClick: () => void;
  hasModulRead: boolean;
  hasProjectRead: boolean;
  hasUserRead: boolean;
  hasRoleRead: boolean;
  hasPermissionRead: boolean;
}

export function AppSidebar({
  userProfile,
  currentUserName = "Admin",
  onProfileClick,
  onLogoutClick,
  hasModulRead,
  hasProjectRead,
  hasUserRead,
  hasRoleRead,
  hasPermissionRead,
}: AppSidebarProps) {
  const location = useLocation();
  const hasFileManagerAccess = hasModulRead || hasProjectRead;
  const hasUserManagementAccess = hasUserRead || (hasRoleRead && hasPermissionRead);

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 border-b">
        <div className="flex items-center justify-between px-2 group-data-[collapsible=icon]:justify-center h-full">
          <h2 className="text-lg font-semibold group-data-[collapsible=icon]:hidden">Invento</h2>
          <SidebarTrigger className="hover:bg-sidebar-accent/80">
            <Menu className="h-4 w-4" />
            <span className="sr-only">Toggle Sidebar</span>
          </SidebarTrigger>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActiveRoute("/dashboard")} tooltip="Dashboard">
                  <Link to="/dashboard">
                    <Home className="h-4 w-4" />
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
                    <SidebarMenuButton asChild isActive={isActiveRoute("/modul")} tooltip="Modul">
                      <Link to="/modul">
                        <FileText className="h-4 w-4" />
                        Modul
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {hasProjectRead && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActiveRoute("/project")} tooltip="Project">
                      <Link to="/project">
                        <Briefcase className="h-4 w-4" />
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
                    <SidebarMenuButton asChild isActive={isActiveRoute("/user")} tooltip="User">
                      <Link to="/user">
                        <Users className="h-4 w-4" />
                        User
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {hasRoleRead && hasPermissionRead && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActiveRoute("/role")} tooltip="Role & Permission">
                      <Link to="/role">
                        <Shield className="h-4 w-4" />
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
        <UserProfileDropdown
          userProfile={userProfile}
          fallbackName={currentUserName}
          onProfileClick={onProfileClick}
          onLogoutClick={onLogoutClick}
          hideNameOnCollapse={true}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
