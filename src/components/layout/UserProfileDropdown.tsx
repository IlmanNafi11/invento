import { User, LogOut } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials } from "@/utils/format";
import { getProfileImageUrl } from "@/utils/profileUtils";
import type { Profile } from "@/types";

interface UserProfileDropdownProps {
  userProfile?: Profile | null;
  fallbackName?: string;
  fallbackRole?: string;
  onProfileClick: () => void;
  onLogoutClick: () => void;
  className?: string;
  hideNameOnCollapse?: boolean;
}

export function UserProfileDropdown({
  userProfile,
  fallbackName = "Admin",
  fallbackRole = "Admin",
  onProfileClick,
  onLogoutClick,
  className = "",
  hideNameOnCollapse = false,
}: UserProfileDropdownProps) {
  const displayName = userProfile?.name || fallbackName;
  const displayRole = userProfile?.role || fallbackRole;
  const avatarFallback = getInitials(displayName);
  const avatarSrc = getProfileImageUrl(userProfile?.foto_profil, userProfile?.created_at);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className={`flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer ${hideNameOnCollapse ? 'group-data-[collapsible=icon]:justify-center' : ''} ${className}`}>
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarSrc} alt="User" />
            <AvatarFallback>{avatarFallback}</AvatarFallback>
          </Avatar>
          {!hideNameOnCollapse && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium truncate">{displayName}</span>
              <span className="text-xs text-muted-foreground truncate">{displayRole}</span>
            </div>
          )}
          {hideNameOnCollapse && (
            <div className="flex flex-col group-data-[collapsible=icon]:hidden min-w-0">
              <span className="text-sm font-medium truncate">{displayName}</span>
              <span className="text-xs text-muted-foreground truncate">{displayRole}</span>
            </div>
          )}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5 text-sm flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarSrc} alt="User" />
            <AvatarFallback className="text-xs">{avatarFallback}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{displayName}</div>
            <div className="text-muted-foreground">{displayRole}</div>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onProfileClick}>
          <User className="mr-2 h-4 w-4" />
          Profil
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onLogoutClick}>
          <LogOut className="mr-2 h-4 w-4" />
          Keluar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
