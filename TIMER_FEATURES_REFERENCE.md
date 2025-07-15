# Timer Features Reference

This document records important features from the unified pomodoro store that are being removed during the timer cleanup. This serves as a reference for future development if these features need to be re-implemented.

## Features from Unified Pomodoro Store (Being Removed)

### 1. Advanced Session Management
- **Session counting**: Tracks completed focus sessions (`sessionCount`)
- **Session completion**: `completeSession()` method to mark sessions as complete
- **Session history**: Database storage of completed sessions with timestamps
- **Auto-advance stages**: `advanceTimer()` method to automatically move between focus/break
- **Session data structure**:
  ```typescript
  {
    id: sessionId,
    timestamp: Date.now(),
    stage: 0 | 1, // 0 = focus, 1 = break
    duration: number,
    completed: boolean
  }
  ```

### 2. User Settings Sync (Pro Users)
- **Server sync**: `changeTimerSettings()` method to sync settings with server
- **User preference loading**: `syncWithUserSettings()` to load user's saved preferences
- **Settings persistence**: API integration for pro users to save settings
- **Auto-start controls**: `toggleAutoStartBreaks()` method
- **Settings structure**:
  ```typescript
  {
    workDuration: number,
    breakDuration: number,
    autoStart: boolean,
    soundOn: boolean,
    notificationSoundId: string,
    notificationSoundEnabled: boolean,
    dailyFocusLimit: number
  }
  ```

### 3. Advanced Focus Tracking
- **Real-time focus tracking**: `trackFocusTime()` method for granular time tracking
- **Focus time increments**: `saveFocusTimeIncrement()` for periodic saves (every 60 seconds)
- **Focus session sync**: `syncFocusTime()` method to sync with server
- **Advanced stats**: 
  ```typescript
  {
    todaysFocusSessions: number,
    todaysBreaks: number,
    todaysFocusTime: number,
    todaysBreakTime: number
  }
  ```

### 4. Enhanced Notifications
- **Notification permissions**: `requestNotificationPermission()` method
- **Sound selection**: `updateNotificationSoundId()` method
- **Notification sound toggle**: `setNotificationSoundEnabled()` method
- **Chrome extension notifications**: Proper chrome.notifications API usage
- **Web notifications**: Fallback to web Notification API

### 5. Data Persistence & Sync
- **Database integration**: Uses IndexedDB for session storage
- **Sync store integration**: Offline sync queue for when online
- **API integration**: Server API calls for data persistence
- **Retry logic**: Failed sync operations are retried up to 3 times
- **Auto-sync**: Automatic sync every 10 minutes

### 6. Pro User Features
- **Advanced daily limits**: Configurable daily focus limits
- **Pro user detection**: Full pro user status integration
- **Settings API integration**: Server-side settings storage
- **Unlimited daily limit**: Pro users have no daily limits

### 7. Timer State Management
- **Timer reinitialization**: `reinitializeTimer()` method
- **State restoration**: Advanced state restoration capabilities
- **Settings reloading**: Dynamic settings reload from server
- **Pause/Resume logic**: Separate pause and resume methods
- **Timer updates**: `updateTimer()` method for real-time updates

### 8. Database Schema
- **Focus sessions table**: Stores completed sessions
- **Focus time tracking**: Minute-by-minute focus time tracking
- **Daily summaries**: `getTodaysSummary()` function
- **Focus time increments**: `addFocusTimeMinute()` function

### 9. Sync Queue System
- **Offline sync**: Queue operations when offline
- **Sync entities**: Separate sync for 'pomodoro' and 'focus-time'
- **Retry mechanism**: Failed operations are retried
- **Batch operations**: Multiple operations batched together

### 10. Advanced Timer Controls
- **Resume vs Start**: Separate `startTimer()`, `pauseTimer()`, `resumeTimer()` methods
- **Stage changing**: `changeStage()` method for manual stage switching
- **Auto-start logic**: Automatic start between stages based on settings
- **Timer duration setting**: `setTimerDuration()` method

## Key Architectural Differences

### Store Architecture
- **subscribeWithSelector**: Uses Zustand middleware for selective subscriptions
- **Version management**: Store version control for migrations
- **Partialize**: Selective state persistence
- **Skip hydration**: Control over hydration process

### Event System
- **Auth store subscription**: Listens to auth changes for settings sync
- **Periodic reset**: Daily reset checking with localStorage
- **Auto-sync intervals**: Automatic sync every 10 minutes

### Platform Handling
- **Chrome extension detection**: Proper chrome API detection
- **Notification fallbacks**: Chrome notifications vs Web notifications
- **Extension-specific features**: Chrome storage, notifications, etc.

## Migration Notes

If these features need to be re-implemented:

1. **Session tracking** can be added back by implementing the session completion flow
2. **Settings sync** requires API integration and pro user detection
3. **Advanced stats** need database schema and tracking logic
4. **Notification enhancements** require permission handling and sound selection
5. **Sync system** needs offline queue and retry logic

## Current Simple Timer Advantages

The unified simple timer that we're keeping has these advantages:
- **Soundscape integration**: Automatic play/pause of soundscapes during focus
- **Simpler architecture**: Easier to understand and maintain
- **Platform abstraction**: Clean separation between web/extension
- **Modern Zustand patterns**: Uses newer Zustand APIs correctly

## Recommendation

The unified simple timer is sufficient for basic timer functionality with soundscape integration. If advanced features are needed in the future, refer to this document and the original `unified-pomodoro.store.ts` file for implementation details.

---

*This document was created during timer cleanup on 2025-01-15 to preserve important features before deletion.*