import { useUpdateAlertStore } from "@/stores/update-alert-store";
import { VERSION } from "@/version";
import { useRegisterSW } from "virtual:pwa-register/react";

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
      <div className="pointer-events-auto max-w-full w-full md:w-96 overflow-hidden rounded-none sm:rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 transition data-[closed]:data-[enter]:translate-y-2 data-[enter]:transform data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-100 data-[enter]:ease-out data-[leave]:ease-in data-[closed]:data-[enter]:sm:translate-x-2 data-[closed]:data-[enter]:sm:translate-y-0">
        <div className="pointer-events-auto flex w-full max-w-full rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 transition data-[closed]:data-[enter]:translate-y-2 data-[enter]:transform data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-100 data-[enter]:ease-out data-[leave]:ease-in data-[closed]:data-[enter]:sm:translate-x-2 data-[closed]:data-[enter]:sm:translate-y-0">
          <div className="w-0 flex-1 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <img
                  alt="Meelio logo"
                  src="./logo.png"
                  className="h-10 w-10 rounded-full"
                />
              </div>
              <div className="ml-3 w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Update Available (v{VERSION})
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  A new version of Meelio is available. Please refresh.
                </p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-gray-200">
            <button
              type="button"
              onClick={handleRefresh}
              className="flex w-full items-center justify-center rounded-none rounded-r-lg border border-transparent p-4 text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:ring focus:ring-blue-500"
            >
              Reload
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
