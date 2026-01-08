import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@repo/ui/components/ui/button";
import { toast } from "sonner";
import {
  exportAllData,
  downloadExport,
  importAllData,
  validateImport,
  MeelioExport,
} from "../../../../utils/export-import.utils";
import { clearLocalData } from "../../../../utils/clear-data.utils";
import { Download, Upload, Trash2, AlertTriangle } from "lucide-react";

export function DataSettings({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = await exportAllData();
      downloadExport(data);
      toast.success("Data exported successfully");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!validateImport(data)) {
        toast.error("Invalid backup file format");
        return;
      }

      await importAllData(data as MeelioExport);
      toast.success("Data imported successfully", {
        description: "Refresh the page to see your imported data",
      });
    } catch (error) {
      console.error("Import failed:", error);
      toast.error("Failed to import data", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleClearData = async () => {
    if (
      !confirm(
        "Are you sure you want to clear ALL your data? This action cannot be undone."
      )
    ) {
      return;
    }

    setIsClearing(true);
    try {
      await clearLocalData();
      toast.success("All data cleared successfully");
      onClose();
      window.location.reload();
    } catch (error) {
      console.error("Clear data failed:", error);
      toast.error("Failed to clear data");
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          Manage your data with export and import features. Your data is stored
          locally on this device.
        </p>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border p-4">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-primary/10 p-2">
              <Download className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium">Export Data</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Download all your tasks, notes, settings, and other data as a
                JSON file.
              </p>
              <Button
                onClick={handleExport}
                disabled={isExporting}
                variant="outline"
                size="sm"
                className="mt-3"
              >
                {isExporting ? "Exporting..." : "Export Backup"}
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-primary/10 p-2">
              <Upload className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium">Import Data</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Restore your data from a previously exported backup file. This
                will merge with existing data.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                onClick={handleImportClick}
                disabled={isImporting}
                variant="outline"
                size="sm"
                className="mt-3"
              >
                {isImporting ? "Importing..." : "Import Backup"}
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-4">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-red-100 dark:bg-red-900/50 p-2">
              <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-red-600 dark:text-red-400">
                Clear All Data
              </h3>
              <p className="text-sm text-red-600/70 dark:text-red-400/70 mt-1">
                Permanently delete all your data from this device. This action
                cannot be undone.
              </p>
              <Button
                onClick={handleClearData}
                disabled={isClearing}
                variant="destructive"
                size="sm"
                className="mt-3"
              >
                {isClearing ? "Clearing..." : "Clear All Data"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-muted/50 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium">Offline Storage</h4>
            <p className="text-xs text-muted-foreground mt-1">
              All your data is stored locally using IndexedDB. We recommend
              exporting your data regularly to prevent data loss.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
