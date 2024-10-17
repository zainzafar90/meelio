import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { api } from "@/api";

import { PageSkeleton } from "@/components/skeletons/page-skeleton";
import { toast } from "@/components/ui/toast/use-toast";
import { useMounted } from "@/hooks/use-mounted";

const VerifyMagicLink = () => {
  const mounted = useMounted();
  const searchParams = new URLSearchParams(useLocation().search);
  const [verificationStatus, setVerificationStatus] = useState("verifying");

  useEffect(() => {
    const verifyMagicLink = async () => {
      const magicLinkToken = searchParams?.get("token");
      if (magicLinkToken) {
        setVerificationStatus("verifying");

        try {
          await api.auth.verifyMagicLink({
            token: magicLinkToken,
          });
          setVerificationStatus("success");
        } catch (e) {
          toast({
            title: "Verification failed",
            description:
              "Your link should be valid for 10 minutes. Please try again.",
            variant: "destructive",
          });
          setVerificationStatus("error");
        }
      }
    };

    if (mounted) {
      verifyMagicLink();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  if (verificationStatus === "verifying") {
    return (
      <PageSkeleton>
        <h3 className="text-foreground font-medium">Verifying...</h3>
      </PageSkeleton>
    );
  }

  if (verificationStatus === "success") {
    return <Navigate to="/soundscapes" />;
  }

  if (verificationStatus === "error") {
    return <Navigate to="/login" />;
  }

  return <Navigate to="/login" />;
};

export default VerifyMagicLink;
