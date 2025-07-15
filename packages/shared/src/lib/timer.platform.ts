// Platform abstraction for timer background processing
export interface TimerPlatform {
  sendMessage(message: any): void;
  onMessage(callback: (message: any) => void): () => void;
  showNotification(title: string, message: string): void;
}

// Chrome Extension implementation
export class ChromeTimerPlatform implements TimerPlatform {
  sendMessage(message: any): void {
    if (chrome?.runtime?.sendMessage) {
      chrome.runtime.sendMessage(message);
    }
  }

  onMessage(callback: (message: any) => void): () => void {
    const listener = (message: any) => {
      if (message.type && message.type.startsWith('timer:')) {
        callback(message);
      }
    };
    
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }

  showNotification(title: string, message: string): void {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('public/icon.png'),
      title,
      message,
    });
  }
}

// Factory function to get the appropriate platform (extension only)
export function getTimerPlatform(): TimerPlatform {
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
    return new ChromeTimerPlatform();
  } else {
    throw new Error('Timer platform only supports Chrome extension. Web apps should use their own platform implementation.');
  }
}