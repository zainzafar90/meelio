import { sendExtensionCommand } from "../../features/site-blocker/services/blocker-runtime";

const root = document.getElementById("app");
if (!root) {
  throw new Error("Blocked page root element not found.");
}

const pageStyles = `
  :root {
    color-scheme: dark;
    --blocked-bg:
      radial-gradient(circle at 12% 12%, rgba(16, 185, 129, 0.08), transparent 24%),
      radial-gradient(circle at 82% 14%, rgba(255, 255, 255, 0.06), transparent 18%),
      linear-gradient(180deg, #09090b 0%, #101113 54%, #121416 100%);
    --shell-bg: rgba(20, 20, 23, 0.92);
    --shell-border: rgba(207, 250, 231, 0.09);
    --section-bg: rgba(255, 255, 255, 0.03);
    --section-border: rgba(255, 255, 255, 0.08);
    --text: #f5f5f5;
    --muted: rgba(228, 234, 236, 0.7);
    --soft: rgba(218, 226, 230, 0.42);
    --chip-bg: rgba(255, 255, 255, 0.04);
    --chip-border: rgba(255, 255, 255, 0.1);
    --button-bg: rgba(255, 255, 255, 0.06);
    --button-border: rgba(255, 255, 255, 0.12);
    --button-hover: rgba(255, 255, 255, 0.1);
    --button-subtle-bg: rgba(0, 0, 0, 0.22);
    --button-subtle-hover: rgba(255, 255, 255, 0.04);
    --success-bg: rgba(16, 185, 129, 0.14);
    --success-border: rgba(16, 185, 129, 0.22);
    --success-text: #d1fae5;
    --warning-bg: rgba(245, 158, 11, 0.14);
    --warning-border: rgba(245, 158, 11, 0.22);
    --warning-text: #fde68a;
    --rule-badge-bg: rgba(16, 185, 129, 0.12);
    --rule-badge-border: rgba(16, 185, 129, 0.2);
    --rule-badge-dot: #6ee7b7;
    --rule-badge-text: rgba(187, 247, 208, 0.82);
    --rule-badge-strong: #ecfdf5;
    --mode-badge-bg: rgba(56, 189, 248, 0.12);
    --mode-badge-border: rgba(56, 189, 248, 0.2);
    --mode-badge-dot: #7dd3fc;
    --mode-badge-text: rgba(186, 230, 253, 0.82);
    --mode-badge-strong: #f0f9ff;
  }

  * {
    box-sizing: border-box;
  }

  body {
    min-height: 100vh;
    margin: 0;
    background: var(--blocked-bg);
    color: var(--text);
    font-family: "Avenir Next", "SF Pro Display", "Segoe UI", sans-serif;
  }

  #app {
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 28px;
  }

  .blocked-shell {
    position: relative;
    isolation: isolate;
    width: min(760px, 100%);
    overflow: hidden;
    border-radius: 28px;
    border: 1px solid var(--shell-border);
    background: var(--shell-bg);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.04),
      0 34px 90px rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(16px);
  }

  .blocked-shell::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 14% 0%, rgba(16, 185, 129, 0.06), transparent 28%),
      radial-gradient(circle at 88% 8%, rgba(56, 189, 248, 0.05), transparent 22%);
    pointer-events: none;
    z-index: 0;
  }

  .blocked-shell > * {
    position: relative;
    z-index: 1;
  }

  .blocked-header {
    padding: 28px;
    display: grid;
    gap: 16px;
  }

  .blocked-eyebrow {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--soft);
  }

  .blocked-title {
    margin: 0;
    font-size: clamp(2.1rem, 5.7vw, 3rem);
    line-height: 1.01;
    font-weight: 560;
    letter-spacing: -0.03em;
    color: var(--text);
    text-wrap: balance;
  }

  .blocked-description {
    margin: 0;
    max-width: 60ch;
    font-size: 16px;
    line-height: 1.72;
    color: var(--muted);
  }

  .blocked-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .blocked-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 13px;
    border-radius: 999px;
    border: 1px solid var(--chip-border);
    background: var(--chip-bg);
    font-size: 12px;
    color: var(--muted);
  }

  .blocked-badge::before {
    content: "";
    width: 7px;
    height: 7px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.3);
    box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.02);
  }

  .blocked-badge[data-tone="rule"] {
    border-color: var(--rule-badge-border);
    background: var(--rule-badge-bg);
    color: var(--rule-badge-text);
  }

  .blocked-badge[data-tone="rule"]::before {
    background: var(--rule-badge-dot);
    box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.08);
  }

  .blocked-badge[data-tone="rule"] strong {
    color: var(--rule-badge-strong);
  }

  .blocked-badge[data-tone="mode"] {
    border-color: var(--mode-badge-border);
    background: var(--mode-badge-bg);
    color: var(--mode-badge-text);
  }

  .blocked-badge[data-tone="mode"]::before {
    background: var(--mode-badge-dot);
    box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.08);
  }

  .blocked-badge[data-tone="mode"] strong {
    color: var(--mode-badge-strong);
  }

  .blocked-badge strong {
    color: var(--text);
    font-weight: 500;
  }

  .blocked-section {
    padding: 24px 28px;
    border-top: 1px solid var(--section-border);
  }

  .blocked-section--tinted {
    background: var(--section-bg);
  }

  .blocked-section-title {
    margin: 0;
    font-size: 16px;
    font-weight: 520;
    color: var(--text);
  }

  .blocked-section-copy {
    margin: 8px 0 0;
    max-width: 62ch;
    font-size: 15px;
    line-height: 1.72;
    color: var(--muted);
  }

  .blocked-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 18px;
  }

  .blocked-button {
    appearance: none;
    border-radius: 999px;
    border: 1px solid var(--button-border);
    padding: 12px 18px;
    font-size: 14px;
    font-weight: 520;
    cursor: pointer;
    transition:
      background 160ms ease,
      border-color 160ms ease,
      transform 160ms ease;
  }

  .blocked-button:hover {
    transform: translateY(-1px);
  }

  .blocked-button--primary {
    background: linear-gradient(
      180deg,
      rgba(16, 185, 129, 0.18),
      rgba(16, 185, 129, 0.11)
    );
    border-color: rgba(16, 185, 129, 0.2);
    color: var(--text);
  }

  .blocked-button--primary:hover {
    background: linear-gradient(
      180deg,
      rgba(16, 185, 129, 0.22),
      rgba(16, 185, 129, 0.14)
    );
    border-color: rgba(16, 185, 129, 0.26);
  }

  .blocked-button--secondary {
    background: var(--button-subtle-bg);
    color: var(--text);
  }

  .blocked-button--secondary:hover {
    background: var(--button-subtle-hover);
    border-color: rgba(255, 255, 255, 0.14);
  }

  .blocked-footer {
    padding: 22px 28px 28px;
    border-top: 1px solid var(--section-border);
    display: grid;
    gap: 14px;
  }

  .blocked-footer-note {
    margin: 0;
    font-size: 15px;
    line-height: 1.72;
    color: var(--muted);
  }

  .blocked-status {
    display: none;
    margin: 0;
    padding: 12px 14px;
    border-radius: 18px;
    border: 1px solid var(--warning-border);
    background: var(--warning-bg);
    color: var(--warning-text);
    font-size: 14px;
    line-height: 1.65;
  }

  .blocked-status[data-tone="success"] {
    border-color: var(--success-border);
    background: var(--success-bg);
    color: var(--success-text);
  }

  @media (max-width: 720px) {
    #app {
      padding: 16px;
    }

    .blocked-shell {
      border-radius: 22px;
    }

    .blocked-header,
    .blocked-section,
    .blocked-footer {
      padding-left: 18px;
      padding-right: 18px;
    }

    .blocked-title {
      font-size: clamp(2rem, 10vw, 2.8rem);
    }

    .blocked-button {
      width: 100%;
      justify-content: center;
    }
  }
`;

