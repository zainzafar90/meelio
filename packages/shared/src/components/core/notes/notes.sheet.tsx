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
import { 
  Search, 
  Plus, 
  Pin, 
  Trash2, 
  ArrowLeft, 
  Edit3, 
  X, 
  Volume2, 
  VolumeX,
  FileText,
  Clock,
  Grid3X3,
  List
} from "lucide-react";

type ViewMode = 'list' | 'create' | 'edit';

export function NotesSheet() {
  const { t } = useTranslation();
  
  // Store hooks
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
    setEnableTypingSound 
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

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [createdNoteId, setCreatedNoteId] = useState<string | null>(null);
  const [isGridView, setIsGridView] = useState(true);
  
  // Constants
  const MAX_TITLE_LENGTH = 100;
  const MAX_CONTENT_LENGTH = 10000;
  const MAX_NOTES = 500;
  const AUTO_SAVE_DELAY = 500; // ms

  // Refs
  const autoSaveTimeout = useRef<NodeJS.Timeout>();
  const isCreatingNote = useRef(false);

  // Computed
  const selectedNote = useMemo(
    () => notes.find(n => n.id === selectedNoteId),
    [notes, selectedNoteId]
  );

  const filteredNotes = useMemo(() => {
    let filtered = [...notes];
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(note => 
        note.title.toLowerCase().includes(query) || 
        (note.content?.toLowerCase() || '').includes(query)
      );
    }

    // Sort: pinned first, then by updated date
    filtered.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.updatedAt - a.updatedAt;
    });

    return filtered;
  }, [notes, searchQuery]);

  // Initialize store when sheet opens
  useEffect(() => {
    if (isNotesVisible) {
      initializeStore();
      resetToList();
    }
  }, [isNotesVisible, initializeStore]);

  // Load note data when editing
  useEffect(() => {
    if (selectedNote && viewMode === 'edit') {
      setNoteTitle(selectedNote.title);
      setNoteContent(selectedNote.content || '');
    }
  }, [selectedNote, viewMode]);

  // Helper functions
  const resetToList = () => {
    setViewMode('list');
    setSelectedNoteId(null);
    setNoteTitle('');
    setNoteContent('');
    setSearchQuery('');
    setCreatedNoteId(null);
    isCreatingNote.current = false;
    if (autoSaveTimeout.current) {
      clearTimeout(autoSaveTimeout.current);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getNotePreview = (content: string | null | undefined) => {
    if (!content) return 'Empty note';
    const preview = content.slice(0, 300).replace(/\n+/g, ' ');
    return preview + (content.length > 300 ? '...' : '');
  };

  const getNoteColor = (id: string) => {
    const colors = [
      'from-blue-500/20 to-indigo-500/10',
      'from-purple-500/20 to-pink-500/10',
      'from-green-500/20 to-teal-500/10',
      'from-orange-500/20 to-red-500/10',
      'from-cyan-500/20 to-blue-500/10',
      'from-rose-500/20 to-purple-500/10',
    ];
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // Actions
  const handleCreateNote = () => {
    if (notes.length >= MAX_NOTES) {
      alert(`Maximum ${MAX_NOTES} notes reached!`);
      return;
    }
    setViewMode('create');
    setNoteTitle('');
    setNoteContent('');
    setCreatedNoteId(null);
    isCreatingNote.current = false;
  };

  const handleAutoSave = async (title: string, content: string) => {
    if (autoSaveTimeout.current) {
      clearTimeout(autoSaveTimeout.current);
    }

    autoSaveTimeout.current = setTimeout(async () => {
      const trimmedTitle = title.trim() || 'Untitled';
      const trimmedContent = content.trim();

      if (viewMode === 'create' && !createdNoteId && !isCreatingNote.current) {
        // Auto-create note on first keystroke
        if (trimmedContent || trimmedTitle !== 'Untitled') {
          isCreatingNote.current = true;
          setIsSaving(true);
          const newNote = await addNote({ title: trimmedTitle, content: trimmedContent });
          setIsSaving(false);
          isCreatingNote.current = false;
          
          if (newNote) {
            setCreatedNoteId(newNote.id);
            setSelectedNoteId(newNote.id);
            // Stay in create mode but now we're updating the created note
          }
        }
      } else if (createdNoteId || selectedNoteId) {
        // Auto-update existing note
        const noteId = createdNoteId || selectedNoteId;
        if (noteId) {
          setIsSaving(true);
          await updateNote(noteId, {
            title: trimmedTitle,
            content: trimmedContent
          });
          setIsSaving(false);
        }
      }
    }, AUTO_SAVE_DELAY);
  };

  const handleDeleteNote = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    if (confirm(`Delete "${note.title}"? This cannot be undone.`)) {
      deleteNote(noteId);
      if (selectedNoteId === noteId) {
        resetToList();
      }
    }
  };

  const handleViewNote = (noteId: string) => {
    setSelectedNoteId(noteId);
    setViewMode('edit'); // Always open in edit mode
  };

  const handleTogglePin = (noteId: string) => {
    togglePinNote(noteId);
  };

  const handleTypingSound = (key: string) => {
    if (enableTypingSound) {
      playTypewriterSound(key);
    }
  };

  // Render list view
  const renderListView = () => (
    <div className="flex h-full flex-col">
      {/* Search bar and view toggle */}
      <div className="border-b border-white/10 bg-zinc-800/50 p-4">
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
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          {/* View toggle buttons */}
          <div className="flex rounded-lg bg-zinc-800/50 p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsGridView(true)}
              className={`h-8 w-8 p-0 ${isGridView ? 'bg-zinc-700' : ''}`}
              title="Grid view"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsGridView(false)}
              className={`h-8 w-8 p-0 ${!isGridView ? 'bg-zinc-700' : ''}`}
              title="List view"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Notes list */}
      <div className="flex-1 overflow-auto p-4">
        {filteredNotes.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center">
            <FileText className="mb-4 h-12 w-12 text-zinc-600" />
            <p className="mb-2 text-zinc-400">
              {searchQuery ? 'No notes found' : 'No notes yet'}
            </p>
            <p className="mb-6 text-sm text-zinc-500">
              {searchQuery ? 'Try a different search' : 'Create your first note'}
            </p>
            {!searchQuery && (
              <PremiumFeature requirePro>
                <Button onClick={handleCreateNote} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Note
                </Button>
              </PremiumFeature>
            )}
          </div>
        ) : (
          <div className={isGridView ? "columns-2 gap-4 space-y-4 [column-fill:_balance]" : "space-y-4"}>
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => handleViewNote(note.id)}
                className={`group relative cursor-pointer overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br ${getNoteColor(note.id)} p-4 transition-all hover:border-white/20 ${!isGridView ? 'flex items-start justify-between' : ''}`}
              >
                {/* Note content */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      <h3 className="truncate font-medium text-white/90">
                        {note.title}
                      </h3>
                      {note.pinned && (
                        <Pin className="h-3 w-3 flex-shrink-0 fill-yellow-400 text-yellow-400" />
                      )}
                    </div>
                    <p className="mb-2 text-sm text-white/50 line-clamp-[10] ">
                      {getNotePreview(note.content)}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-white/40">
                      <Clock className="h-3 w-3" />
                      <span>{formatDate(note.updatedAt)}</span>
                      <span>•</span>
                      <span>{(note.content?.length || 0).toLocaleString()} characters</span>
                    </div>
                  </div>

                  {/* Quick actions */}
                  <div className="flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTogglePin(note.id);
                      }}
                      className="rounded p-1.5 hover:bg-white/10"
                      title={note.pinned ? 'Unpin' : 'Pin'}
                    >
                      <Pin className={`h-3.5 w-3.5 ${note.pinned ? 'fill-yellow-400 text-yellow-400' : 'text-white/60'}`} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNote(note.id);
                      }}
                      className="rounded p-1.5 hover:bg-white/10"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-white/60 hover:text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating action button */}
      <PremiumFeature requirePro>
        <Button
          onClick={handleCreateNote}
          disabled={notes.length >= MAX_NOTES}
          className="absolute bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
          title={notes.length >= MAX_NOTES ? `Maximum ${MAX_NOTES} notes` : 'Create note'}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </PremiumFeature>
    </div>
  );

  // Render create/edit
  const renderNoteEditor = () => {
    const isNewNote = viewMode === 'create';

    return (
      <div className="flex h-full flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between border-b border-white/10 bg-zinc-800/50 px-4 py-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={resetToList}
              className="gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            
            {!isNewNote && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleTogglePin(selectedNoteId!)}
                  className="gap-1"
                >
                  <Pin className={`h-4 w-4 ${selectedNote?.pinned ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                  {selectedNote?.pinned ? 'Pinned' : 'Pin'}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteNote(selectedNoteId!)}
                  className="gap-1 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500">
              {noteTitle.length}/{MAX_TITLE_LENGTH} • {noteContent.length.toLocaleString()}/{MAX_CONTENT_LENGTH.toLocaleString()}
            </span>
            
            {isSaving && (
              <span className="text-xs text-green-400">Saving...</span>
            )}
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-3xl">
            <Input
              value={noteTitle}
              onChange={(e) => {
                const newTitle = e.target.value.slice(0, MAX_TITLE_LENGTH);
                setNoteTitle(newTitle);
                handleAutoSave(newTitle, noteContent);
              }}
              onKeyDown={(e) => handleTypingSound(e.key)}
              placeholder="Note title..."
              className="mb-4 border-0 bg-transparent p-0 text-2xl font-bold placeholder:text-zinc-600 focus-visible:ring-0"
            />
            
            <Textarea
              value={noteContent}
              onChange={(e) => {
                const newContent = e.target.value.slice(0, MAX_CONTENT_LENGTH);
                setNoteContent(newContent);
                handleAutoSave(noteTitle, newContent);
              }}
              onKeyDown={(e) => handleTypingSound(e.key)}
              placeholder="Start writing..."
              className="min-h-[500px] resize-none border-0 bg-transparent p-0 placeholder:text-zinc-600 focus-visible:ring-0"
              autoFocus={isNewNote}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <Sheet open={isNotesVisible} onOpenChange={setNotesVisible}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-xl border-l border-white/10 bg-zinc-900">
        <SheetHeader className="border-b border-white/10 bg-zinc-800/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle>
                {viewMode === 'list' && 'Notes'}
                {viewMode === 'create' && 'New Note'}
                {viewMode === 'edit' && (selectedNote?.title || 'Edit Note')}
              </SheetTitle>
              <SheetDescription>
                {viewMode === 'list' && `${filteredNotes.length} notes`}
                {viewMode === 'create' && (createdNoteId ? 'Auto-saving...' : 'Start typing to auto-save')}
                {viewMode === 'edit' && formatDate(selectedNote?.updatedAt || Date.now())}
              </SheetDescription>
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
          {viewMode === 'list' ? renderListView() : renderNoteEditor()}
        </div>
      </SheetContent>
    </Sheet>
  );
}