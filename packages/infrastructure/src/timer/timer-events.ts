import type { TimerAppEvent } from "@repo/application/timer";

type TimerEventHandler = (event: TimerAppEvent) => void;
type TimerEventHandlers = Map<TimerAppEvent["type"], Set<TimerEventHandler>>;

const handlers: TimerEventHandlers = new Map();

const subscribe = (
  eventType: TimerAppEvent["type"],
  handler: TimerEventHandler
): (() => void) => {
  if (!handlers.has(eventType)) {
    handlers.set(eventType, new Set());
  }

  handlers.get(eventType)!.add(handler);

  return () => {
    handlers.get(eventType)?.delete(handler);
  };
};

const emit = (event: TimerAppEvent): void => {
  const eventHandlers = handlers.get(event.type);
  if (!eventHandlers) {
    return;
  }

  eventHandlers.forEach((handler) => {
    try {
      handler(event);
    } catch (error) {
      console.error(`Error in timer event handler for ${event.type}:`, error);
    }
  });
};

const removeAllListeners = (): void => {
  handlers.clear();
};

export const timerEvents = {
  on: subscribe,
  emit,
  removeAllListeners,
};