const styleTagId = "meelio-blocked-page-styles";
if (!document.getElementById(styleTagId)) {
  const styleTag = document.createElement("style");
  styleTag.id = styleTagId;
  styleTag.textContent = pageStyles;
  document.head.append(styleTag);
}

const params = new URLSearchParams(window.location.search);
const pattern = params.get("pattern")?.trim().toLowerCase() ?? "this site";

const setCurrentLocation = (url: string) => {
  window.location.assign(url);
};

const goBack = () => {
  const currentHref = window.location.href;
  window.history.back();

  window.setTimeout(() => {
    if (window.location.href === currentHref) {
      setCurrentLocation(chrome.runtime.getURL("newtab.html"));
    }
  }, 250);
};

const openSettings = () => {
  setCurrentLocation(chrome.runtime.getURL("newtab.html"));
};

const createButton = (
  label: string,
  variant: "primary" | "secondary",
  onClick: () => void
) => {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.className = `blocked-button blocked-button--${variant}`;
  button.addEventListener("click", onClick);
  return button;
};

const createBadge = (label: string, value: string) => {
  const badge = document.createElement("div");
  badge.className = "blocked-badge";
  badge.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
  return badge;
};

const shell = document.createElement("article");
shell.className = "blocked-shell";

const header = document.createElement("header");
header.className = "blocked-header";

