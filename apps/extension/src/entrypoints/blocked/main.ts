import { sendExtensionCommand } from "../../features/site-blocker/services/blocker-runtime";

const root = document.getElementById("app");
if (!root) {
  throw new Error("Blocked page root element not found.");
}

const styles = `
  min-height: 100vh;
  margin: 0;
  background:
    radial-gradient(circle at 12% 10%, rgba(244, 114, 182, 0.18), transparent 30%),
    radial-gradient(circle at 88% 88%, rgba(59, 130, 246, 0.18), transparent 36%),
    linear-gradient(145deg, #050816 8%, #0f172a 42%, #111827 100%);
  color: #e5eef9;
  font-family: "Avenir Next", "SF Pro Display", "Segoe UI", sans-serif;
  display: grid;
  place-items: center;
  padding: 24px;
  box-sizing: border-box;
`;

const cardStyles = `
  width: min(560px, 100%);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 24px;
  background: rgba(9, 14, 27, 0.82);
  backdrop-filter: blur(18px);
  padding: 28px;
  box-sizing: border-box;
  box-shadow: 0 24px 80px rgba(2, 6, 23, 0.45);
  display: grid;
  gap: 16px;
`;

const primaryButtonStyles = `
  border: 1px solid rgba(244, 114, 182, 0.35);
  background: linear-gradient(135deg, rgba(244, 114, 182, 0.24), rgba(59, 130, 246, 0.18));
  color: #f8fafc;
  border-radius: 999px;
  padding: 11px 16px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
`;

const secondaryButtonStyles = `
  border: 1px solid rgba(148, 163, 184, 0.24);
  background: rgba(15, 23, 42, 0.7);
  color: #f8fafc;
  border-radius: 999px;
  padding: 11px 16px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
`;

document.body.setAttribute("style", styles);

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

const card = document.createElement("article");
card.setAttribute("style", cardStyles);

const eyebrow = document.createElement("div");
eyebrow.style.fontSize = "12px";
eyebrow.style.fontWeight = "700";
eyebrow.style.letterSpacing = "0.18em";
eyebrow.style.textTransform = "uppercase";
eyebrow.style.color = "#93c5fd";
eyebrow.textContent = "Meelio blocker";

const title = document.createElement("h1");
title.style.margin = "0";
title.style.fontSize = "clamp(2rem, 5vw, 2.8rem)";
title.style.lineHeight = "1";
title.textContent = "This site is blocked";

const description = document.createElement("p");
description.style.margin = "0";
description.style.lineHeight = "1.6";
description.style.color = "#cbd5e1";
description.textContent =
  pattern === "this site"
    ? "This destination is blocked while Meelio is protecting your focus."
    : `${pattern} is blocked while Meelio is protecting your focus.`;

const status = document.createElement("p");
status.style.margin = "4px 0 0";
status.style.minHeight = "20px";
status.style.color = "#93c5fd";

const actions = document.createElement("div");
actions.style.display = "flex";
actions.style.flexWrap = "wrap";
actions.style.gap = "10px";

const createButton = (label: string, buttonStyles: string, onClick: () => void) => {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.setAttribute("style", buttonStyles);
  button.addEventListener("click", onClick);
  return button;
};

const continueButton = createButton(
  "Continue to exact URL",
  primaryButtonStyles,
  () => {}
);
continueButton.style.display = "none";

const startBypass = async (durationMinutes: number) => {
  try {
    const result = await sendExtensionCommand({
      type: "blocker/start-bypass",
      payload: {
        pattern,
        durationMinutes,
      },
    });

    status.textContent = `Bypass enabled for ${durationMinutes} minutes.`;

    if (result.continueUrl) {
      continueButton.style.display = "inline-flex";
      continueButton.onclick = () => setCurrentLocation(result.continueUrl!);
    }
  } catch {
    status.textContent =
      "Unable to start the bypass right now. Open Meelio settings and try again.";
  }
};

actions.append(
  createButton("Back", secondaryButtonStyles, goBack),
  createButton("Bypass 15 min", primaryButtonStyles, () => {
    void startBypass(15);
  }),
  createButton("Bypass 60 min", secondaryButtonStyles, () => {
    void startBypass(60);
  }),
  createButton("Open Meelio settings", secondaryButtonStyles, openSettings)
);

void sendExtensionCommand({
  type: "blocker/record-blocked",
  payload: {
    pattern,
  },
}).catch(() => {
  // Best-effort audit logging only.
});

card.append(eyebrow, title, description, actions, continueButton, status);
root.append(card);
