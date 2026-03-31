import { useEffect, useMemo, useRef, useState } from "react";
import { SiteList, useDockStore } from "@repo/shared";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/components/ui/sheet";
import { Switch } from "@repo/ui/components/ui/switch";
import { VisuallyHidden } from "@repo/ui/components/ui/visually-hidden";
import { Download, ShieldAlert, Upload } from "lucide-react";
import { toast } from "sonner";
import { useShallow } from "zustand/shallow";

import { useChromeStorageLocal } from "../hooks/use-chrome-storage-local";
import {
  BLOCKER_STORAGE_KEY,
  sendExtensionCommand,
  type BlockerExportCommand,
} from "../features/site-blocker/services/blocker-runtime";
import {
  buildActivitySnapshot,
} from "../features/site-blocker/services/blocker-state";
import {
  createEmptyBlockerState,
  type BlockRule,
} from "../features/site-blocker/services/blocker-core";
import { normalizeSiteHost } from "../utils/site-blocker.utils";

const EMPTY_BLOCKER_STATE = createEmptyBlockerState();

type DrawerTab = "sites" | "activity";

const formatDuration = (durationMs: number) => {
  const totalMinutes = Math.round(durationMs / 60_000);
  if (totalMinutes < 60) {
    return `${totalMinutes}m`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
};

const formatTimestamp = (value: string) =>
  new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const describeEvent = (event: {
  type: string;
  pattern: string;
  originalUrl?: string;
}) => {
  switch (event.type) {
    case "blocked":
      return `Blocked ${event.pattern}`;
    case "bypass_started":
      return `Started bypass for ${event.pattern}`;
    case "bypass_ended":
      return `Bypass expired for ${event.pattern}`;
    case "permission_denied":
      return "All-sites permission denied";
    default:
      return event.pattern;
  }
};

export const ExtensionSiteBlockerSheet = () => {
  const { isSiteBlockerVisible, toggleSiteBlocker } = useDockStore(
    useShallow((state) => ({
      isSiteBlockerVisible: state.isSiteBlockerVisible,
      toggleSiteBlocker: state.toggleSiteBlocker,
    }))
  );
  const [activeTab, setActiveTab] = useState<DrawerTab>("sites");
  const [siteInput, setSiteInput] = useState("");
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [state] = useChromeStorageLocal(BLOCKER_STORAGE_KEY, EMPTY_BLOCKER_STATE);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void sendExtensionCommand({ type: "blocker/get-state" })
      .catch((error) => {
        console.error("[meelio] failed to bootstrap blocker state", error);
      })
      .finally(() => setIsBootstrapping(false));
  }, []);

  const blockedSites = useMemo(
    () => state.rules.filter((rule) => rule.enabled).map((rule) => rule.pattern),
    [state.rules]
  );
  const customRules = useMemo(
    () => state.rules.filter((rule) => rule.source === "custom"),
    [state.rules]
  );
  const activity = useMemo(
    () => buildActivitySnapshot(state, Date.now()),
    [state]
  );

  const runMutation = async <T extends Promise<unknown>>(task: () => T) => {
    try {
      await task();
    } catch (error) {
      console.error("[meelio] blocker mutation failed", error);
      toast.error("Unable to update site blocker");
    }
  };

  const findRuleByPattern = (pattern: string): BlockRule | undefined => {
    const normalizedPattern = normalizeSiteHost(pattern);
    return state.rules.find((rule) => rule.pattern === normalizedPattern);
  };

  const enableRule = async (pattern: string, source: BlockRule["source"]) => {
    const normalizedPattern = normalizeSiteHost(pattern);
    const existingRule = findRuleByPattern(normalizedPattern);

    if (existingRule) {
      if (!existingRule.enabled) {
        await sendExtensionCommand({
          type: "blocker/toggle-rule",
          payload: {
            id: existingRule.id,
          },
        });
      }
      return;
    }

    await sendExtensionCommand({
      type: "blocker/add-rule",
      payload: {
        id:
          source === "preset"
            ? `preset:${normalizedPattern}`
            : crypto.randomUUID(),
        pattern: normalizedPattern,
        source,
      },
    });
  };

  const disableRule = async (pattern: string) => {
    const existingRule = findRuleByPattern(pattern);
    if (!existingRule?.enabled) {
      return;
    }

    await sendExtensionCommand({
      type: "blocker/toggle-rule",
      payload: {
        id: existingRule.id,
      },
    });
  };

  const handlePresetToggle = (pattern: string) =>
    runMutation(async () => {
      const existingRule = findRuleByPattern(pattern);
      if (!existingRule) {
        await enableRule(pattern, "preset");
        return;
      }

      await sendExtensionCommand({
        type: "blocker/toggle-rule",
        payload: {
          id: existingRule.id,
        },
      });
    });

  const handleAddCustomSite = () =>
    runMutation(async () => {
      const normalizedPattern = normalizeSiteHost(siteInput);
      if (!normalizedPattern || !normalizedPattern.includes(".")) {
        toast.error("Enter a valid domain");
        return;
      }

      await enableRule(normalizedPattern, "custom");
      setSiteInput("");
      toast.success(`${normalizedPattern} added to your block list`);
    });

  const handleRemoveCustomSite = (ruleId: string) =>
    runMutation(async () => {
      await sendExtensionCommand({
        type: "blocker/remove-rule",
        payload: {
          id: ruleId,
        },
      });
    });

  const handleExport = () =>
    runMutation(async () => {
      const snapshot = await sendExtensionCommand({
        type: "blocker/export",
      } satisfies BlockerExportCommand);
      const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `meelio-blocker-export-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    });

  const handleImportFile = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const content = await file.text();
      const snapshot = JSON.parse(content);
      await sendExtensionCommand({
        type: "blocker/import",
        payload: {
          snapshot,
        },
      });
      toast.success("Imported blocker data");
    } catch (error) {
      console.error("[meelio] failed to import blocker data", error);
      toast.error("Import failed");
    } finally {
      event.target.value = "";
    }
  };

  return (
    <Sheet open={isSiteBlockerVisible} onOpenChange={toggleSiteBlocker}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 border-l border-white/10 bg-zinc-950/95 p-0 text-white backdrop-blur-xl sm:max-w-xl"
      >
        <VisuallyHidden>
          <SheetHeader>
            <SheetTitle>Site blocker</SheetTitle>
            <SheetDescription>
              Manage strict blocking and browsing activity.
            </SheetDescription>
          </SheetHeader>
        </VisuallyHidden>

        <div className="border-b border-white/10 px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-white/40">
                Meelio
              </p>
              <h2 className="mt-2 text-lg font-semibold">Site blocker</h2>
            </div>
            <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1">
              <button
                type="button"
                onClick={() => setActiveTab("sites")}
                className={`rounded-full px-3 py-1.5 text-sm transition ${
                  activeTab === "sites"
                    ? "bg-white text-black"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Sites
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("activity")}
                className={`rounded-full px-3 py-1.5 text-sm transition ${
                  activeTab === "activity"
                    ? "bg-white text-black"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Activity
              </button>
            </div>
          </div>
        </div>

        {activeTab === "sites" ? (
          <div className="flex-1 overflow-y-auto px-4 py-5">
            <div className="space-y-6">
              <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-medium">Strict blocker</h3>
                    <p className="text-sm text-white/60">
                      Redirect matching sites to the blocked page before they
                      render.
                    </p>
                  </div>
                  <Switch
                    checked={state.settings.enabled}
                    onCheckedChange={(enabled) => {
                      void runMutation(async () => {
                        await sendExtensionCommand({
                          type: "blocker/set-enabled",
                          payload: { enabled },
                        });
                      });
                    }}
                  />
                </div>

                <div className="mt-4">
                  <p className="mb-2 text-xs uppercase tracking-[0.16em] text-white/40">
                    Activation mode
                  </p>
                  <Select
                    value={state.settings.activationMode}
                    onValueChange={(value) => {
                      void runMutation(async () => {
                        await sendExtensionCommand({
                          type: "blocker/set-activation-mode",
                          payload: {
                            activationMode: value as "always" | "focus-only",
                          },
                        });
                      });
                    }}
                  >
                    <SelectTrigger className="border-white/10 bg-white/5 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="always">Always on</SelectItem>
                      <SelectItem value="focus-only">
                        Focus sessions only
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </section>

              <section
                className={`rounded-2xl border p-4 ${
                  state.settings.permissionGranted
                    ? "border-emerald-500/20 bg-emerald-500/10"
                    : "border-amber-500/20 bg-amber-500/10"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="size-4" />
                      <h3 className="font-medium">Site access</h3>
                    </div>
                    <p className="mt-2 text-sm text-white/70">
                      {state.settings.permissionGranted
                        ? "All-sites access is granted. Blocking and tracking are active on supported pages."
                        : "Grant all-sites access to enforce hard blocking and browsing tracking."}
                    </p>
                  </div>
                  {!state.settings.permissionGranted ? (
                    <Button
                      variant="outline"
                      className="border-white/20 bg-white/5 text-white"
                      onClick={() => {
                        void runMutation(async () => {
                          const result = await sendExtensionCommand({
                            type: "blocker/request-host-access",
                          });
                          if (!result.granted) {
                            toast.error("Permission request was denied");
                          }
                        });
                      }}
                    >
                      Request access
                    </Button>
                  ) : null}
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2">
                  <Input
                    value={siteInput}
                    onChange={(event) => setSiteInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void handleAddCustomSite();
                      }
                    }}
                    placeholder="Add a custom domain"
                    className="border-white/10 bg-black/20 text-white placeholder:text-white/35"
                  />
                  <Button
                    variant="outline"
                    className="border-white/10 bg-white/5 text-white"
                    onClick={() => {
                      void handleAddCustomSite();
                    }}
                  >
                    Add
                  </Button>
                </div>

                {customRules.length > 0 ? (
                  <div className="mt-4 space-y-2">
                    {customRules.map((rule) => (
                      <div
                        key={rule.id}
                        className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-medium">{rule.pattern}</p>
                          <p className="text-xs text-white/45">
                            {rule.enabled ? "Blocked" : "Saved but disabled"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            className="border-white/10 bg-white/5 text-white"
                            onClick={() => {
                              void runMutation(async () => {
                                await sendExtensionCommand({
                                  type: "blocker/toggle-rule",
                                  payload: { id: rule.id },
                                });
                              });
                            }}
                          >
                            {rule.enabled ? "Disable" : "Enable"}
                          </Button>
                          <Button
                            variant="outline"
                            className="border-white/10 bg-white/5 text-white"
                            onClick={() => handleRemoveCustomSite(rule.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-white/50">
                    No custom domains added yet.
                  </p>
                )}
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Popular sites</h3>
                    <p className="text-sm text-white/60">
                      Curated presets from the existing Meelio catalog.
                    </p>
                  </div>
                </div>
                <SiteList
                  blockedSites={blockedSites}
                  onToggleSite={handlePresetToggle}
                  onBlockSites={(sites) => {
                    void runMutation(async () => {
                      for (const site of sites) {
                        await enableRule(site, "preset");
                      }
                    });
                  }}
                  onUnblockSites={(sites) => {
                    void runMutation(async () => {
                      for (const site of sites) {
                        await disableRule(site);
                      }
                    });
                  }}
                />
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant="outline"
                    className="border-white/10 bg-white/5 text-white"
                    onClick={() => {
                      void handleExport();
                    }}
                  >
                    <Download className="mr-2 size-4" />
                    Export data
                  </Button>
                  <Button
                    variant="outline"
                    className="border-white/10 bg-white/5 text-white"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-2 size-4" />
                    Import data
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/json"
                    className="hidden"
                    onChange={(event) => {
                      void handleImportFile(event);
                    }}
                  />
                </div>
              </section>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-4 py-5">
            <div className="space-y-6">
              <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <h3 className="font-medium">Top sites in the last 7 days</h3>
                <div className="mt-4 space-y-2">
                  {activity.topSites.length > 0 ? (
                    activity.topSites.slice(0, 8).map((site) => (
                      <div
                        key={site.host}
                        className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-medium">{site.host}</p>
                          <p className="text-xs text-white/45">
                            {site.visits} visits, {site.blockedAttempts} blocked
                          </p>
                        </div>
                        <span className="text-sm text-white/70">
                          {formatDuration(site.totalDurationMs)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-white/50">
                      No activity recorded yet.
                    </p>
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <h3 className="font-medium">Recent blocker events</h3>
                <div className="mt-4 space-y-2">
                  {activity.recentEvents.length > 0 ? (
                    activity.recentEvents.slice(0, 10).map((event) => (
                      <div
                        key={event.id}
                        className="rounded-xl border border-white/10 bg-black/20 px-3 py-2"
                      >
                        <p className="text-sm font-medium">{describeEvent(event)}</p>
                        <p className="mt-1 text-xs text-white/45">
                          {formatTimestamp(event.occurredAt)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-white/50">
                      No blocker events yet.
                    </p>
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <h3 className="font-medium">Recent tracked sessions</h3>
                <div className="mt-4 space-y-2">
                  {activity.recentSessions.length > 0 ? (
                    activity.recentSessions.slice(0, 10).map((session) => (
                      <div
                        key={session.id}
                        className="rounded-xl border border-white/10 bg-black/20 px-3 py-2"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium">{session.host}</p>
                          <span className="text-xs text-white/45">
                            {formatDuration(session.durationMs)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-white/45">
                          {formatTimestamp(session.endedAt)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-white/50">
                      No tracked sessions yet.
                    </p>
                  )}
                </div>
              </section>
            </div>
          </div>
        )}

        {isBootstrapping ? (
          <div className="border-t border-white/10 px-6 py-3 text-sm text-white/45">
            Syncing blocker state...
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
};
