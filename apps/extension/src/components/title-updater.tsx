import { useEffect } from 'react';

export const TitleUpdater = () => {
  useEffect(() => {
    const updateTitle = (message: any) => {
      if (message.type === 'UPDATE_TITLE') {
        document.title = message.title;
      }
    };

    chrome.runtime.onMessage.addListener(updateTitle);
    return () => {
      chrome.runtime.onMessage.removeListener(updateTitle);
    };
  }, []);

  return null;
}; 