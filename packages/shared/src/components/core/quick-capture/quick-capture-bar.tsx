import { KeyboardEvent } from "react";
import { useShallow } from "zustand/shallow";

import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";

import { useQuickCaptureStore } from "../../../stores/quick-capture.store";

export const QuickCaptureBar = () => {
  const {
    draft,
    canSubmit,
    isSubmitting,
    error,
    lastSubmission,
    setMode,
    setValue,
    submit,
  } = useQuickCaptureStore(
    useShallow((state) => ({
      draft: state.draft,
      canSubmit: state.canSubmit,
      isSubmitting: state.isSubmitting,
      error: state.error,
      lastSubmission: state.lastSubmission,
      setMode: state.setMode,
      setValue: state.setValue,
      submit: state.submit,
    }))
  );

  const handleSubmit = async () => {
    await submit();
  };

  const handleKeyDown = async (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    await handleSubmit();
  };

  const placeholder =
    draft.mode === "task"
      ? "Capture the next task worth doing"
      : "Capture a note before it slips away";

  const feedback = error
    ? error
    : lastSubmission
      ? `${
          lastSubmission.mode === "task" ? "Task" : "Note"
        } added: ${lastSubmission.createdTitle}`
      : "Use capture to add a task or note without leaving the dashboard.";

  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-black/15 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.24em] text-white/45">
          Quick Capture
        </p>
        <div className="flex flex-wrap gap-2">
        {(["task", "note"] as const).map((mode) => {
          const active = draft.mode === mode;

          return (
            <Button
              key={mode}
              type="button"
              onClick={() => setMode(mode)}
              className={
                active
                  ? "h-8 rounded-lg bg-white text-black hover:bg-white/90"
                  : "h-8 rounded-lg border border-white/10 bg-transparent text-white hover:bg-white/10"
              }
            >
              {mode === "task" ? "Task" : "Note"}
            </Button>
          );
        })}
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={draft.value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="h-11 border-white/10 bg-white/5 text-white placeholder:text-white/35"
        />
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          className="h-11 rounded-xl bg-white text-black hover:bg-white/90 sm:min-w-[128px]"
        >
          {isSubmitting ? "Saving..." : "Add"}
        </Button>
      </div>
      <p className={`text-xs ${error ? "text-rose-200/80" : "text-white/50"}`}>
        {feedback}
      </p>
    </div>
  );
};
