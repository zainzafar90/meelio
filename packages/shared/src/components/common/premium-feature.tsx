import React from "react";

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

export const ConditionalFeature: React.FC<ConditionalFeatureProps> = ({
  children,
  fallback,
  showFallback,
}) => {
  return showFallback ? <>{fallback}</> : <>{children}</>;
};

export const PremiumFeature: React.FC<PremiumFeatureProps> = ({
  children,
}) => {
  return <>{children}</>;
};
