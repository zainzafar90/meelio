import * as authApi from "./auth.api";
import * as billingApi from "./billing.api";
import * as weatherApi from "./weather.api";
import * as focusSessionsApi from "./focus-sessions.api";
import * as taskApi from "./task.api";
import * as settingsApi from "./settings.api";
import * as calendarTokenApi from "./calendar-tokens.api";
import * as googleCalendarApi from "./google-calendar.api";
import * as calendarApi from "./calendar.api";

const api = {
  auth: authApi,
  billing: billingApi,
  weather: weatherApi,
  focusSessions: focusSessionsApi,
  tasks: taskApi,
  settings: settingsApi,
  calendarTokens: calendarTokenApi,
  googleCalendar: googleCalendarApi,
  calendar: calendarApi,
};

export { api };
