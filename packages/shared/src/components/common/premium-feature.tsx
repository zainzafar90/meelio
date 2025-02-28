import React from "react";
import { useAuthStore } from "../../stores/auth.store";
import { Button } from "@repo/ui/components/ui/button";
import { Icons } from "../icons/icons";

interface PremiumFeatureProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAuth?: boolean;
  requirePro?: boolean;
}

/**
 * A component that wraps premium features and blocks access if the user is not authenticated
 * or doesn't have a premium subscription.
 *
 * @param children The premium feature content
 * @param fallback Optional custom UI to show when access is blocked
 * @param requireAuth Whether authentication is required (default: true)
 * @param requirePro Whether a premium subscription is required (default: false)
 */
export const PremiumFeature: React.FC<PremiumFeatureProps> = ({
  children,
  fallback,
  requireAuth = true,
  requirePro = false,
}) => {
  const { user } = useAuthStore();

  if (!requireAuth || (user && (!requirePro || user.isPro))) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-4 text-center border rounded-lg bg-muted/30">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
        <Icons.proMember className="w-6 h-6 text-primary" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Premium Feature</h3>
        <p className="text-sm text-muted-foreground">
          {!user
            ? "Please sign in to access this feature."
            : "Upgrade to Pro to unlock this premium feature."}
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        {!user ? (
          <Button onClick={() => console.log("/auth?mode=login")}>
            Sign In
          </Button>
        ) : (
          <Button onClick={() => console.log("/settings/billing")}>
            Upgrade to Pro
          </Button>
        )}
      </div>
    </div>
  );
};
