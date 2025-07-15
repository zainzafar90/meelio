// ------------- AUTH COMPONENTS -------------
export * from "./auth/auth-container";
export * from "./auth/star-field";
export * from "./auth/user-auth-form";

// ------------- COMMON COMPONENTS -------------
export * from "./common/blurhash";
export * from "./common/connection-warning";
export * from "./common/container";
export * from "./common/logo";
export * from "./common/premium-feature";
export * from "./common/premium-feature-tooltip";
export * from "./common/ripple-effects";
export * from "./common/theme-provider";

// ------------- CORE COMPONENTS -------------
// Backgrounds
export * from "./core/backgrounds/backgrounds";
export * from "./core/backgrounds/components/shadow-overlay";
export * from "./core/backgrounds/components/background-selector.sheet";

// Breathing Pod
export * from "./core/breathing-pod/breathing-pod";
export * from "./core/breathing-pod/components/breathing-circle";
export * from "./core/breathing-pod/components/breathing-method-selector.dialog";
export * from "./core/breathing-pod/components/breathing-rings";
export * from "./core/breathing-pod/components/breathing-text";
export * from "./core/breathing-pod/components/breathing-timer";
export * from "./core/breathing-pod/store/breathing-dialog.store";
export * from "./core/breathing-pod/store/breathing.store";

// Clock
export * from "./core/clock";

// Dock components
export * from "./core/dock/dock";
export * from "./core/dock/components/calendar.dock";
export * from "./core/dock/components/clock.dock";
export * from "./core/dock/components/language-switcher.dock";
export * from "./core/dock/components/settings.dock";
export * from "./core/dock/components/weather.dock";
export * from "./core/calendar/calendar.sheet";

// Greeting
export * from "./core/greetings/greetings-mantras";

// Quote
export * from "./core/quote/quote";

// Settings
export * from "./core/settings/settings.dialog";
export * from "./core/settings/components/account/account-form";
export * from "./core/settings/components/billing/billing-form";
export * from "./core/settings/components/billing/free-plan-section";
export * from "./core/settings/components/billing/plans";
export * from "./core/settings/components/billing/pro-plan-section";
export * from "./core/settings/components/billing/skeleton-subscription";
export * from "./core/settings/components/user-profile/profile-dropdown";
export * from "./core/settings/tabs/account-settings";
export * from "./core/settings/tabs/appearance-settings";
export * from "./core/settings/tabs/billing-settings";
export * from "./core/settings/tabs/general-settings";
export * from "./core/settings/tabs/timer-settings";

// Soundscapes
export * from "./core/soundscapes/soundscapes.sheet";
export * from "./core/soundscapes/components/combos";
export * from "./core/soundscapes/components/categories/category-item";
export * from "./core/soundscapes/components/categories/category-list";
export * from "./core/soundscapes/components/sound-list/sound-list";
export * from "./core/soundscapes/components/sound-list/sound-tile-icon";
export * from "./core/soundscapes/components/sound-player/sound-player";
export * from "./core/soundscapes/components/sound-player/controls/global-volume-control";
export * from "./core/soundscapes/components/sound-player/controls/oscillation-button";
export * from "./core/soundscapes/components/sound-player/controls/play-button";
export * from "./core/soundscapes/components/sound-player/controls/reset-global-sound-settings.dialog";
export * from "./core/soundscapes/components/sound-player/controls/save-combo-button";
export * from "./core/soundscapes/components/sound-player/controls/share-button";
export * from "./core/soundscapes/components/sound-player/controls/shuffle-button";
export * from "./core/soundscapes/components/sound-player/controls/sound-control-bar";

// Timer
export * from "./core/timer/components/timer-controls";
export * from "./core/timer/components/timer-donut-graph";
export * from "./core/timer/components/timer-expanded-content";
export * from "./core/timer/components/timer-session-indicators";
export * from "./core/timer/components/timer-stats";
export * from "./core/timer/components/next-pinned-task";
export * from "./core/timer/dialog/reset-timer.dialog";
export * from "./core/timer/dialog/timer-stats.dialog";
export * from "./core/timer/timer-placeholder";
export { LegacySimpleTimer } from "./simple-timer";
export * from "./unified-simple-timer";
export * from "./timer-settings-panel";
export * from "./unified-timer-settings";
export * from "./unified-timer-settings.dialog";

// Main timer component - now points to unified implementation
export { UnifiedSimpleTimer as SimpleTimer } from "./unified-simple-timer";

// Tasks
export * from "./core/task-list/components/create-list";
export * from "./core/task-list/components/create-task";
export * from "./core/task-list/components/task-list";
export * from "./core/task-list/task-list.sheet";

// Site Blocker
export * from "./core/site-blocker/site-blocker.sheet";

// Tab Stash
export * from "./core/tab-stash/tab-stash.sheet";

// ------------- ICONS -------------
export * from "./icons";

// ------------- SKELETONS -------------
export * from "./skeletons/page-skeleton";

// ------------- UTILITY COMPONENTS -------------
export * from "./core/dock-button";
export * from "./core/layout";
export * from "./sync-status";
