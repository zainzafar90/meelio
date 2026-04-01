import { useEffect, useMemo, useRef, useState } from "react";
import { SiteList, useDockStore } from "@repo/shared";
import {
  formatLocalizedDateTime,
  formatLocalizedDuration,
  useTranslation,
} from "@repo/shared/i18n";
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

const describeEvent = (
  t: ReturnType<typeof useTranslation>["t"],
  event: {
  type: string;
  pattern: string;
  originalUrl?: string;
}
) => {
  switch (event.type) {
    case "blocked":
      return t("site-blocker.drawer.activity.events.blocked", {
        pattern: event.pattern,
      });
    case "bypass_started":
      return t("site-blocker.drawer.activity.events.bypassStarted", {
        pattern: event.pattern,
      });
    case "bypass_ended":
      return t("site-blocker.drawer.activity.events.bypassEnded", {
        pattern: event.pattern,
      });
    case "permission_denied":
      return t("site-blocker.drawer.activity.events.permissionDenied");
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
  const { t } = useTranslation();
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
      toast.error(t("site-blocker.drawer.errors.updateFailed"));
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
        toast.error(t("site-blocker.drawer.custom.invalid"));
        return;
      }

      await enableRule(normalizedPattern, "custom");
      setSiteInput("");
      toast.success(
        t("site-blocker.drawer.custom.added", {
          pattern: normalizedPattern,
        })
      );
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
      toast.success(t("site-blocker.drawer.backup.importSuccess"));
    } catch (error) {
      console.error("[meelio] failed to import blocker data", error);
      toast.error(t("site-blocker.drawer.backup.importFailed"));
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
            <SheetTitle>{t("site-blocker.title")}</SheetTitle>
            <SheetDescription>{t("site-blocker.drawer.description")}</SheetDescription>
          </SheetHeader>
        </VisuallyHidden>

        <div className="border-b border-white/10 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/35">
                {t("site-blocker.drawer.eyebrow")}
              </p>
              <h2 className="mt-1 text-lg font-semibold text-white">
                {t("site-blocker.title")}
              </h2>
              <p className="mt-1 text-sm text-white/50">
                {t("site-blocker.drawer.subtitle")}
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
                {t("site-blocker.drawer.tabs.sites")}
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
                {t("site-blocker.drawer.tabs.activity")}
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-white/65">
              {t("site-blocker.drawer.summary.activeRules", {
                count: activeRuleCount,
              })}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-white/65">
              {state.settings.activationMode === "always"
                ? t("site-blocker.drawer.blocking.activationAlways")
                : t("site-blocker.drawer.blocking.activationFocusOnly")}
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
                ? t("site-blocker.drawer.summary.accessReady")
                : t("site-blocker.drawer.summary.needsAccess")}
            </span>
          </div>
        </div>

        {activeTab === "sites" ? (
          <div className="flex-1 overflow-y-auto px-4 py-5">
            <div className="space-y-5">
              <Section
                eyebrow={t("site-blocker.drawer.sections.protection")}
                title={t("site-blocker.drawer.blocking.title")}
                description={t("site-blocker.drawer.blocking.description")}
              >
                <div className="-m-4 divide-y divide-white/10">
                  <div className="flex items-start justify-between gap-4 px-4 py-4">
                    <div className="pr-2">
                      <p className="text-sm font-medium text-white">
                        {t("site-blocker.drawer.blocking.strictTitle")}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-white/50">
                        {t("site-blocker.drawer.blocking.strictDescription")}
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
                          {t("site-blocker.drawer.blocking.activationTitle")}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-white/50">
                          {t("site-blocker.drawer.blocking.activationDescription")}
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
                            <SelectItem value="always">
                              {t("site-blocker.drawer.blocking.activationAlways")}
                            </SelectItem>
                            <SelectItem value="focus-only">
                              {t("site-blocker.drawer.blocking.activationFocusOnly")}
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
                        {t("site-blocker.drawer.access.title")}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-white/70">
                        {state.settings.permissionGranted
                          ? t("site-blocker.drawer.access.granted")
                          : t("site-blocker.drawer.access.missing")}
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
                            toast.error(t("site-blocker.drawer.access.denied"));
                          }
                        });
                      }}
                    >
                      {t("site-blocker.drawer.access.request")}
                    </Button>
                  ) : null}
                </div>
              </section>

              <Section
                eyebrow={t("site-blocker.drawer.sections.rules")}
                title={t("site-blocker.drawer.custom.title")}
                description={t("site-blocker.drawer.custom.description")}
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
                    placeholder={t("site-blocker.drawer.custom.placeholder")}
                    className="border-white/10 bg-black/20 text-white placeholder:text-white/35"
                  />
                  <Button
                    variant="outline"
                    className="border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.07]"
                    onClick={() => {
                      void handleAddCustomSite();
                    }}
                  >
                    {t("site-blocker.drawer.custom.add")}
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
                              {rule.enabled
                                ? t("site-blocker.drawer.custom.blockedNow")
                                : t("site-blocker.drawer.custom.savedInactive")}
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
                              {rule.enabled
                                ? t("site-blocker.drawer.custom.disable")
                                : t("site-blocker.drawer.custom.enable")}
                            </Button>
                            <Button
                              variant="outline"
                              className="border-white/10 bg-transparent text-white/60 hover:bg-white/[0.04] hover:text-white"
                              onClick={() => handleRemoveCustomSite(rule.id)}
                            >
                              {t("site-blocker.drawer.custom.remove")}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState>{t("site-blocker.drawer.custom.empty")}</EmptyState>
                  )}
                </div>
              </Section>

              <Section
                eyebrow={t("site-blocker.drawer.sections.presets")}
                title={t("site-blocker.drawer.presets.title")}
                description={t("site-blocker.drawer.presets.description")}
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
                eyebrow={t("site-blocker.drawer.sections.backup")}
                title={t("site-blocker.drawer.backup.title")}
                description={t("site-blocker.drawer.backup.description")}
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
                    {t("site-blocker.drawer.backup.export")}
                  </Button>
                  <Button
                    variant="outline"
                    className="border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.07]"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-2 size-4" />
                    {t("site-blocker.drawer.backup.import")}
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
                eyebrow={t("site-blocker.drawer.sections.activity")}
                title={t("site-blocker.drawer.activity.topSitesTitle")}
                description={t("site-blocker.drawer.activity.topSitesDescription")}
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
                            {t("site-blocker.drawer.activity.topSitesSummary", {
                              visits: site.visits,
                              blocked: site.blockedAttempts,
                            })}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm text-white/65">
                          {formatLocalizedDuration(site.totalDurationMs)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState>{t("site-blocker.drawer.activity.topSitesEmpty")}</EmptyState>
                )}
              </Section>

              <Section
                eyebrow={t("site-blocker.drawer.sections.events")}
                title={t("site-blocker.drawer.activity.eventsTitle")}
                description={t("site-blocker.drawer.activity.eventsDescription")}
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
                            {describeEvent(t, event)}
                          </p>
                          <p className="mt-1 text-xs text-white/45">
                            {formatLocalizedDateTime(event.occurredAt)}
                          </p>
                        </div>
                      ))}
                    </div>
                ) : (
                  <EmptyState>{t("site-blocker.drawer.activity.eventsEmpty")}</EmptyState>
                )}
              </Section>

              <Section
                eyebrow={t("site-blocker.drawer.sections.sessions")}
                title={t("site-blocker.drawer.activity.sessionsTitle")}
                description={t("site-blocker.drawer.activity.sessionsDescription")}
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
                            {formatLocalizedDuration(session.durationMs)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-white/45">
                          {formatLocalizedDateTime(session.endedAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState>{t("site-blocker.drawer.activity.sessionsEmpty")}</EmptyState>
                )}
              </Section>
            </div>
          </div>
        )}

        {isBootstrapping ? (
          <div className="border-t border-white/10 px-6 py-3 text-sm text-white/40">
            {t("site-blocker.drawer.bootstrap")}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
};
