import type {
  QuickCaptureDraft,
  QuickCaptureMode,
  QuickCaptureSubmissionResult,
} from "@repo/contracts/quick-capture";
import { createQuickCaptureSubmission, normalizeQuickCaptureDraft } from "@repo/core/quick-capture";
import { create } from "zustand";

export interface SubmitQuickCaptureTaskInput {
  title: string;
}

export interface SubmitQuickCaptureNoteInput {
  title: string;
  content?: string;
}

export interface CreateQuickCaptureStoreInput {
  submitTask: (
    input: SubmitQuickCaptureTaskInput
  ) => Promise<Omit<QuickCaptureSubmissionResult, "mode">>;
  submitNote: (
    input: SubmitQuickCaptureNoteInput
  ) => Promise<Omit<QuickCaptureSubmissionResult, "mode">>;
}

export interface QuickCaptureState {
  draft: QuickCaptureDraft;
  canSubmit: boolean;
  isSubmitting: boolean;
  error: string | null;
  lastSubmission: QuickCaptureSubmissionResult | null;
  setMode: (mode: QuickCaptureMode) => void;
  setValue: (value: string) => void;
  reset: () => void;
  submit: () => Promise<QuickCaptureSubmissionResult | null>;
}

const createDraft = (mode: QuickCaptureMode = "task"): QuickCaptureDraft => ({
  mode,
  value: "",
});

export const createQuickCaptureStore = ({
  submitTask,
  submitNote,
}: CreateQuickCaptureStoreInput) =>
  create<QuickCaptureState>()((set, get) => ({
    draft: createDraft(),
    canSubmit: false,
    isSubmitting: false,
    error: null,
    lastSubmission: null,
    setMode: (mode) =>
      set((state) => {
        const draft = {
          ...state.draft,
          mode,
        };

        return {
          draft,
          canSubmit: normalizeQuickCaptureDraft(draft).canSubmit,
        };
      }),
    setValue: (value) =>
      set((state) => {
        const draft = {
          ...state.draft,
          value,
        };

        return {
          draft,
          canSubmit: normalizeQuickCaptureDraft(draft).canSubmit,
          error: null,
        };
      }),
    reset: () =>
      set((state) => ({
        draft: createDraft(state.draft.mode),
        canSubmit: false,
        isSubmitting: false,
        error: null,
      })),
    submit: async () => {
      const submission = createQuickCaptureSubmission(get().draft);

      if (!submission) {
        set({ canSubmit: false });
        return null;
      }

      set({ isSubmitting: true, error: null });

      try {
        const created =
          submission.mode === "note"
            ? await submitNote({
                title: submission.title,
                content: submission.content,
              })
            : await submitTask({
                title: submission.title,
              });

        const result: QuickCaptureSubmissionResult = {
          mode: submission.mode,
          ...created,
        };

        set({
          draft: createDraft(get().draft.mode),
          canSubmit: false,
          isSubmitting: false,
          lastSubmission: result,
        });

        return result;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to submit quick capture";

        set({
          isSubmitting: false,
          error: message,
        });

        return null;
      }
    },
  }));
