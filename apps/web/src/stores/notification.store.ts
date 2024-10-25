import { nanoid } from "nanoid";
import { create } from "zustand";

/*
|--------------------------------------------------------------------------
| Notification
|--------------------------------------------------------------------------
| Type definition for a notification.
|
| @typedef {Object} Notification
| @property {string} id - The unique identifier for the notification.
| @property {"info"|"warning"|"success"|"error"} type - The type of the notification.
| @property {string} title - The title of the notification.
| @property {string} [message] - An optional message for the notification.
*/
export type Notification = {
  id: string;
  type: "info" | "warning" | "success" | "error";
  title: string;
  message?: string;
};

/**
 * Type definition for the notifications store.
 * @typedef {Object} NotificationsStore
 */
type NotificationsStore = {
  /**
   * @property {Notification[]} notifications - List of active notifications.
   */
  notifications: Notification[];
  /**
   * Add a new notification to the store.
   * @param {Omit<Notification, "id">} notification - The notification to be added (without id).
   */
  addNotification: (notification: Omit<Notification, "id">) => void;
  /**
   * Dismiss a notification by its ID.
   * @param {string} id - The ID of the notification to be dismissed.
   */
  dismissNotification: (id: string) => void;
};

/**
 * Hook to interact with the notification store.
 * Provides methods to add and dismiss notifications.
 */
export const useNotificationStore = create<NotificationsStore>((set) => ({
  notifications: [],
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        { id: nanoid(), ...notification },
      ],
    })),
  dismissNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter(
        (notification) => notification.id !== id
      ),
    })),
}));
