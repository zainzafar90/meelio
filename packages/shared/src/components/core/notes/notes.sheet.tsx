import { useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/shallow";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/components/ui/sheet";
import { Input } from "@repo/ui/components/ui/input";
import { Button } from "@repo/ui/components/ui/button";
import { PremiumFeature } from "../../common/premium-feature";
import { useDockStore } from "../../../stores/dock.store";
import { useNoteStore } from "../../../stores/note.store";
import NoteEditor, {
  type StoragePort,
} from "./note-editor";
import { db } from "../../../lib/db/meelio.dexie";
import {
  Search,
  Plus,
  Pin,
  Trash2,
  X,
  Volume2,
  VolumeX,
  FileText,
  Clock,
  Menu,
} from "lucide-react";

export function NotesSheet() {
  // ── Store
  const { isNotesVisible, setNotesVisible } = useDockStore(
    useShallow((s) => ({
      isNotesVisible: (s as any).isNotesVisible,
      setNotesVisible: (s as any).setNotesVisible,
    }))
  );

  const {
    notes,
    initializeStore,
    deleteNote,
    togglePinNote,
    enableTypingSound,
    setEnableTypingSound,
  } = useNoteStore(
    useShallow((s) => ({
      notes: s.notes,
      initializeStore: s.initializeStore,
      deleteNote: s.deleteNote,
      togglePinNote: s.togglePinNote,
      enableTypingSound: s.enableTypingSound,
      setEnableTypingSound: s.setEnableTypingSound,
    }))
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [activeInitial, setActiveInitial] = useState<{
    id: string;
    title: string;
    content: string;
    updatedAt: number;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const MAX_NOTES = 500;

  const filteredNotes = useMemo(() => {
    let filtered = [...notes];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          (n.content?.toLowerCase() || "").includes(q)
      );
    }
    filtered.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.updatedAt - a.updatedAt;
    });
    return filtered;
  }, [notes, searchQuery]);

  const selectedNote = useMemo(
    () => notes.find((n) => n.id === selectedNoteId) || null,
    [notes, selectedNoteId]
  );

  useEffect(() => {
    if (isNotesVisible) {
      initializeStore();
    }
  }, [isNotesVisible, initializeStore]);

  useEffect(() => {
    if (!selectedNoteId && notes.length > 0) {
      const n = notes[0];
      setSelectedNoteId(n.id);
      setActiveInitial({ id: n.id, title: n.title, content: n.content || "", updatedAt: n.updatedAt });
    }
  }, [notes, selectedNoteId]);

  const hasMeaningfulContent = (title: string, content: string): boolean => {
    if (title && title.trim().length > 0) return true;
    return content.trim().length > 0;
  };

  const creatingRef = useMemo(() => ({ current: false }), []);

  const makeStoragePortFor = (id: string, initial: { title: string; content: string; updatedAt: number } | null): StoragePort => ({
    load: async (_ignoredId) => {
      if (id.startsWith("draft:")) {
        return initial
          ? { id, title: initial.title, content: initial.content, updatedAt: initial.updatedAt }
          : undefined;
      }
      const n = await db.notes.get(id);
      if (!n) return undefined;
      return { id: n.id, title: n.title, content: n.content || "", updatedAt: n.updatedAt };
    },
    save: async (note) => {
      if (id.startsWith("draft:")) {
        if (!hasMeaningfulContent(note.title, note.content)) return;

        if (creatingRef.current) return;

        creatingRef.current = true;
        try {
          setIsSaving(true);
          const created = await useNoteStore.getState().addNote({ title: note.title || "Untitled", content: note.content });
          if (created) {
            setSelectedNoteId(created.id);
            setActiveInitial({ id: created.id, title: created.title, content: created.content || "", updatedAt: created.updatedAt });
          }
        } finally {
          setIsSaving(false);
          creatingRef.current = false;
        }
        return;
      }

      // Existing note
      setIsSaving(true);
      await useNoteStore.getState().updateNote(id, { title: note.title, content: note.content });
      setIsSaving(false);
    },
  });

  // ── Helpers
  const resetSelection = () => {
    setSelectedNoteId(null);
    setActiveInitial(null);
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const mins = Math.floor(diffMs / 60000);
    const hrs = Math.floor(diffMs / 3600000);
    const days = Math.floor(diffMs / 86400000);

    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hrs < 24) return `${hrs}h ago`;
    if (days < 7) return `${days}d ago`;

    return d.toLocaleDateString();
    };

  // const getNoteColor = (id: string) => {
  //   const colors = [
  //     "from-blue-500/20 to-indigo-500/10",
  //     "from-purple-500/20 to-pink-500/10",
  //     "from-green-500/20 to-teal-500/10",
  //     "from-orange-500/20 to-red-500/10",
  //     "from-cyan-500/20 to-blue-500/10",
  //     "from-rose-500/20 to-purple-500/10",
  //   ];
  //   const hash = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  //   return colors[hash % colors.length];
  // };

  const handleCreateNote = async () => {
    if (notes.length >= MAX_NOTES) {
      alert(`Maximum ${MAX_NOTES} notes reached!`);
      return;
    }
    const draftId = `draft:${crypto.randomUUID()}`;
    setSelectedNoteId(draftId);
    setActiveInitial({ id: draftId, title: "", content: "", updatedAt: Date.now() });
  };

  const handleDeleteNote = (noteId: string) => {
    const n = notes.find((x) => x.id === noteId);
    if (!n) return;
    if (confirm(`Delete "${n.title}"? This cannot be undone.`)) {
      deleteNote(noteId);
      if (selectedNoteId === noteId) {
        const remaining = notes.filter((x) => x.id !== noteId);
        if (remaining.length > 0) {
          const next = remaining[0];
          setSelectedNoteId(next.id);
          setActiveInitial({ id: next.id, title: next.title, content: next.content || "", updatedAt: next.updatedAt });
        } else {
          resetSelection();
        }
      }
    }
  };

  const handleViewNote = (noteId: string) => {
    const n = notes.find((x) => x.id === noteId);
    setSelectedNoteId(noteId);
    // Seed initial from current store snapshot so first load is consistent.
    setActiveInitial(
      n
        ? {
            id: n.id,
            title: n.title,
            content: n.content || "",
            updatedAt: n.updatedAt,
          }
        : null
    );
    if (isSidebarOpen) setSidebarOpen(false);
  };

  const handleTogglePin = (noteId: string) => togglePinNote(noteId);

  // ── Sidebar (list)
  const renderSidebar = () => (
    <div className="flex h-full flex-col border-r border-white/10 w-full max-w-sm">
      <div className="border-b border-white/10 bg-zinc-800/50 p-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="pl-10 pr-10 bg-zinc-900/50 border-white/10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <PremiumFeature requirePro>
            <Button onClick={handleCreateNote} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              New
            </Button>
          </PremiumFeature>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-2">
        {filteredNotes.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center px-4">
            <FileText className="mb-4 h-12 w-12 text-zinc-600" />
            <p className="mb-2 text-zinc-400">{searchQuery ? "No notes found" : "No notes yet"}</p>
            <p className="mb-6 text-sm text-zinc-500">{searchQuery ? "Try a different search" : "Create your first note"}</p>
          </div>
        ) : (
          filteredNotes.map((note) => (
            <div
              key={note.id}
              onClick={() => handleViewNote(note.id)}
              className={`group cursor-pointer rounded-md border border-white/10 bg-zinc-900/50 hover:bg-zinc-900 p-3 transition-colors ${
                selectedNoteId === note.id ? "ring-1 ring-purple-400/40" : ""
              }`}
            >
              <div className="relative flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="mb-1 flex items-center gap-2">
                    <h3 className="truncate font-medium text-white/90">{note.title || "Untitled"}</h3>
                  </div>
                </div>
                <div className="absolute right-0 top-0 flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTogglePin(note.id);
                    }}
                    className="rounded p-1 hover:bg-white/10"
                    title={note.pinned ? "Unpin" : "Pin"}
                  >
                    <Pin
                      className={`h-3.5 w-3.5 ${note.pinned ? "fill-yellow-400 text-yellow-400" : "text-white/60"}`}
                    />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNote(note.id);
                    }}
                    className="rounded p-1 hover:bg-white/10"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-white/60 hover:text-red-400" />
                  </button>
                </div>
              </div>
              <div className="mt-1 flex items-center gap-2 text-[10px] text-white/40">
                <Clock className="h-3 w-3" />
                <span>{formatDate(note.updatedAt)}</span> · <span>{note.pinned && <Pin className="h-3 w-3 flex-shrink-0 fill-yellow-400 text-yellow-400" />}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  // ── Editor view (right panel)
  const renderNoteEditor = () => {
    if (!selectedNoteId) {
      return (
        <div className="flex h-full items-center justify-center text-zinc-500">
          Select a note to start editing
        </div>
      );
    }

    // Prefer DB-backed note for accuracy, fall back to activeInitial/store snapshot
    const seed =
      (selectedNote && {
        id: selectedNote.id,
        title: selectedNote.title || "Untitled",
        content: selectedNote.content || "",
        updatedAt: selectedNote.updatedAt,
      }) || activeInitial;

    if (!seed) return null;

    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-white/10 bg-zinc-800/50 px-4 py-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleTogglePin(selectedNoteId)}
              className="gap-1"
            >
              <Pin
                className={`h-4 w-4 ${selectedNote?.pinned ? "fill-yellow-400 text-yellow-400" : ""}`}
              />
              {selectedNote?.pinned ? "Pinned" : "Pin"}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteNote(selectedNoteId)}
              className="gap-1 hover:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>

          <div className="flex items-center gap-3">
            {isSaving && <span className="text-xs text-green-400">Saving...</span>}
          </div>
        </div>

        <div className="flex-1 overflow-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-zinc-600">
          <NoteEditor
            key={seed.id}
            id={seed.id}
            port={makeStoragePortFor(seed.id, { title: seed.title, content: seed.content, updatedAt: seed.updatedAt })}
            initial={{
              title: seed.title,
              content: seed.content,
              updatedAt: seed.updatedAt,
            }}
            onChange={(title, content) => {
              // Only update if this is still the active note
              setActiveInitial((prev) =>
                prev && prev.id === seed.id ? { ...prev, title, content, updatedAt: Date.now() } : prev
              );
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <Sheet open={isNotesVisible} onOpenChange={setNotesVisible}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-full border-l border-white/10 bg-zinc-900">
        <SheetHeader className="border-b border-white/10 bg-zinc-800/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="sr-only">
              <SheetTitle>Notes</SheetTitle>
              <SheetDescription>{`${filteredNotes.length} notes`}</SheetDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="h-8 w-8 p-0 sm:hidden"
                title="Open list"
              >
                <Menu className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEnableTypingSound(!enableTypingSound)}
                className="h-8 px-3 gap-2"
              >
                {enableTypingSound ? (
                  <>
                    <Volume2 className="h-4 w-4" />
                    <span className="text-xs">Mute sound</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="h-4 w-4" />
                    <span className="text-xs">Unmute sound</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </SheetHeader>

        <div className="relative flex-1 overflow-hidden">
          <div className="flex h-full">
            <div className="hidden sm:flex">{renderSidebar()}</div>
            <div className="flex-1">
              {renderNoteEditor()}
            </div>
          </div>
        </div>

        {/* Mobile sidebar (shadcn sheet) */}
        <Sheet open={isSidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="p-0 w-80 sm:hidden">
            {renderSidebar()}
          </SheetContent>
        </Sheet>
      </SheetContent>
    </Sheet>
  );
}
