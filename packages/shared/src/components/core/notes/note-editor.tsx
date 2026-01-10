import { useEffect, useState, useRef, useMemo } from "react";
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

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimerRef = useRef<number | null>(null);
  const loadOnceRef = useRef(false);
  const lastSavedRef = useRef({
    title: initial?.title || "",
    content: initial?.content || "",
  });

  const stats = useMemo(() => {
    const chars = content.length;
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    return { chars, words };
  }, [content]);

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

  if (isZenMode) {
    return (
      <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col">
        <div className="flex items-center justify-between h-12 px-6 border-b border-zinc-800/50">
          <div className="flex items-center gap-4 text-[10px] text-zinc-500">
            <span>{stats.words} words</span>
            <span>{stats.chars} chars</span>
          </div>
          <button
            onClick={() => setIsZenMode(false)}
            className="flex items-center gap-2 px-3 py-1.5 rounded text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <Minimize2 className="size-3.5" />
            Exit
          </button>
        </div>
        <div className="flex-1 overflow-auto">
          <div className="max-w-2xl mx-auto h-full">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              placeholder="Start writing..."
              className="w-full h-full px-8 py-8 bg-transparent text-zinc-200 placeholder:text-zinc-600 focus:outline-none resize-none text-xl leading-relaxed"
              autoFocus
              spellCheck={false}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <div className="flex items-center justify-between h-10 px-4 border-b border-zinc-800/30">
        <div className="flex items-center gap-4 text-[10px] text-zinc-500">
          <span>{stats.words} words</span>
          <span>{stats.chars} chars</span>
        </div>
        <button
          onClick={() => setIsZenMode(true)}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-zinc-500 hover:text-white hover:bg-zinc-800/50 transition-colors"
          title="Zen Mode (Cmd+Shift+F)"
        >
          <Maximize2 className="size-3.5" />
          Zen
        </button>
      </div>
      <div className="flex-1 overflow-auto">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          placeholder="Start writing..."
          className="w-full h-full px-6 py-4 bg-transparent text-zinc-200 placeholder:text-zinc-600 focus:outline-none resize-none text-base leading-relaxed"
          autoFocus
          spellCheck={false}
        />
      </div>
    </div>
  );
}

export { type StoragePort };
