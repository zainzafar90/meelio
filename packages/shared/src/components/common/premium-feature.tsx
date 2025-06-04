import React from "react";
import { useAuthStore } from "../../stores/auth.store";
import { Button } from "@repo/ui/components/ui/button";
import { PremiumFeatureTooltip } from "./premium-feature-tooltip";
import { useShallow } from "zustand/shallow";
import { motion } from "framer-motion";
import { ArrowRight, Check, Crown, Sparkles } from "lucide-react";
import { Card, CardContent } from "@repo/ui/components/ui/card";

interface PremiumFeatureProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requirePro?: boolean;
  tooltipClassName?: string;
  features?: string[];
}

interface ConditionalFeatureProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
  showFallback: boolean;
}

/**
 * A simple conditional component that shows fallback when condition is true, children when false
 */
export const ConditionalFeature: React.FC<ConditionalFeatureProps> = ({
  children,
  fallback,
  showFallback,
}) => {
  return showFallback ? <>{fallback}</> : <>{children}</>;
};

/**
 * A component that wraps premium features and blocks access if the user is not authenticated
 * or doesn't have a premium subscription.
 *
 * @param children The premium feature content
 * @param fallback Optional custom UI to show when access is blocked
 * @param requirePro Whether a premium subscription is required (default: false)
 */
export const PremiumFeature: React.FC<PremiumFeatureProps> = ({
  children,
  fallback,
  requirePro = false,
  tooltipClassName,
  features = [],
}) => {
  const { user } = useAuthStore(
    useShallow((state) => ({
      user: state.user,
    }))
  );

  if (user && (!requirePro || user?.isPro)) {
    return <>{children}</>;
  }

  if (fallback) {
    return (
      <PremiumFeatureTooltip tooltipClassName={tooltipClassName}>
        {fallback}
      </PremiumFeatureTooltip>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full max-w-md"
    >
      <Card className="border shadow-xl bg-background/80 backdrop-blur-sm">
        <CardContent className="p-8 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-6 flex justify-center"
          >
            <div className="relative">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatDelay: 3,
                }}
                className="size-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center"
              >
                <Crown className="size-5 text-white" />
              </motion.div>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatDelay: 1,
                }}
                className="absolute -top-1 -right-1"
              >
                <Sparkles className="size-4 text-foreground" />
              </motion.div>
            </div>
          </motion.div>

          {/* Title */}
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-xl font-semibold text-foreground mb-2"
          >
            Upgrade to Pro
          </motion.h2>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-muted-foreground mb-6"
          >
            Unlock premium features and create even more beautiful code
            screenshots
          </motion.p>

          {/* Features list */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="space-y-3 mb-8"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1, duration: 0.4 }}
                className="flex items-center justify-start text-sm text-foreground"
              >
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mr-3 flex-shrink-0">
                  <Check className="w-3 h-3 text-primary" />
                </div>
                {feature}
              </motion.div>
            ))}
          </motion.div>

          {/* Upgrade button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <Button asChild>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <span>Upgrade Now</span>
                <motion.div
                  className="ml-2"
                  animate={{ x: [0, 4, 0] }}
                  transition={{
                    duration: 1.5,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatDelay: 2,
                  }}
                >
                  <ArrowRight className="w-4 h-4" />
                </motion.div>
              </motion.button>
            </Button>
          </motion.div>

          {/* Money back guarantee */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="text-xs text-muted-foreground mt-4"
          >
            Cancel anytime • 30-day money back guarantee
          </motion.p>
        </CardContent>
      </Card>
    </motion.div>
  );
};
