"use client";

import { useState } from "react";
import { Link } from "react-router-dom";
import { Outlet } from "react-router-dom";
import { Home, Code, Briefcase, Users, Shield } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { setSidebarOpen } from "@/lib/sidebarSlice";
import { ProfileDialog } from "@/components/common/ProfileDialog";
import { getInitials } from "@/utils/format";

export default function Layout() {
  const isOpen = useAppSelector((state) => state.sidebar.open);
  const currentUser = useAppSelector((state) => state.user.currentUser);
  const dispatch = useAppDispatch();
  const [profileOpen, setProfileOpen] = useState(false);

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
        <SidebarGroup>
          <SidebarGroupLabel>File Manager</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/modul">
                    <Code />
                    Modul
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/project">
                    <Briefcase />
                    Project
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>User Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/user">
                    <Users />
                    User
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/role">
                    <Shield />
                    Role & Permission
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
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
                <span className="text-sm font-medium">{currentUser?.email || 'admin@invento.com'}</span>
                <span className="text-xs text-muted-foreground">{currentUser?.role.name || 'Admin'}</span>
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setProfileOpen(true)}>Profil</DropdownMenuItem>
            <DropdownMenuItem>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );

  const headerContent = (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6">
      <div className="ml-auto flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src="" alt="User" />
          <AvatarFallback>{currentUser ? getInitials(currentUser.email) : 'U'}</AvatarFallback>
        </Avatar>
        <ThemeToggle />
      </div>
    </header>
  );

  return (
    <SidebarProvider open={isOpen} onOpenChange={(open) => dispatch(setSidebarOpen(open))}>
      {sidebarContent}
      <main className="flex flex-1 flex-col">
        {headerContent}
        <div className="flex-1 p-6">
          <Outlet />
        </div>
      </main>
      <ProfileDialog
        user={currentUser}
        open={profileOpen}
        onOpenChange={setProfileOpen}
      />
    </SidebarProvider>
  );
}