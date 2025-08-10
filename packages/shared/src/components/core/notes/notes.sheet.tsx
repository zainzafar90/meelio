import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/shallow";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@repo/ui/components/ui/sheet";
import { Input } from "@repo/ui/components/ui/input";
import { Textarea } from "@repo/ui/components/ui/textarea";
import { Button } from "@repo/ui/components/ui/button";
import { PremiumFeature } from "../../common/premium-feature";
import { useDockStore } from "../../../stores/dock.store";
import { useNoteStore } from "../../../stores/note.store";
import { SyncStatus } from "../../sync-status";
import { playTypewriterSound } from "../../../utils/sound.utils";
import { Icons } from "../../icons";
import { Volume2, VolumeX } from "lucide-react";


export function NotesSheet() {
  const { t } = useTranslation();
  const { isNotesVisible, setNotesVisible } = useDockStore(
    useShallow((s) => ({
      isNotesVisible: (s as any).isNotesVisible,
      setNotesVisible: (s as any).setNotesVisible,
    }))
  );

  const { notes, initializeStore, addNote, updateNote, deleteNote, togglePinNote, enableTypingSound, setEnableTypingSound } = useNoteStore(
    useShallow((s) => ({
      notes: s.notes,
      initializeStore: s.initializeStore,
      addNote: s.addNote,
      updateNote: s.updateNote,
      deleteNote: s.deleteNote,
      togglePinNote: s.togglePinNote,
      enableTypingSound: s.enableTypingSound,
      setEnableTypingSound: s.setEnableTypingSound,
    }))
  );


  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draftContent, setDraftContent] = useState<string>("");
  const active = useMemo(() => notes.find((n) => n.id === activeId) || null, [notes, activeId]);
  // Limits
  const MAX_NOTE_CHARS = 10000; // characters
  const MAX_NOTES = 500;

  const creatingRef = useRef(false);
  const saveTimer = useRef<number | null>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return notes;
    const q = query.toLowerCase();
    return notes.filter((n) => n.title.toLowerCase().includes(q) || (n.content || "").toLowerCase().includes(q));
  }, [notes, query]);

  const formatRelativeTime = (dateMs: number) => {
    try {
      const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
      const now = Date.now();
      const diff = dateMs - now;
      const sec = Math.round(diff / 1000);
      const min = Math.round(sec / 60);
      const hour = Math.round(min / 60);
      const day = Math.round(hour / 24);
      const month = Math.round(day / 30);
      const year = Math.round(month / 12);
      if (Math.abs(sec) < 45) return rtf.format(sec, "second");
      if (Math.abs(min) < 45) return rtf.format(min, "minute");
      if (Math.abs(hour) < 22) return rtf.format(hour, "hour");
      if (Math.abs(day) < 26) return rtf.format(day, "day");
      if (Math.abs(month) < 11) return rtf.format(month, "month");
      return rtf.format(year, "year");
    } catch {
      return new Date(dateMs).toLocaleString();
    }
  };

  // Load saved text into draft on note change
  useEffect(() => {
    setDraftContent(active?.content || "");
  }, [active?.id]);


  useEffect(() => {
    if (isNotesVisible) initializeStore();
  }, [isNotesVisible, initializeStore]);


  const handleCreate = async () => {
    if (creatingRef.current) return;
    creatingRef.current = true;
    try {
      if (notes.length >= MAX_NOTES) {
        return;
      }
      const created = await addNote({ title: "Untitled" });
      if (created) setActiveId(created.id);
    } finally {
      creatingRef.current = false;
    }
  };

  const truncateToChars = (text: string, maxChars: number) =>
    typeof text === "string" ? text.slice(0, maxChars) : text;

  const scheduleSave = (id: string, data: { title?: string; content?: string | null }) => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      if (typeof data.content === "string") {
        const trimmed = truncateToChars(data.content, MAX_NOTE_CHARS);
        updateNote(id, { ...data, content: trimmed } as any);
      } else {
        updateNote(id, data as any);
      }
    }, 500);
  };

  const palette = [
    "bg-rose-300/35 border-rose-400/40 text-rose-50",
    "bg-amber-300/35 border-amber-400/40 text-amber-50",
    "bg-lime-300/35 border-lime-400/40 text-lime-50",
    "bg-cyan-300/35 border-cyan-400/40 text-cyan-50",
    "bg-violet-300/35 border-violet-400/40 text-violet-50",
    "bg-pink-300/35 border-pink-400/40 text-pink-50",
  ];
  const colorFor = (id: string) => palette[Math.abs(id.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % palette.length];

  const getCharCount = () => (draftContent || "").length;

  // No markdown preview; plain text only

  const NoteCharCount = ({ valueChars }: { valueChars: number }) => (
    <span className="text-xs text-white/70">{valueChars}/{MAX_NOTE_CHARS}</span>
  );

  return (
    <Sheet open={isNotesVisible} onOpenChange={setNotesVisible}>
      <SheetContent side="right"         className="flex w-full flex-col gap-0 p-0 sm:max-w-xl border-l border-white/10 bg-zinc-900 backdrop-blur-xl">
        <SheetHeader className="px-6 pt-6">
          <div className="flex items-center justify-between">
            <SheetTitle>{t("notes.sheet.title", { defaultValue: "Notes" })}</SheetTitle>
            <SheetDescription>
            {t("notes.sheet.description", { defaultValue: "Capture quick notes" })}
          </SheetDescription>
            <SyncStatus entityType="note" />
          </div>
        </SheetHeader>
        <div className="relative flex-1 overflow-auto p-4">
          {!active ? (
            <>
              <div className="mb-4 flex items-center gap-2">
                <div className="relative flex-1 w-full">
                  <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("notes.search", { defaultValue: "Search notes" })} className="pl-8" />
                  <Icons.post className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="columns-2 gap-4 [column-fill:_balance-all]">
                {filtered.map((n) => (
                  <button
                    key={n.id}
                    className={`mb-4 inline-block w-full align-top break-inside-avoid rounded-lg border p-4 text-left shadow-sm transition hover:brightness-110 ${colorFor(n.id)}`}
                    onClick={() => setActiveId(n.id)}
                  >
                    <div className="mb-3 flex items-center gap-2 text-sm font-medium opacity-95">
                      <span className="truncate">{n.title || "Untitled"}</span>
                      {n.pinned && <Icons.pin className="h-3.5 w-3.5 text-yellow-400" />}
                    </div>
                    {n.content && (
                      <div className="mb-3 text-xs/5 opacity-90 max-h-[300px] overflow-hidden whitespace-pre-wrap">
                        {n.content}
                      </div>
                    )}
                    <div className="text-[11px] opacity-70">{formatRelativeTime(n.updatedAt)}</div>
                  </button>
                ))}
              </div>
              <PremiumFeature requirePro>
                <Button onClick={async () => await handleCreate()} disabled={notes.length >= MAX_NOTES} className="fixed bottom-6 right-6 h-12 w-12 rounded-full p-0 shadow-lg">
                  <Icons.add className="h-6 w-6" />
                </Button>
              </PremiumFeature>
            </>
          ) : (
            <div className="mx-auto flex h-full w-full flex-col gap-4 pt-2">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setActiveId(null)} className="h-8 w-8 p-0">
                  <Icons.chevronLeft className="h-5 w-5" />
                </Button>
                <div className="text-sm text-muted-foreground">{formatRelativeTime(active.updatedAt)}</div>
                <div className="ml-auto flex items-center gap-2">
                  <NoteCharCount valueChars={getCharCount()} />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEnableTypingSound(!enableTypingSound)}
                    title={enableTypingSound ? t("common.actions.mute", { defaultValue: "Mute" }) : t("common.actions.unmute", { defaultValue: "Unmute" })}
                    aria-label={enableTypingSound ? t("common.actions.mute", { defaultValue: "Mute" }) : t("common.actions.unmute", { defaultValue: "Unmute" })}
                  >
                    {enableTypingSound ? (
                      <Volume2 className="h-4 w-4" />
                    ) : (
                      <VolumeX className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => togglePinNote(active.id)}
                    title={(active as any).pinned ? t("notes.unpin", { defaultValue: "Unpin" }) : t("notes.pin", { defaultValue: "Pin" })}
                    aria-label={(active as any).pinned ? t("notes.unpin", { defaultValue: "Unpin" }) : t("notes.pin", { defaultValue: "Pin" })}
                  >
                    <Icons.pin className={`h-4 w-4 ${(active as any).pinned ? 'text-yellow-400' : 'text-muted-foreground'}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm(t("notes.delete.confirm", { defaultValue: "Are you sure you want to delete this note?" }))) {
                        deleteNote(active.id);
                        setActiveId(null);
                      }
                    }}
                    title={t("notes.delete", { defaultValue: "Delete note" })}
                    aria-label={t("notes.delete", { defaultValue: "Delete note" })}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Icons.close className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Input
                defaultValue={active.title}
                onChange={(e) => scheduleSave(active.id, { title: e.target.value })}
                className="border-none bg-transparent px-0 text-2xl font-semibold focus-visible:ring-0 focus-visible:outline-none"
                onKeyDown={(e) => {
                  if (enableTypingSound) void playTypewriterSound(e.key);
                }}
                placeholder={t("notes.title.placeholder", { defaultValue: "Untitled" })}
              />
              <Textarea
                value={draftContent}
                onChange={(e) => {
                  const value = e.target.value.slice(0, MAX_NOTE_CHARS);
                  setDraftContent(value);
                  scheduleSave(active.id, { content: value });
                }}
                className="h-full resize-none border-none bg-transparent px-0 whitespace-pre-wrap focus-visible:ring-0 focus-visible:outline-none"
                onKeyDown={(e) => {
                  if (enableTypingSound) void playTypewriterSound(e.key);
                }}
                placeholder={t("notes.content.placeholder", { defaultValue: "Start writing..." })}
                maxLength={MAX_NOTE_CHARS}
              />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

