import * as authApi from "./auth.api";
import * as billingApi from "./billing.api";
import * as weatherApi from "./weather.api";
import * as focusSessionsApi from "./focus-sessions.api";
import * as taskApi from "./task.api";
import * as settingsApi from "./settings.api";
import * as googleCalendarApi from "./google-calendar.api";
import * as calendarApi from "./calendar.api";
import * as categoryApi from "./category.api";
import * as noteApi from "./note.api";

const api = {
  auth: authApi,
  billing: billingApi,
  weather: weatherApi,
  focusSessions: focusSessionsApi,
  tasks: taskApi,
  settings: settingsApi,
  googleCalendar: googleCalendarApi,
  calendar: calendarApi,
  categories: categoryApi,
  notes: noteApi,
};

export { api };
