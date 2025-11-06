import { Settings, X } from "lucide-react";
import { useShallow } from "zustand/shallow";

import { useAuthStore } from "../../../stores/auth.store";

interface ProfileFooterProps {
  onClose: () => void;
}

export const ProfileFooter = ({ onClose }: ProfileFooterProps) => {
  const { user, guestUser } = useAuthStore(
    useShallow((state) => ({
      user: state.user,
      guestUser: state.guestUser,
    }))
  );

  const currentUser = user || guestUser;
  const userName = currentUser?.name || "User";

  return (
    <div className="border-t bg-muted/30 backdrop-blur-2xl px-8 py-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3">
          {user?.image ? (
            <img
              src={user.image}
              alt={userName}
              className="size-8 rounded-full object-cover ring-2 ring-border sm:size-10"
            />
          ) : (
            <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-semibold text-primary-foreground ring-2 ring-border sm:size-10 sm:text-sm">
              {userName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-xs font-medium text-card-foreground sm:text-sm">
            {userName}
          </span>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button className="hidden rounded-lg border bg-muted/50 p-2 text-muted-foreground backdrop-blur-xl transition-all hover:border-accent hover:bg-muted hover:text-card-foreground sm:block">
            <Settings className="size-4 sm:size-5" />
          </button>
          <button
            onClick={onClose}
            className="rounded-lg border bg-muted/50 p-2 text-muted-foreground backdrop-blur-xl transition-all hover:border-accent hover:bg-muted hover:text-card-foreground"
          >
            <X className="size-4 sm:size-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
