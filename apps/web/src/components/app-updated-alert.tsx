import { useRegisterSW } from "virtual:pwa-register/react";

import { useUpdateAlertStore } from "@/stores/update-alert-store";

export function AppUpdatedAlert() {
  const { showUpdateAlert, setShowUpdateAlert } = useUpdateAlertStore();

  const { updateServiceWorker } = useRegisterSW();

  const handleRefresh = async () => {
    setShowUpdateAlert(false);
    await updateServiceWorker(true);
  };

  if (!showUpdateAlert) return null;

  return (
    <div
      aria-live="assertive"
      className="pointer-events-none fixed right-2 top-2 flex items-end sm:items-start sm:p-6 z-50 max-w-md w-full"
    >
      <div className="flex w-full flex-col items-center space-y-4 sm:items-end">
        <div className="pointer-events-auto flex w-full max-w-md divide-x divide-gray-200 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 transition data-[closed]:data-[enter]:translate-y-2 data-[enter]:transform data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-100 data-[enter]:ease-out data-[leave]:ease-in data-[closed]:data-[enter]:sm:translate-x-2 data-[closed]:data-[enter]:sm:translate-y-0">
          <div className="flex w-0 flex-1 items-start p-4">
            <div className="flex-shrink-0 pt-0.5">
              <img
                alt="Meelio logo"
                src="./logo.png"
                className="h-10 w-10 rounded-full"
              />
            </div>
            <div className="ml-3 w-0 flex-1">
              <p className="text-sm font-medium text-gray-900">
                Update Available
              </p>
              <p className="mt-1 text-sm text-gray-500">
                A new version of Meelio is available. Please refresh.
              </p>
            </div>
          </div>
          <div className="flex">
            <div className="flex flex-col divide-y divide-gray-200">
              <div className="flex h-0 flex-1">
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="flex w-full items-center justify-center rounded-none rounded-tr-lg border border-transparent px-4 py-3 text-sm font-medium text-orange-500 hover:text-orange-600 focus:z-10 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  Refresh
                </button>
              </div>
              <div className="flex h-0 flex-1">
                <button
                  type="button"
                  onClick={() => setShowUpdateAlert(false)}
                  className="flex w-full items-center justify-center rounded-none rounded-br-lg border border-transparent px-4 py-3 text-sm font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
