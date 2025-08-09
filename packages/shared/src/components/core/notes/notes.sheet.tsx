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
import { Icons } from "../../icons";


export function NotesSheet() {
  const { t } = useTranslation();
  const { isNotesVisible, setNotesVisible } = useDockStore(
    useShallow((s) => ({
      isNotesVisible: (s as any).isNotesVisible,
      setNotesVisible: (s as any).setNotesVisible,
    }))
  );

  const { notes, initializeStore, addNote, updateNote } = useNoteStore(
    useShallow((s) => ({
      notes: s.notes,
      initializeStore: s.initializeStore,
      addNote: s.addNote,
      updateNote: s.updateNote,
      
    }))
  );

  useEffect(() => {
    if (isNotesVisible) initializeStore();
  }, [isNotesVisible, initializeStore]);

  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = useMemo(() => notes.find((n) => n.id === activeId) || null, [notes, activeId]);

  const filtered = useMemo(() => {
    if (!query.trim()) return notes;
    const q = query.toLowerCase();
    return notes.filter((n) => n.title.toLowerCase().includes(q) || (n.content || "").toLowerCase().includes(q));
  }, [notes, query]);

  const creatingRef = useRef(false);
  const handleCreate = async () => {
    if (creatingRef.current) return;
    creatingRef.current = true;
    try {
      const created = await addNote({ title: "Untitled" });
      if (created) setActiveId(created.id);
    } finally {
      creatingRef.current = false;
    }
  };

  const saveTimer = useRef<number | null>(null);
  const scheduleSave = (id: string, data: { title?: string; content?: string | null }) => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      updateNote(id, data as any);
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
                    <div className="mb-3 text-sm font-medium opacity-95">{n.title || "Untitled"}</div>
                    {n.content && (
                      <div className="mb-3 whitespace-pre-wrap text-xs/5 opacity-80">{n.content}</div>
                    )}
                    <div className="text-[11px] opacity-70">{new Date(n.updatedAt).toLocaleDateString()}</div>
                  </button>
                ))}
              </div>
              <PremiumFeature requirePro>
                <Button onClick={async () => await handleCreate()} className="fixed bottom-6 right-6 h-12 w-12 rounded-full p-0 shadow-lg">
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
                <div className="text-sm text-muted-foreground">{new Date(active.updatedAt).toLocaleDateString()}</div>
                <div className="ml-auto">
                  <Button variant="ghost" size="sm" onClick={() => scheduleSave(active.id, { pinned: !(active as any).pinned } as any)} title={t("notes.pin", { defaultValue: "Pin" })}>
                    <Icons.star className={`h-4 w-4 ${(active as any).pinned ? 'text-yellow-400' : 'text-muted-foreground'}`} />
                  </Button>
                </div>
              </div>
              <Input
                defaultValue={active.title}
                onChange={(e) => scheduleSave(active.id, { title: e.target.value })}
                className="border-none bg-transparent px-0 text-2xl font-semibold"
                placeholder={t("notes.title.placeholder", { defaultValue: "Untitled" })}
              />
              <Textarea
                defaultValue={active.content || ""}
                onChange={(e) => scheduleSave(active.id, { content: e.target.value })}
                className="min-h-[55vh] resize-none border-none bg-transparent px-0"
                placeholder={t("notes.content.placeholder", { defaultValue: "Start writing..." })}
              />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

