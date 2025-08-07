import { useState } from "react";
import { cn } from "@repo/ui/lib/utils";
import { AuthContainer } from "../../../../auth/auth-container";
import { ArrowRight } from "lucide-react";
import { LogoMonochrome } from "../../../../common/logo";

interface PromotionalLoginButtonProps {
  className?: string;
  title?: string;
  subtitle?: string;
  variant?: "default" | "compact" | "minimal";
}

export const PromotionalLoginButton = ({
  className,
  title = "Sign in",
  subtitle = "to save and sync your data",
  variant = "default",
}: PromotionalLoginButtonProps) => {
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleOpen = () => {
    localStorage.setItem("meelio:local:migrate_guest", "true");
    setIsAuthOpen(true);
  };

  if (variant === "minimal") {
    return (
      <>
        <button 
          onClick={handleOpen} 
          className={cn(
            "w-full group",
            className
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="relative overflow-hidden rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 p-4 transition-all hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
                  <LogoMonochrome className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {title}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {subtitle}
                  </p>
                </div>
              </div>
              <ArrowRight className={cn(
                "h-5 w-5 text-blue-600 dark:text-blue-400 transition-transform",
                isHovered && "translate-x-1"
              )} />
            </div>
          </div>
        </button>
        {isAuthOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <AuthContainer
              defaultMode="login"
              onClose={() => setIsAuthOpen(false)}
            />
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <button 
        onClick={handleOpen} 
        className={cn("w-full group", className)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className={cn(
            "relative flex w-full items-center justify-between rounded-xl",
            "border border-gray-200 dark:border-gray-700",
            "bg-white dark:bg-gray-900",
            "shadow-sm transition-all duration-200",
            "hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700",
            variant === "default" ? "px-4 py-3 gap-3" : "px-3 py-2 gap-2"
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex items-center justify-center rounded-lg",
              "bg-gradient-to-br from-blue-500 to-blue-600",
              variant === "default" ? "h-10 w-10" : "h-8 w-8"
            )}>
              <LogoMonochrome className={cn(
                "text-white",
                variant === "default" ? "h-5 w-5" : "h-4 w-4"
              )} />
            </div>
            <div className="text-left">
              <p className={cn(
                "font-medium text-gray-900 dark:text-gray-100",
                variant === "default" ? "text-sm" : "text-xs"
              )}>
                {title}
              </p>
              {subtitle && (
                <p className={cn(
                  "text-gray-600 dark:text-gray-400",
                  variant === "default" ? "text-xs" : "text-[10px]"
                )}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <ArrowRight className={cn(
            "text-gray-400 transition-transform",
            variant === "default" ? "h-5 w-5" : "h-4 w-4",
            isHovered && "translate-x-1 text-blue-500"
          )} />
        </div>
      </button>
      {isAuthOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <AuthContainer
            defaultMode="login"
            onClose={() => setIsAuthOpen(false)}
          />
        </div>
      )}
    </>
  );
};