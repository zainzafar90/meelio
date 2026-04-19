export type QuickCaptureMode = "task" | "note";

export interface QuickCaptureDraft {
  mode: QuickCaptureMode;
  value: string;
}

export interface QuickCaptureSubmissionResult {
  mode: QuickCaptureMode;
  createdId: string;
  createdTitle: string;
}
