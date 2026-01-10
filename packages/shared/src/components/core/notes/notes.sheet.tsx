import { useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/shallow";
import { AnimatePresence, motion } from "framer-motion";
import { Input } from "@repo/ui/components/ui/input";
import { Button } from "@repo/ui/components/ui/button";
import { PremiumFeature } from "../../common/premium-feature";
import { useDockStore } from "../../../stores/dock.store";
import { useNoteStore } from "../../../stores/note.store";
import NoteEditor, { type StoragePort } from "./note-editor";
import { db } from "../../../lib/db/meelio.dexie";
import { Search, Plus, Pin, Trash2, X, FileText, ChevronLeft, Keyboard } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/components/ui/popover";
import { getModifierKey } from "../../../utils/common.utils";

export function NotesSheet() {
  const { isNotesVisible, setNotesVisible } = useDockStore(
    useShallow((s) => ({
      isNotesVisible: (s as any).isNotesVisible,
      setNotesVisible: (s as any).setNotesVisible,
    }))
  );

  const { notes, initializeStore, deleteNote, togglePinNote } = useNoteStore(
    useShallow((s) => ({
      notes: s.notes,
      initializeStore: s.initializeStore,
      deleteNote: s.deleteNote,
      togglePinNote: s.togglePinNote,
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
  const [showEditor, setShowEditor] = useState(false);

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
    } else {
      setShowEditor(false);
      setSelectedNoteId(null);
    }
  }, [isNotesVisible, initializeStore]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isNotesVisible) return;

      const isMod = e.metaKey || e.ctrlKey;

      if (e.key === "Escape") {
        const isMobile = window.innerWidth < 640;
        if (isMobile && showEditor) {
          setShowEditor(false);
        } else {
          setNotesVisible(false);
        }
        return;
      }

      if (isMod && e.key === "n") {
        e.preventDefault();
        handleCreateNote();
        return;
      }

      if (isMod && e.key === "p" && selectedNoteId && !selectedNoteId.startsWith("draft:")) {
        e.preventDefault();
        togglePinNote(selectedNoteId);
        return;
      }

      if (isMod && e.key === "Backspace" && selectedNoteId && !selectedNoteId.startsWith("draft:")) {
        e.preventDefault();
        handleDeleteNote(selectedNoteId);
        return;
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isNotesVisible, showEditor, setNotesVisible, selectedNoteId, togglePinNote]);

  const hasMeaningfulContent = (title: string, content: string): boolean => {
    if (title && title.trim().length > 0) return true;
    return content.trim().length > 0;
  };

  const creatingRef = useMemo(() => ({ current: false }), []);

  const makeStoragePortFor = (
    id: string,
    initial: { title: string; content: string; updatedAt: number } | null
  ): StoragePort => ({
    load: async () => {
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
          const created = await useNoteStore.getState().addNote({
            title: note.title || "Untitled",
            content: note.content,
          });
          if (created) {
            setSelectedNoteId(created.id);
            setActiveInitial({
              id: created.id,
              title: created.title,
              content: created.content || "",
              updatedAt: created.updatedAt,
            });
          }
        } finally {
          setIsSaving(false);
          creatingRef.current = false;
        }
        return;
      }
      setIsSaving(true);
      await useNoteStore.getState().updateNote(id, { title: note.title, content: note.content });
      setIsSaving(false);
    },
  });

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const mins = Math.floor(diffMs / 60000);
    const hrs = Math.floor(diffMs / 3600000);
    const days = Math.floor(diffMs / 86400000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m`;
    if (hrs < 24) return `${hrs}h`;
    if (days < 7) return `${days}d`;
    return d.toLocaleDateString();
  };

  const getPreview = (content: string | null | undefined): string => {
    if (!content) return "";
    const lines = content.trim().split("\n").slice(1);
    const preview = lines.find((l) => l.trim().length > 0)?.trim() || "";
    return preview.length > 60 ? preview.slice(0, 60) + "..." : preview;
  };

  const handleCreateNote = async () => {
    if (notes.length >= MAX_NOTES) {
      alert(`Maximum ${MAX_NOTES} notes reached!`);
      return;
    }
    const draftId = `draft:${crypto.randomUUID()}`;
    setSelectedNoteId(draftId);
    setActiveInitial({ id: draftId, title: "", content: "", updatedAt: Date.now() });
    setShowEditor(true);
  };

  const handleDeleteNote = (noteId: string) => {
    const n = notes.find((x) => x.id === noteId);
    if (!n) return;
    if (confirm(`Delete "${n.title}"?`)) {
      deleteNote(noteId);
      if (selectedNoteId === noteId) {
        const remaining = notes.filter((x) => x.id !== noteId);
        if (remaining.length > 0) {
          const next = remaining[0];
          setSelectedNoteId(next.id);
          setActiveInitial({ id: next.id, title: next.title, content: next.content || "", updatedAt: next.updatedAt });
        } else {
          setSelectedNoteId(null);
          setActiveInitial(null);
          setShowEditor(false);
        }
      }
    }
  };

  const handleSelectNote = (noteId: string) => {
    const n = notes.find((x) => x.id === noteId);
    setSelectedNoteId(noteId);
    setActiveInitial(
      n ? { id: n.id, title: n.title, content: n.content || "", updatedAt: n.updatedAt } : null
    );
    setShowEditor(true);
  };

  const handleBack = () => {
    setShowEditor(false);
  };

  const modKey = getModifierKey();

  const Kbd = ({ children }: { children: React.ReactNode }) => (
    <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-medium text-zinc-400 bg-zinc-800 border border-zinc-700 rounded shadow-sm">
      {children}
    </kbd>
  );

  const ShortcutsPopover = () => (
    <Popover>
      <PopoverTrigger asChild>
        <button className="p-2 rounded hover:bg-white/5 text-zinc-500 hover:text-white transition-colors">
          <Keyboard className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3 bg-zinc-900 border-white/10" align="end">
        <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-3 font-medium">Keyboard Shortcuts</p>
        <div className="text-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-zinc-300">New note</span>
            <div className="flex items-center gap-1">
              <Kbd>{modKey}</Kbd>
              <Kbd>N</Kbd>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-300">Pin note</span>
            <div className="flex items-center gap-1">
              <Kbd>{modKey}</Kbd>
              <Kbd>P</Kbd>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-300">Delete note</span>
            <div className="flex items-center gap-1">
              <Kbd>{modKey}</Kbd>
              <Kbd>⌫</Kbd>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-300">Zen mode</span>
            <div className="flex items-center gap-1">
              <Kbd>{modKey}</Kbd>
              <Kbd>⇧</Kbd>
              <Kbd>F</Kbd>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-300">Close</span>
            <Kbd>Esc</Kbd>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );

  if (!isNotesVisible) return null;

  const seed =
    selectedNote
      ? { id: selectedNote.id, title: selectedNote.title || "Untitled", content: selectedNote.content || "", updatedAt: selectedNote.updatedAt }
      : activeInitial;

  return (
    <AnimatePresence>
      {isNotesVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 bg-zinc-950"
        >
          {/* Mobile: show either list or editor */}
          <div className="sm:hidden h-full">
            <AnimatePresence mode="wait">
              {!showEditor ? (
                <motion.div
                  key="list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                  className="h-full flex flex-col"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                    <h1 className="text-lg font-semibold text-white">Notes</h1>
                    <div className="flex items-center">
                      <ShortcutsPopover />
                      <Button variant="ghost" size="sm" onClick={() => setNotesVisible(false)} className="h-8 w-8 p-0">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {renderNotesList()}
                </motion.div>
              ) : (
                <motion.div
                  key="editor"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                  className="h-full flex flex-col"
                >
                  <div className="flex items-center justify-between px-2 py-2 border-b border-white/5">
                    <Button variant="ghost" size="sm" onClick={handleBack} className="gap-1 h-8 text-xs">
                      <ChevronLeft className="h-4 w-4" />
                      Back
                    </Button>
                    <div className="flex items-center gap-1">
                      {selectedNoteId && !selectedNoteId.startsWith("draft:") && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => togglePinNote(selectedNoteId)}
                            className="h-8 w-8 p-0"
                          >
                            <Pin className={`h-4 w-4 ${selectedNote?.pinned ? "fill-yellow-400 text-yellow-400" : ""}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteNote(selectedNoteId)}
                            className="h-8 w-8 p-0 hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 overflow-auto">
                    {seed && (
                      <NoteEditor
                        key={seed.id}
                        id={seed.id}
                        port={makeStoragePortFor(seed.id, seed)}
                        initial={seed}
                        onChange={(title, content) => {
                          setActiveInitial((prev) =>
                            prev && prev.id === seed.id ? { ...prev, title, content, updatedAt: Date.now() } : prev
                          );
                        }}
                      />
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Desktop: side by side */}
          <div className="hidden sm:flex h-full">
            <div className="w-80 border-r border-white/5 flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                <h1 className="text-lg font-semibold text-white">Notes</h1>
                <div className="flex items-center">
                  <ShortcutsPopover />
                  <Button variant="ghost" size="sm" onClick={() => setNotesVisible(false)} className="h-8 w-8 p-0">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {renderNotesList()}
            </div>
            <div className="flex-1 flex flex-col">
              {seed ? (
                <>
                  <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
                    <div className="flex items-center gap-1">
                      {!selectedNoteId?.startsWith("draft:") && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => selectedNoteId && togglePinNote(selectedNoteId)}
                            className="gap-1.5 h-8 text-xs"
                          >
                            <Pin className={`h-3.5 w-3.5 ${selectedNote?.pinned ? "fill-yellow-400 text-yellow-400" : ""}`} />
                            {selectedNote?.pinned ? "Pinned" : "Pin"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => selectedNoteId && handleDeleteNote(selectedNoteId)}
                            className="gap-1.5 h-8 text-xs hover:text-red-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                    {isSaving && <span className="text-[10px] text-emerald-400/80">Saving...</span>}
                  </div>
                  <div className="flex-1 overflow-auto">
                    <NoteEditor
                      key={seed.id}
                      id={seed.id}
                      port={makeStoragePortFor(seed.id, seed)}
                      initial={seed}
                      onChange={(title, content) => {
                        setActiveInitial((prev) =>
                          prev && prev.id === seed.id ? { ...prev, title, content, updatedAt: Date.now() } : prev
                        );
                      }}
                    />
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <FileText className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
                    <p className="text-sm text-zinc-500">Select a note</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  function renderNotesList() {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="pl-10 pr-8 bg-zinc-800/50 border-white/5 h-9"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <PremiumFeature requirePro>
              <Button onClick={handleCreateNote} size="sm" className="h-9 w-9 p-0">
                <Plus className="h-4 w-4" />
              </Button>
            </PremiumFeature>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-2">
          {filteredNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <FileText className="h-10 w-10 text-zinc-600 mb-3" />
              <p className="text-sm text-zinc-400 mb-1">
                {searchQuery ? "No notes found" : "No notes yet"}
              </p>
              {!searchQuery && (
                <PremiumFeature requirePro>
                  <Button onClick={handleCreateNote} size="sm" className="mt-3 gap-1.5">
                    <Plus className="h-4 w-4" />
                    New Note
                  </Button>
                </PremiumFeature>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => handleSelectNote(note.id)}
                  className={`group cursor-pointer rounded-lg p-3 transition-colors ${
                    selectedNoteId === note.id
                      ? "bg-purple-500/10"
                      : "hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {note.pinned && <Pin className="h-3 w-3 text-yellow-400 fill-yellow-400 shrink-0" />}
                        <h3 className="truncate text-sm font-medium text-white/90">
                          {note.title || "Untitled"}
                        </h3>
                      </div>
                      {getPreview(note.content) && (
                        <p className="text-xs text-white/40 truncate mt-1">
                          {getPreview(note.content)}
                        </p>
                      )}
                      <p className="text-[10px] text-white/30 mt-1.5">{formatDate(note.updatedAt)}</p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePinNote(note.id);
                        }}
                        className="p-1.5 rounded hover:bg-white/10"
                      >
                        <Pin className={`h-3 w-3 ${note.pinned ? "fill-yellow-400 text-yellow-400" : "text-white/40"}`} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNote(note.id);
                        }}
                        className="p-1.5 rounded hover:bg-white/10"
                      >
                        <Trash2 className="h-3 w-3 text-white/40 hover:text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
}
