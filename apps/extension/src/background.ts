import type { TimerMessage } from "./types";

interface TimerState {
  endTime: number;
  running: boolean;
  duration: number;
}

const stateKey = "timer-state";
let interval: NodeJS.Timeout | null = null;
let state: TimerState = { endTime: 0, running: false, duration: 0 };

function remaining(): number {
  return Math.max(0, Math.ceil((state.endTime - Date.now()) / 1000));
}

function clearTimer() {
  if (interval) clearInterval(interval);
  interval = null;
  state.running = false;
}

async function persist() {
  await chrome.storage.local.set({ [stateKey]: state });
}

function tick() {
  const left = remaining();
  if (left <= 0) {
    chrome.runtime.sendMessage({ type: "TICK", remaining: 0 });
    chrome.runtime.sendMessage({ type: "STAGE_COMPLETE" });
    clearTimer();
    persist();
  } else {
    chrome.runtime.sendMessage({ type: "TICK", remaining: left });
  }
}

async function start(duration: number) {
  clearTimer();
  state = { endTime: Date.now() + duration * 1000, running: true, duration };
  await persist();
  chrome.runtime.sendMessage({ type: "TICK", remaining: duration });
  interval = setInterval(tick, 250);
}

async function pause() {
  if (!state.running) return;
  clearTimer();
  state.duration = remaining();
  await persist();
  chrome.runtime.sendMessage({ type: "PAUSED", remaining: state.duration });
}

async function reset() {
  clearTimer();
  state = { endTime: 0, running: false, duration: 0 };
  await persist();
  chrome.runtime.sendMessage({ type: "RESET_COMPLETE" });
}

async function updateDuration(duration: number) {
  state.duration = duration;
  if (state.running) state.endTime = Date.now() + duration * 1000;
  await persist();
}

async function restore() {
  const saved = (await chrome.storage.local.get(stateKey))[stateKey] as
    | TimerState
    | undefined;
  if (!saved) return;
  state = saved;
  if (state.running && remaining() > 0) {
    interval = setInterval(tick, 250);
  } else if (state.running) {
    await reset();
  }
}

chrome.runtime.onMessage.addListener((msg: TimerMessage) => {
  switch (msg.type) {
    case "START":
      start(msg.duration ?? 0);
      break;
    case "PAUSE":
      pause();
      break;
    case "RESET":
      reset();
      break;
    case "UPDATE_DURATION":
      updateDuration(msg.duration ?? 0);
      break;
    case "SKIP_TO_NEXT_STAGE":
      reset();
      break;
  }
  return true;
});

restore();