const eyebrow = document.createElement("div");
eyebrow.className = "blocked-eyebrow";
eyebrow.textContent = "Extension tools";

const title = document.createElement("h1");
title.className = "blocked-title";
title.textContent = "This site is blocked";

const description = document.createElement("p");
description.className = "blocked-description";
description.textContent =
  pattern === "this site"
    ? "Meelio interrupted this destination because it matches one of your active blocker rules."
    : `${pattern} is currently blocked because it matches one of your active Meelio focus rules.`;

const badges = document.createElement("div");
badges.className = "blocked-badges";
const ruleBadge = createBadge(
  "Rule",
  pattern === "this site" ? "Blocked site" : pattern
);
ruleBadge.dataset.tone = "rule";
const modeBadge = createBadge("Mode", "Strict blocker");
modeBadge.dataset.tone = "mode";
badges.append(ruleBadge, modeBadge);

header.append(eyebrow, title, description, badges);

const bypassSection = document.createElement("section");
bypassSection.className = "blocked-section blocked-section--tinted";

const bypassTitle = document.createElement("h2");
bypassTitle.className = "blocked-section-title";
bypassTitle.textContent = "Temporary bypass";

const bypassCopy = document.createElement("p");
bypassCopy.className = "blocked-section-copy";
bypassCopy.textContent =
  "Bypasses stay local and expire automatically, so you can unblock the site without disabling the rule entirely.";

const bypassActions = document.createElement("div");
bypassActions.className = "blocked-actions";

const navigationSection = document.createElement("section");
navigationSection.className = "blocked-section";

const navigationTitle = document.createElement("h2");
navigationTitle.className = "blocked-section-title";
navigationTitle.textContent = "Navigation";

const navigationCopy = document.createElement("p");
navigationCopy.className = "blocked-section-copy";
navigationCopy.textContent =
  "Go back, open Meelio settings, or continue after starting a timed bypass.";

const navigationActions = document.createElement("div");
navigationActions.className = "blocked-actions";

const footer = document.createElement("footer");
footer.className = "blocked-footer";

const footerNote = document.createElement("p");
footerNote.className = "blocked-footer-note";
footerNote.textContent =
  "Use a timed bypass if you need to continue intentionally, or return to Meelio to change the rule.";

const status = document.createElement("p");
status.className = "blocked-status";

const continueButton = createButton("Continue to exact URL", "primary", () => {});
continueButton.style.display = "none";

const setStatus = (message: string, tone: "success" | "warning") => {
  status.textContent = message;
  status.dataset.tone = tone;
  status.style.display = "block";
};

const startBypass = async (durationMinutes: number) => {
  try {
    const result = await sendExtensionCommand({
      type: "blocker/start-bypass",
      payload: {
        pattern,
        durationMinutes,
      },
    });

    setStatus(`Bypass enabled for ${durationMinutes} minutes.`, "success");

    if (result.continueUrl) {
      continueButton.style.display = "inline-flex";
      continueButton.onclick = () => setCurrentLocation(result.continueUrl!);
    }
  } catch {
    setStatus(
      "Unable to start the bypass right now. Open Meelio settings and try again.",
      "warning"
    );
  }
};

bypassActions.append(
  createButton("Bypass 15 min", "primary", () => {
    void startBypass(15);
  }),
  createButton("Bypass 60 min", "secondary", () => {
    void startBypass(60);
  })
);

navigationActions.append(
  createButton("Back", "secondary", goBack),
  createButton("Open Meelio settings", "secondary", openSettings),
  continueButton
);

bypassSection.append(bypassTitle, bypassCopy, bypassActions);
navigationSection.append(navigationTitle, navigationCopy, navigationActions);
footer.append(footerNote, status);

void sendExtensionCommand({
  type: "blocker/record-blocked",
  payload: {
    pattern,
  },
}).catch(() => {
  // Best-effort audit logging only.
});

shell.append(header, bypassSection, navigationSection, footer);
root.replaceChildren(shell);
