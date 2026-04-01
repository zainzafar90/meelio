import { waitFor, assert, sleep } from "./utils.mjs";
import { getValidationCopy } from "./validation-copy.mjs";

export async function openTabFromWorker(workerClient, url) {
  return workerClient.evaluate(`
    (async () => {
      const tab = await chrome.tabs.create({ url: ${JSON.stringify(url)} });
      return { id: tab.id, url: tab.url ?? null };
    })()
  `);
}

export async function waitForTabUrl(workerClient, tabId, predicate, description) {
  return waitFor(
    description,
    () =>
      workerClient.evaluate(`
        (async () => {
          const tab = await chrome.tabs.get(${tabId});
          return tab.url ?? null;
        })()
      `),
    predicate,
    15000
  );
}

export async function getBodyText(pageClient) {
  return pageClient.evaluate(`
    (() => document.body ? document.body.innerText : "")()
  `);
}

export async function waitForBodyText(pageClient, text, timeoutMs = 15000) {
  return waitFor(
    `page text "${text}"`,
    () => getBodyText(pageClient),
    (value) => typeof value === "string" && value.includes(text),
    timeoutMs
  );
}

export async function waitForBodyTextGone(pageClient, text, timeoutMs = 15000) {
  return waitFor(
    `page text "${text}" to disappear`,
    () => getBodyText(pageClient),
    (value) => typeof value === "string" && !value.includes(text),
    timeoutMs
  );
}

export async function waitForUrl(pageClient, predicate, description, timeoutMs = 15000) {
  return waitFor(
    description,
    () => pageClient.evaluate("(() => location.href)()"),
    predicate,
    timeoutMs
  );
}

export async function clickButtonByLabel(pageClient, label) {
  const result = await pageClient.evaluate(`
    (() => {
      const button = Array.from(document.querySelectorAll("button")).find(
        (candidate) =>
          candidate instanceof HTMLButtonElement &&
          (
            candidate.getAttribute("title") === ${JSON.stringify(label)} ||
            candidate.getAttribute("aria-label") === ${JSON.stringify(label)} ||
            candidate.textContent?.trim() === ${JSON.stringify(label)}
          )
      );
      if (!button) {
        return false;
      }
      button.click();
      return true;
    })()
  `);

  assert(result, `Unable to find button with label "${label}".`);
}

export async function waitForButtonByLabel(pageClient, label, timeoutMs = 15000) {
  return waitFor(
    `button with label "${label}"`,
    () =>
      pageClient.evaluate(`
        (() => Boolean(
          Array.from(document.querySelectorAll("button")).find(
            (candidate) =>
              candidate instanceof HTMLButtonElement &&
              (
                candidate.getAttribute("title") === ${JSON.stringify(label)} ||
                candidate.getAttribute("aria-label") === ${JSON.stringify(label)} ||
                candidate.textContent?.trim() === ${JSON.stringify(label)}
              )
          )
        ))()
      `),
    Boolean,
    timeoutMs
  );
}

export async function clickButtonByTitle(pageClient, title) {
  const result = await pageClient.evaluate(`
    (() => {
      const button = document.querySelector(${JSON.stringify(
        `button[title="${title}"]`
      )});
      if (!button) {
        return false;
      }
      button.click();
      return true;
    })()
  `);

  assert(result, `Unable to find button with title "${title}".`);
}

export async function waitForButtonByTitle(pageClient, title, timeoutMs = 15000) {
  return waitFor(
    `button with title "${title}"`,
    () =>
      pageClient.evaluate(`
        (() => Boolean(document.querySelector(${JSON.stringify(
          `button[title="${title}"]`
        )})))()
      `),
    Boolean,
    timeoutMs
  );
}

export async function clickButtonByText(pageClient, label) {
  const result = await pageClient.evaluate(`
    (() => {
      const button = Array.from(document.querySelectorAll("button")).find(
        (candidate) =>
          candidate instanceof HTMLButtonElement &&
          candidate.textContent?.trim() === ${JSON.stringify(label)}
      );
      if (!button) {
        return false;
      }
      button.click();
      return true;
    })()
  `);

  assert(result, `Unable to find button with label "${label}".`);
}

export async function setInputByPlaceholder(pageClient, placeholder, value) {
  const result = await pageClient.evaluate(`
    (() => {
      const input = document.querySelector(${JSON.stringify(
        `input[placeholder="${placeholder}"]`
      )});
      if (!(input instanceof HTMLInputElement)) {
        return false;
      }
      const valueSetter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value"
      )?.set;
      if (!valueSetter) {
        return false;
      }
      input.focus();
      valueSetter.call(input, ${JSON.stringify(value)});
      input.dispatchEvent(
        new InputEvent("input", {
          bubbles: true,
          data: ${JSON.stringify(value)},
          inputType: "insertText",
        })
      );
      input.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    })()
  `);

  assert(result, `Unable to find input with placeholder "${placeholder}".`);
}

export async function setDockState(pageClient, nextState) {
  await pageClient.evaluate(`
    (() => {
      const dockKey = "meelio:local:dock";
      const onboardingKey = "meelio:local:onboarding";
      const rawDock = localStorage.getItem(dockKey);
      const dockPayload = rawDock ? JSON.parse(rawDock) : { state: {}, version: 7 };
      dockPayload.state = {
        ...dockPayload.state,
        currentOnboardingStep: -1,
        ...${JSON.stringify(nextState)},
      };
      localStorage.setItem(dockKey, JSON.stringify(dockPayload));
      localStorage.setItem(
        onboardingKey,
        JSON.stringify({
          state: {
            hasDockOnboardingCompleted: true,
          },
          version: 2,
        })
      );
      return dockPayload;
    })()
  `);
  await pageClient.reload();
}

export async function getTimerValue(pageClient) {
  return pageClient.evaluate(`
    (() => {
      const timerText = Array.from(document.querySelectorAll("*"))
        .map((node) => node.textContent?.trim() ?? "")
        .find((text) => /^\\d+:\\d{2}$/.test(text));
      return timerText ?? null;
    })()
  `);
}

export async function sendRuntimeMessage(pageClient, payload) {
  return pageClient.evaluate(`
    (async () => {
      return chrome.runtime.sendMessage(${JSON.stringify(payload)});
    })()
  `);
}

export async function hasAllSitesPermission(pageClient) {
  return pageClient.evaluate(`
    (async () => {
      return chrome.permissions.contains({
        origins: ["http://*/*", "https://*/*"],
      });
    })()
  `);
}

export async function requestAllSitesPermission(pageClient) {
  if (await hasAllSitesPermission(pageClient)) {
    return true;
  }

  await clickButtonByText(
    pageClient,
    getValidationCopy("site-blocker.drawer.access.request")
  );
  await sleep(1200);

  if (await hasAllSitesPermission(pageClient)) {
    return true;
  }

  const granted = await pageClient.evaluate(`
    (async () => {
      return chrome.permissions.request({
        origins: ["http://*/*", "https://*/*"],
      });
    })()
  `);

  if (granted) {
    await sendRuntimeMessage(pageClient, {
      type: "blocker/request-host-access",
    });
  }

  return granted;
}
