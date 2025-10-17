import { ThemeToggle } from "@/components/ui/theme-toggle";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserProfileDropdown } from "./UserProfileDropdown";
import type { Profile } from "@/types";

interface AppHeaderProps {
  userProfile?: Profile | null;
  currentUserName?: string;
  isMobile: boolean;
  onProfileClick: () => void;
  onLogoutClick: () => void;
}

export function AppHeader({
  userProfile,
  currentUserName = "Admin",
  isMobile,
  onProfileClick,
  onLogoutClick,
}: AppHeaderProps) {
  return (
    <header className={`flex h-16 shrink-0 items-center border-b px-4 md:px-6 ${isMobile ? 'justify-between' : ''}`}>
      {isMobile && (
        <SidebarTrigger />
      )}
      <div className={`flex items-center gap-4 ${isMobile ? '' : 'ml-auto'}`}>
        <ThemeToggle />
        {!isMobile && (
          <UserProfileDropdown
            userProfile={userProfile}
            fallbackName={currentUserName}
            onProfileClick={onProfileClick}
            onLogoutClick={onLogoutClick}
          />
        )}
      </div>
    </header>
  );
}
