# Module Standardization Plan

## Current Status (as of latest analysis)

### Fully Object-Based Modules (✅)
1. background
2. billing
3. mantra
4. note
5. pomodoro
6. soundscapes
7. subscription
8. sync
9. tasks
10. user

### Modules Needing Conversion (❌)
1. auth (Controller & Service)
2. cookies (Service only)
3. focus-session (Controller & Service)
4. lemon-squeezy (Service only)
5. permissions (Service only)
6. site-blocker (Controller & Service)
7. tab-stash (Controller & Service)
8. verification-token (Service only)
9. weather-cache (Controller & Service)
10. webhooks (Service only)

### Special Cases
- email (Object-Based service, no controller needed)
- paginate (Utility module, no conversion needed)

## Standardization Rules
1. All modules should follow object-based pattern
2. Export pattern should use `export *` from individual files
3. Each module should have:
   - index.ts (using export * pattern)
   - [module].controller.ts (if needed)
   - [module].service.ts
   - [module].validation.ts (if needed)
   - [module].routes.ts (if needed)

## Priority Order for Conversion
1. High Priority (Core Features)
   - auth
   - focus-session
   - site-blocker
   - tab-stash

2. Medium Priority (Supporting Features)
   - weather-cache
   - cookies
   - permissions
   - verification-token

3. Low Priority (Optional Features)
   - lemon-squeezy
   - webhooks

## Implementation Notes
- Each conversion should include proper TypeScript types
- Maintain existing functionality while improving code structure
- Add JSDoc comments for better documentation
- Ensure proper error handling
- Follow existing patterns from successful conversions (e.g., tasks, mantra, soundscapes)

## Progress Tracking
- ✅ Completed: 10 modules
- ❌ Pending: 10 modules
- ⚪ Special Cases: 2 modules

Total Progress: 45% Complete 