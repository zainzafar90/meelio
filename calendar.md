📋 Google Calendar Production Setup Todo

  High Priority Tasks:

  1. Setup Google Cloud Console for Production
    - Create or configure production Google Cloud
  project
    - Enable Google Calendar API for production project
    - Generate production OAuth 2.0 credentials
  2. Add Production Redirect URI to Google OAuth Client
    - Add https://api.meelio.io/v1/calendar/callback to
  authorized redirect URIs
    - Ensure production domain is verified
  3. Submit Google App Verification for Public Calendar 
  Access
    - Complete OAuth consent screen with app details
    - Upload app logo (120x120px minimum)
    - Provide detailed justification for
  calendar.readonly scope
    - Submit verification application to Google
  4. Create Privacy Policy and Terms of Service Pages
    - Write privacy policy explaining calendar data
  usage
    - Create terms of service for the application
    - Host pages on your production domain
    - Link them in Google OAuth consent screen

  Medium Priority Tasks:

  5. Update Environment Variables for Production
    - Set production GOOGLE_CLIENT_ID and
  GOOGLE_CLIENT_SECRET
    - Configure production CLIENT_URL
    - Update database connection for production
  6. Test Calendar Integration in Production Environment
    - Verify OAuth flow works with production URLs
    - Test token refresh functionality
    - Confirm events are fetched and displayed correctly

  ---
  📁 Calendar-Related Files Inventory

  Backend Files:

  apps/api/src/
  ├── config/config.ts                           #
  Google OAuth credentials
  ├── db/schema/calendar-token.schema.ts          #
  Database schema for tokens
  ├── lib/google-calendar.ts                     #
  Google API integration
  ├── modules/calendar/
  │   ├── index.ts                               #
  Module exports
  │   └── calendar.controller.ts                # OAuth
  flow handlers
  └── routes/v1/
      └── calendar.routes.ts                     # OAuth and token
        routes (/auth, /callback, /tokens)

  Frontend Files:

  packages/shared/src/
  ├── api/
  │   ├── calendar.api.ts                       # Auth
  URL & token status API
  │   └── google-calendar.api.ts                # Google
   Calendar events API
  ├── components/core/calendar/
  │   ├── index.ts                              #
  Component exports
  │   ├── calendar.sheet.tsx                    #
  Connect/disconnect UI
  │   └── calendar-badge.tsx                    #
  Time-until-event badge
  ├── components/core/dock/components/
  │   └── calendar.dock.tsx                     #
  Calendar icon with badge
  ├── providers/
  │   └── calendar-provider.tsx                 # OAuth
  callback handler
  └── stores/
      └── calendar-token.store.ts                # Token
   & events state management

  Key Configuration:

  - OAuth Scopes: calendar.readonly
  - Token Storage: PostgreSQL with auto-refresh
  - Event Caching: 1-hour localStorage persistence
  - API Limits: 300 events, 30 days ahead
  - Badge Display: Minutes until next event

  All calendar functionality is centralized in these
  files with clean separation between authentication,
  data fetching, and UI components.