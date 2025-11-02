export type TimerEventType =
  | 'timer:start'
  | 'timer:pause'
  | 'timer:complete'
  | 'timer:reset'
  | 'timer:stage-change'
  | 'timer:duration-update';

export interface TimerEvent {
  type: TimerEventType;
  stage?: 'focus' | 'break';
  duration?: number;
  remaining?: number;
  data?: Record<string, any>;
}

type TimerEventHandler = (event: TimerEvent) => void;

type TimerEventHandlers = Map<TimerEventType, Set<TimerEventHandler>>;

const createTimerEventHandlers = (): TimerEventHandlers => new Map();

const handlers: TimerEventHandlers = createTimerEventHandlers();

const subscribe = (eventType: TimerEventType, handler: TimerEventHandler): (() => void) => {
  if (!handlers.has(eventType)) {
    handlers.set(eventType, new Set());
  }
  handlers.get(eventType)!.add(handler);

  return () => {
    handlers.get(eventType)?.delete(handler);
  };
};

const emit = (event: TimerEvent): void => {
  const eventHandlers = handlers.get(event.type);
  if (eventHandlers) {
    eventHandlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error(`Error in timer event handler for ${event.type}:`, error);
      }
    });
  }
};

const removeAllListeners = (): void => {
  handlers.clear();
};

export const timerEvents = {
  on: subscribe,
  emit,
  removeAllListeners,
};

