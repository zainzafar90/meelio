interface StartMessage { type: 'START'; duration: number }
interface PauseMessage { type: 'PAUSE' }
interface ResetMessage { type: 'RESET' }
interface UpdateDurationMessage { type: 'UPDATE_DURATION'; duration: number }
interface SkipStageMessage { type: 'SKIP_TO_NEXT_STAGE' }

type TimerMessage =
  | StartMessage
  | PauseMessage
  | ResetMessage
  | UpdateDurationMessage
  | SkipStageMessage

let interval: NodeJS.Timeout | null = null
let endTime = 0

const clean = () => {
  if (interval) clearInterval(interval);
  interval = null;
  endTime = 0;
};

const remaining = (): number =>
  Math.max(0, Math.ceil((endTime - Date.now()) / 1000))

chrome.runtime.onMessage.addListener((msg: TimerMessage) => {
  switch (msg.type) {
    case 'START':
      clean();
      endTime = Date.now() + msg.duration * 1000;
      chrome.runtime.sendMessage({ type: 'TICK', remaining: msg.duration });
      interval = setInterval(() => {
        const left = remaining();
        if (left <= 0) {
          chrome.runtime.sendMessage({ type: 'TICK', remaining: 0 });
          chrome.runtime.sendMessage({ type: 'STAGE_COMPLETE' });
          clean();
        } else {
          chrome.runtime.sendMessage({ type: 'TICK', remaining: left });
        }
      }, 1000);
      break;
    case 'PAUSE':
      if (interval) {
        clearInterval(interval);
        interval = null;
        chrome.runtime.sendMessage({ type: 'PAUSED', remaining: remaining() });
      }
      break;
    case 'RESET':
      clean();
      chrome.runtime.sendMessage({ type: 'RESET_COMPLETE' });
      break;
    case 'UPDATE_DURATION':
      endTime = Date.now() + msg.duration * 1000;
      break;
    case 'SKIP_TO_NEXT_STAGE':
      clean();
      break;
  }
});
