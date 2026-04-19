import type { QuickCaptureDraft, QuickCaptureMode } from "@repo/contracts/quick-capture";

export interface NormalizedQuickCaptureDraft extends QuickCaptureDraft {
  canSubmit: boolean;
}

export interface QuickCaptureSubmission {
  mode: QuickCaptureMode;
  title: string;
  content?: string;
}

export const normalizeQuickCaptureDraft = (
  draft: QuickCaptureDraft
): NormalizedQuickCaptureDraft => {
  const value = draft.value.trim();

  return {
    ...draft,
    value,
    canSubmit: value.length > 0,
  };
};

export const createQuickCaptureSubmission = (
  draft: QuickCaptureDraft
): QuickCaptureSubmission | null => {
  const normalized = normalizeQuickCaptureDraft(draft);

  if (!normalized.canSubmit) {
    return null;
  }

  if (normalized.mode === "note") {
    return {
      mode: normalized.mode,
      title: normalized.value,
      content: normalized.value,
    };
  }

  return {
    mode: normalized.mode,
    title: normalized.value,
  };
};
