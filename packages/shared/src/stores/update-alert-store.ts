import { create } from "zustand";

interface UpdateAlertState {
  showUpdateAlert: boolean;
  setShowUpdateAlert: (show: boolean) => void;
}

export const useUpdateAlertStore = create<UpdateAlertState>((set) => ({
  showUpdateAlert: false,
  setShowUpdateAlert: (show) => set({ showUpdateAlert: show }),
}));
