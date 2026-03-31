import { useEffect, useMemo, useRef, useState } from "react";
import { SiteList, useDockStore } from "@repo/shared";
import { cn } from "@repo/ui/lib/utils";
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
import {
  Clock3,
  Download,
  Globe2,
  ShieldAlert,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { useShallow } from "zustand/shallow";

import { useChromeStorageLocal } from "../hooks/use-chrome-storage-local";
import {
  BLOCKER_STORAGE_KEY,
  requestBlockerAccessPermission,
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

const sectionShell =
  "rounded-2xl border border-white/10 bg-white/[0.03] shadow-[0_1px_0_rgba(255,255,255,0.03)_inset]";

const Section = ({
  eyebrow,
  title,
  description,
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <section className={cn(sectionShell, className)}>
    <div className="border-b border-white/10 px-4 py-3">
      {eyebrow ? (
        <p className="text-[11px] uppercase tracking-[0.18em] text-white/35">
          {eyebrow}
        </p>
      ) : null}
      <h3 className="mt-1 text-sm font-semibold text-white">{title}</h3>
      {description ? (
        <p className="mt-1 text-sm leading-6 text-white/50">{description}</p>
      ) : null}
    </div>
    <div className="p-4">{children}</div>
  </section>
);

const EmptyState = ({ children }: { children: React.ReactNode }) => (
  <p className="rounded-xl border border-dashed border-white/10 bg-black/20 px-3 py-4 text-sm text-white/45">
    {children}
  </p>
);

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
  const activeRuleCount = useMemo(
    () => state.rules.filter((rule) => rule.enabled).length,
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
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/35">
                Extension tools
              </p>
              <h2 className="mt-1 text-lg font-semibold text-white">
                Site blocker
              </h2>
              <p className="mt-1 text-sm text-white/50">
                Strict blocking with lightweight activity review inside the
                new-tab drawer.
              </p>
            </div>
            <div className="inline-flex rounded-full border border-white/10 bg-black/20 p-1">
              <button
                type="button"
                onClick={() => setActiveTab("sites")}
                className={`rounded-full px-3 py-1.5 text-sm transition ${
                  activeTab === "sites"
                    ? "bg-white/12 text-white"
                    : "text-white/50 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                Sites
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("activity")}
                className={`rounded-full px-3 py-1.5 text-sm transition ${
                  activeTab === "activity"
                    ? "bg-white/12 text-white"
                    : "text-white/50 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                Activity
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-white/65">
              {activeRuleCount} active rule{activeRuleCount === 1 ? "" : "s"}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-white/65">
              {state.settings.activationMode === "always"
                ? "Always on"
                : "Focus sessions only"}
            </span>
            <span
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs",
                state.settings.permissionGranted
                  ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
                  : "border-amber-400/20 bg-amber-400/10 text-amber-100"
              )}
            >
              {state.settings.permissionGranted
                ? "All-sites access ready"
                : "Needs site access"}
            </span>
          </div>
        </div>

        {activeTab === "sites" ? (
          <div className="flex-1 overflow-y-auto px-4 py-5">
            <div className="space-y-5">
              <Section
                eyebrow="Protection"
                title="Blocking behavior"
                description="Keep enforcement and timing controls together so the blocker feels like part of the focus flow, not a separate settings page."
              >
                <div className="-m-4 divide-y divide-white/10">
                  <div className="flex items-start justify-between gap-4 px-4 py-4">
                    <div className="pr-2">
                      <p className="text-sm font-medium text-white">
                        Strict blocker
                      </p>
                      <p className="mt-1 text-sm leading-6 text-white/50">
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

                  <div className="px-4 py-4">
                    <div className="flex items-start gap-3">
                      <Clock3 className="mt-0.5 size-4 text-white/45" />
                      <div className="w-full">
                        <p className="text-sm font-medium text-white">
                          Activation mode
                        </p>
                        <p className="mt-1 text-sm leading-6 text-white/50">
                          Keep sites blocked all the time, or only during focus
                          sessions.
                        </p>
                        <Select
                          value={state.settings.activationMode}
                          onValueChange={(value) => {
                            void runMutation(async () => {
                              await sendExtensionCommand({
                                type: "blocker/set-activation-mode",
                                payload: {
                                  activationMode: value as
                                    | "always"
                                    | "focus-only",
                                },
                              });
                            });
                          }}
                        >
                          <SelectTrigger className="mt-3 border-white/10 bg-black/20 text-white">
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
                    </div>
                  </div>
                </div>
              </Section>

              <section
                className={cn(
                  "rounded-2xl border px-4 py-4",
                  state.settings.permissionGranted
                    ? "border-emerald-400/15 bg-emerald-400/[0.08]"
                    : "border-amber-400/15 bg-amber-400/[0.08]"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border",
                        state.settings.permissionGranted
                          ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
                          : "border-amber-400/20 bg-amber-400/10 text-amber-100"
                      )}
                    >
                      {state.settings.permissionGranted ? (
                        <ShieldCheck className="size-4" />
                      ) : (
                        <ShieldAlert className="size-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        Site access
                      </p>
                      <p className="mt-1 text-sm leading-6 text-white/70">
                        {state.settings.permissionGranted
                          ? "All-sites access is granted. Blocking and browsing activity are available on supported pages."
                          : "Grant all-sites access so Meelio can enforce strict blocking and capture browsing activity."}
                      </p>
                    </div>
                  </div>
                  {!state.settings.permissionGranted ? (
                    <Button
                      variant="outline"
                      className="border-white/15 bg-black/20 text-white hover:bg-white/[0.04]"
                      onClick={() => {
                        void runMutation(async () => {
                          const granted = await requestBlockerAccessPermission();
                          const result = await sendExtensionCommand({
                            type: "blocker/request-host-access",
                          });
                          if (!granted || !result.granted) {
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

              <Section
                eyebrow="Rules"
                title="Custom domains"
                description="Add your own domains when the preset groups are too broad or don’t include what distracts you."
              >
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
                    className="border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.07]"
                    onClick={() => {
                      void handleAddCustomSite();
                    }}
                  >
                    Add
                  </Button>
                </div>

                <div className="mt-4">
                  {customRules.length > 0 ? (
                    <div className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
                      {customRules.map((rule, index) => (
                        <div
                          key={rule.id}
                          className={cn(
                            "flex items-center justify-between gap-3 px-3 py-3",
                            index > 0 && "border-t border-white/10"
                          )}
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-white/90">
                              {rule.pattern}
                            </p>
                            <p className="mt-1 text-xs text-white/45">
                              {rule.enabled ? "Blocked now" : "Saved but inactive"}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <Button
                              variant="outline"
                              className="border-white/10 bg-white/[0.04] text-white/75 hover:bg-white/[0.07] hover:text-white"
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
                              className="border-white/10 bg-transparent text-white/60 hover:bg-white/[0.04] hover:text-white"
                              onClick={() => handleRemoveCustomSite(rule.id)}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState>No custom domains added yet.</EmptyState>
                  )}
                </div>
              </Section>

              <Section
                eyebrow="Presets"
                title="Popular site groups"
                description="Use Meelio’s curated categories when you want a broader blocklist without managing every domain individually."
              >
                <SiteList
                  showHeading={false}
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
              </Section>

              <Section
                eyebrow="Backup"
                title="Import or export"
                description="Keep a local copy of your blocker state, events, and activity when you want to move devices or checkpoint your setup."
              >
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant="outline"
                    className="border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.07]"
                    onClick={() => {
                      void handleExport();
                    }}
                  >
                    <Download className="mr-2 size-4" />
                    Export data
                  </Button>
                  <Button
                    variant="outline"
                    className="border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.07]"
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
              </Section>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-4 py-5">
            <div className="space-y-5">
              <Section
                eyebrow="Activity"
                title="Top sites in the last 7 days"
                description="A lightweight summary of where time is going, without charts or habit framing."
              >
                {activity.topSites.length > 0 ? (
                  <div className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
                    {activity.topSites.slice(0, 8).map((site, index) => (
                      <div
                        key={site.host}
                        className={cn(
                          "flex items-center justify-between gap-3 px-3 py-3",
                          index > 0 && "border-t border-white/10"
                        )}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Globe2 className="size-4 text-white/35" />
                            <p className="truncate text-sm font-medium text-white/90">
                              {site.host}
                            </p>
                          </div>
                          <p className="mt-1 text-xs text-white/45">
                            {site.visits} visits, {site.blockedAttempts} blocked
                          </p>
                        </div>
                        <span className="shrink-0 text-sm text-white/65">
                          {formatDuration(site.totalDurationMs)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState>No activity recorded yet.</EmptyState>
                )}
              </Section>

              <Section
                eyebrow="Events"
                title="Recent blocker events"
                description="A simple timeline of what the blocker changed, denied, or bypassed."
              >
                {activity.recentEvents.length > 0 ? (
                  <div className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
                    {activity.recentEvents.slice(0, 10).map((event, index) => (
                      <div
                        key={event.id}
                        className={cn(
                          "px-3 py-3",
                          index > 0 && "border-t border-white/10"
                        )}
                      >
                        <p className="text-sm font-medium text-white/90">
                          {describeEvent(event)}
                        </p>
                        <p className="mt-1 text-xs text-white/45">
                          {formatTimestamp(event.occurredAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState>No blocker events yet.</EmptyState>
                )}
              </Section>

              <Section
                eyebrow="Sessions"
                title="Recent tracked sessions"
                description="Recent browsing sessions captured by the extension while the blocker is active."
              >
                {activity.recentSessions.length > 0 ? (
                  <div className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
                    {activity.recentSessions.slice(0, 10).map((session, index) => (
                      <div
                        key={session.id}
                        className={cn(
                          "px-3 py-3",
                          index > 0 && "border-t border-white/10"
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate text-sm font-medium text-white/90">
                            {session.host}
                          </p>
                          <span className="shrink-0 text-xs text-white/45">
                            {formatDuration(session.durationMs)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-white/45">
                          {formatTimestamp(session.endedAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState>No tracked sessions yet.</EmptyState>
                )}
              </Section>
            </div>
          </div>
        )}

        {isBootstrapping ? (
          <div className="border-t border-white/10 px-6 py-3 text-sm text-white/40">
            Syncing blocker state...
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
};
