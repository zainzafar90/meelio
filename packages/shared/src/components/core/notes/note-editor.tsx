import { useEffect, useState, useRef } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

type NoteId = string;

type SimpleNote = {
  id: NoteId;
  title: string;
  content: string;
  updatedAt: number;
};

type StoragePort = {
  load: (id: NoteId) => Promise<SimpleNote | undefined>;
  save: (note: SimpleNote) => Promise<void>;
};

const MAX_TITLE_LENGTH = 200;
const now = () => Date.now();

const newNote = (id: NoteId): SimpleNote => ({
  id,
  title: "Untitled",
  content: "",
  updatedAt: now(),
});

const extractTitleFromContent = (content: string): string => {
  const lines = content.trim().split("\n");
  const firstLine = lines.find((l) => l.trim().length > 0);
  return (firstLine?.trim() || "Untitled").slice(0, MAX_TITLE_LENGTH);
};

const localStoragePort = (keyPrefix = "simple_note_"): StoragePort => ({
  load: async (id) => {
    const raw = localStorage.getItem(keyPrefix + id);
    return raw ? (JSON.parse(raw) as SimpleNote) : undefined;
  },
  save: async (note) => {
    localStorage.setItem(keyPrefix + note.id, JSON.stringify(note));
  },
});

type Props = {
  id: NoteId;
  port?: StoragePort;
  initial?: Partial<SimpleNote>;
  onChange?: (title: string, content: string) => void;
};

export default function NoteEditor({ id, port, initial, onChange }: Props) {
  const storage = port ?? localStoragePort();
  const [content, setContent] = useState(initial?.content || "");
  const [isZenMode, setIsZenMode] = useState(false);
  const [showToolbar, setShowToolbar] = useState(true);
  const [isTyping, setIsTyping] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimerRef = useRef<number | null>(null);
  const typingTimerRef = useRef<number | null>(null);
  const loadOnceRef = useRef(false);
  const lastSavedRef = useRef({
    title: initial?.title || "",
    content: initial?.content || "",
  });

  useEffect(() => {
    if (loadOnceRef.current) return;
    loadOnceRef.current = true;

    (async () => {
      const savedNote = await storage.load(id);
      if (savedNote) {
        setContent(savedNote.content);
        lastSavedRef.current = {
          title: savedNote.title,
          content: savedNote.content,
        };
      } else if (initial) {
        setContent(initial.content || "");
        lastSavedRef.current = {
          title: initial.title || "",
          content: initial.content || "",
        };
      }
    })();
  }, [id, storage, initial]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);

    setIsTyping(true);
    if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
    typingTimerRef.current = window.setTimeout(() => {
      setIsTyping(false);
    }, 2000) as unknown as number;

    const title = extractTitleFromContent(newContent);
    if (onChange) {
      onChange(title, newContent);
    }

    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(async () => {
      if (newContent !== lastSavedRef.current.content) {
        const note: SimpleNote = {
          id,
          title,
          content: newContent,
          updatedAt: now(),
        };
        await storage.save(note);
        lastSavedRef.current = { title, content: newContent };
      }
    }, 800) as unknown as number;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "f") {
        e.preventDefault();
        setIsZenMode((v) => !v);
      }
      if (e.key === "Escape" && isZenMode) {
        setIsZenMode(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isZenMode]);

  useEffect(() => {
    if (isZenMode) {
      setShowToolbar(!isTyping);
    } else {
      setShowToolbar(true);
    }
  }, [isZenMode, isTyping]);

  const containerClass = isZenMode
    ? "fixed inset-0 z-50 bg-zinc-950 flex flex-col"
    : "flex flex-col h-full bg-zinc-950";

  const contentClass = isZenMode
    ? "flex-1 overflow-auto"
    : "flex-1 overflow-auto";

  const editorClass = isZenMode
    ? "w-full h-full max-w-3xl mx-auto px-8"
    : "w-full h-full";

  return (
    <div className={containerClass}>
      {/* Toolbar */}
      <div
        className={`border-b border-zinc-800 bg-zinc-950 transition-all duration-300 ${
          showToolbar
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-full h-0 overflow-hidden"
        }`}
      >
        <div className="flex items-center justify-end h-12 px-4">
          <button
            onClick={() => setIsZenMode(!isZenMode)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded hover:bg-zinc-800 transition-colors ${
              isZenMode ? "bg-purple-500/20 text-purple-400" : "text-zinc-400"
            }`}
            title="Toggle Zen Mode (Cmd+Shift+F)"
          >
            {isZenMode ? (
              <Minimize2 className="size-4" />
            ) : (
              <Maximize2 className="size-4" />
            )}
            <span className="text-sm">Zen</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={contentClass}>
        <div className={editorClass}>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            placeholder="Start writing..."
            className="w-full h-full px-6 py-4 bg-transparent text-zinc-300 placeholder:text-zinc-600 focus:outline-none resize-none text-base leading-relaxed"
            autoFocus
            spellCheck={false}
          />
        </div>
      </div>

      {/* Zen mode hint */}
      {isZenMode && (
        <div
          className={`fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-500 transition-opacity duration-300 ${
            showToolbar ? "opacity-0" : "opacity-100"
          }`}
        >
          Press Esc to exit zen mode
        </div>
      )}
    </div>
  );
}

export { type StoragePort };
