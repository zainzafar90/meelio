import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@repo/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/ui/dialog";
import { ExternalLink } from "lucide-react";

type Browser = "chrome" | "edge" | "opera";

const PLACEHOLDER_IDS = {
  opera: "your_opera_id",
} as const;

const EXT_IDS: Record<Browser, string> = {
  chrome: "cjcgnlglboofgepielbmjcepcdohipaj",
  edge: "fgebfeellnjjjicifeoonnkfpbfmaadp",
  opera: PLACEHOLDER_IDS.opera,
};

const STORE_URLS: Record<Browser, string> = {
  chrome:
    "https://chromewebstore.google.com/detail/meelio/cjcgnlglboofgepielbmjcepcdohipaj",
  edge: "https://microsoftedge.microsoft.com/addons/detail/fgebfeellnjjjicifeoonnkfpbfmaadp",
  opera: "https://addons.opera.com/en/extensions/details/your_opera_slug",
};

function getBrowser(): Browser | null {
  const ua = navigator.userAgent;
  if (ua.includes("Edg/")) return "edge";
  if (ua.includes("OPR/") || ua.includes("Opera")) return "opera";
  if (ua.includes("Chrome/")) return "chrome";
  return null;
}

function isValidExtId(browser: Browser): boolean {
  const extId = EXT_IDS[browser];
  return !!extId && !Object.values(PLACEHOLDER_IDS).includes(extId as any);
}

function openExtensionOrStore(browser: Browser) {
  const extId = EXT_IDS[browser];
  const storeUrl = STORE_URLS[browser];

  if (!isValidExtId(browser)) return;

  try {
    const extUrl =
      browser === "edge"
        ? `extension://fgebfeellnjjjicifeoonnkfpbfmaadp/newtab.html`
        : `chrome-extension://cjcgnlglboofgepielbmjcepcdohipaj/newtab.html`;

    const win = window.open(extUrl, "_blank");
    setTimeout(() => {
      if (!win || win.closed || typeof win.closed === "undefined") {
        window.location.href = storeUrl;
      }
    }, 1000);
  } catch {
    window.location.href = storeUrl;
  }
}

export function ExtensionRedirectDialog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(searchParams.get("auth_origin") === "extension");
  }, [searchParams]);

  const handleStayOnWeb = () => {
    searchParams.delete("auth_origin");
    setSearchParams(searchParams);
    setOpen(false);
  };

  const handleGoToExtension = () => {
    const browser = getBrowser();
    if (!browser) {
      window.location.href = "meelio://";
      return;
    }
    openExtensionOrStore(browser);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Continue in Extension</DialogTitle>
          <DialogDescription>
            You started this process in the Meelio extension. Would you like to
            continue there?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={handleStayOnWeb}>
            Stay on Web
          </Button>
          <Button onClick={handleGoToExtension}>
            Go to Extension
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
