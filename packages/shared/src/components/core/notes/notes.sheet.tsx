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
import { SyncStatus } from "../../sync-status";
import MarkdownInlineEditor, {
  type StoragePort,
  type MarkdownNote,
} from "./markdown-inline-editor";
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
    addNote,
    updateNote,
    deleteNote,
    togglePinNote,
    enableTypingSound,
    setEnableTypingSound,
  } = useNoteStore(
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

  // ── UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [activeInitial, setActiveInitial] = useState<{
    id: string;
    title: string;
    content: string;
    updatedAt: number;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const MAX_NOTES = 500;

  // ── Derived
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

  // ── Open/Init
  useEffect(() => {
    if (isNotesVisible) {
      initializeStore();
    }
  }, [isNotesVisible, initializeStore]);

  // Default selection when notes load
  useEffect(() => {
    if (!selectedNoteId && notes.length > 0) {
      const n = notes[0];
      setSelectedNoteId(n.id);
      setActiveInitial({ id: n.id, title: n.title, content: n.content || "", updatedAt: n.updatedAt });
    }
  }, [notes, selectedNoteId]);

  // ── Storage adapter (stable, no stale closures)
  const storageAdapter = useMemo<StoragePort>(() => {
    return {
      load: async (id) => {
        const st = useNoteStore.getState();
        const n = st.notes.find((x) => x.id === id);
        if (!n) return undefined;
        return {
          id: n.id,
          title: n.title,
          body: n.content || "",
          updatedAt: n.updatedAt,
        };
      },
      save: async (md) => {
        setIsSaving(true);
        await useNoteStore
          .getState()
          .updateNote(md.id, { title: md.title, content: md.body });
        setIsSaving(false);
      },
    };
  }, []);

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
  const getNotePreview = (content?: string | null) => {
    if (!content) return "Empty note";
    
    // Strip HTML tags and extract plain text
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = content;
    const textContent = tempDiv.textContent || tempDiv.innerText || "";
    
    // Split into lines and get first two non-empty lines
    const lines = textContent
      .split(/\n+/)
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    if (lines.length === 0) return "Empty note";
    
    const [firstLine] = lines;
    
    return firstLine.substring(0, 150);
  };
  const getNoteColor = (id: string) => {
    const colors = [
      "from-blue-500/20 to-indigo-500/10",
      "from-purple-500/20 to-pink-500/10",
      "from-green-500/20 to-teal-500/10",
      "from-orange-500/20 to-red-500/10",
      "from-cyan-500/20 to-blue-500/10",
      "from-rose-500/20 to-purple-500/10",
    ];
    const hash = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // ── Actions
  const handleCreateNote = async () => {
    if (notes.length >= MAX_NOTES) {
      alert(`Maximum ${MAX_NOTES} notes reached!`);
      return;
    }
    const n = await addNote({ title: "", content: "" });
    if (!n) return;

    // Use the freshly created note as initial to avoid “first edit not saving”.
    setSelectedNoteId(n.id);
    setActiveInitial({
      id: n.id,
      title: n.title,
      content: n.content || "",
      updatedAt: n.updatedAt,
    });
  };

  const handleDeleteNote = (noteId: string) => {
    const n = notes.find((x) => x.id === noteId);
    if (!n) return;
    if (confirm(`Delete "${n.title}"? This cannot be undone.`)) {
      deleteNote(noteId);
      if (selectedNoteId === noteId) {
        // Select next available note
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
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="mb-1 flex items-center gap-2">
                    <h3 className="truncate font-medium text-white/90">{note.title || "Untitled"}</h3>
                    {note.pinned && (
                      <Pin className="h-3 w-3 flex-shrink-0 fill-yellow-400 text-yellow-400" />
                    )}
                  </div>
                  <p className="text-xs text-white/50 line-clamp-2">{getNotePreview(note.content)}</p>
                </div>
                <div className="flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
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
                <span>{formatDate(note.updatedAt)}</span>
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

    const seed =
      activeInitial ||
      (selectedNote && {
        id: selectedNote.id,
        title: selectedNote.title || "Untitled",
        content: selectedNote.content || "",
        updatedAt: selectedNote.updatedAt,
      });

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
          <MarkdownInlineEditor
            key={seed.id}
            id={seed.id}
            port={storageAdapter}
            initial={{
              title: seed.title,
              body: seed.content,
              updatedAt: seed.updatedAt,
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <Sheet open={isNotesVisible} onOpenChange={setNotesVisible}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-6xl border-l border-white/10 bg-zinc-900">
        <SheetHeader className="border-b border-white/10 bg-zinc-800/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle>Notes</SheetTitle>
              <SheetDescription>{`${filteredNotes.length} notes`}</SheetDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEnableTypingSound(!enableTypingSound)}
                className="h-8 w-8 p-0"
              >
                {enableTypingSound ? (
                  <Volume2 className="h-4 w-4" />
                ) : (
                  <VolumeX className="h-4 w-4" />
                )}
              </Button>
              <SyncStatus entityType="note" />
            </div>
          </div>
        </SheetHeader>

        <div className="relative flex-1 overflow-hidden">
          <div className="flex h-full">
            {renderSidebar()}
            <div className="flex-1">
              {renderNoteEditor()}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
