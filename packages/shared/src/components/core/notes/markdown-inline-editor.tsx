// ─────────────────── Types
type NoteId = string;

type MarkdownNote = {
  id: NoteId;
  title: string;
  body: string; // html (from TipTap)
  updatedAt: number;
};

type StoragePort = {
  load: (id: NoteId) => Promise<MarkdownNote | undefined>;
  save: (note: MarkdownNote) => Promise<void>;
};

// ─────────────────── Errors
class PersistError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "PersistError";
  }
}

// ─────────────────── Pure utils (≤30 lines each)
const now = () => Date.now();

const newNote = (id: NoteId): MarkdownNote => ({
  id,
  title: "",
  body: "",
  updatedAt: now(),
});

const saveDraft =
  (port: StoragePort, id: NoteId) =>
  async (title: string, body: string) => {
    const note: MarkdownNote = { id, title, body, updatedAt: now() };
    await port.save(note);
  };

const extractTitle = (html: string): string => {
  const h1 = html.match(/<h1[^>]*>(.*?)<\/h1>/i)?.[1] ?? "";
  const txt = h1.replace(/<[^>]*>/g, "").trim();
  if (txt) return txt.slice(0, 100);
  const p = html.match(/<p[^>]*>(.*?)<\/p>/i)?.[1] ?? "";
  return p.replace(/<[^>]*>/g, "").trim().slice(0, 100);
};

const initialHtml = (title = "") => `<h1>${title}</h1><p></p>`;

// ─────────────────── Storage (injected default)
const localStoragePort = (keyPrefix = "md_note_"): StoragePort => ({
  load: async (id) => {
    const raw = localStorage.getItem(keyPrefix + id);
    return raw ? (JSON.parse(raw) as MarkdownNote) : undefined;
  },
  save: async (note) => {
    try {
      localStorage.setItem(keyPrefix + note.id, JSON.stringify(note));
    } catch {
      throw new PersistError("Failed to save note");
    }
  },
});

// ─────────────────── UI
import { useEffect, useMemo, useState, useRef } from "react";
import { useEditor, EditorContent, useEditorState, type Editor } from "@tiptap/react";
import { TextStyle as TextStyleKit } from "@tiptap/extension-text-style";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import TextAlign from "@tiptap/extension-text-align";
import Document from "@tiptap/extension-document";
import Heading from "@tiptap/extension-heading";
import Link from "@tiptap/extension-link";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Quote,
  Bold,
  Italic,
  Strikethrough,
  Underline as UnderlineIcon,
  Code,
  Link2,
  AlignJustify,
  Braces,
  Minus,
  Undo,
  Redo,
  ChevronDown,
  List,
} from "lucide-react";

type Props = {
  id: NoteId;
  port?: StoragePort;
  initial?: Partial<MarkdownNote>;
};

// ── Menu (unchanged UI, small tweaks)
function MenuBar({ editor }: { editor: Editor }) {
  const [showHeadingMenu, setShowHeadingMenu] = useState(false);
  const [showAlignMenu, setShowAlignMenu] = useState(false);
  const [showListMenu, setShowListMenu] = useState(false);
  const headingRef = useRef<HTMLDivElement>(null);
  const alignRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const s = useEditorState({
    editor,
    selector: (ctx) => ({
      isBold: ctx.editor.isActive("bold") ?? false,
      isItalic: ctx.editor.isActive("italic") ?? false,
      isUnderline: ctx.editor.isActive("underline") ?? false,
      isStrike: ctx.editor.isActive("strike") ?? false,
      isCode: ctx.editor.isActive("code") ?? false,
      isLink: ctx.editor.isActive("link") ?? false,
      isHeading1: ctx.editor.isActive("heading", { level: 1 }) ?? false,
      isHeading2: ctx.editor.isActive("heading", { level: 2 }) ?? false,
      isHeading3: ctx.editor.isActive("heading", { level: 3 }) ?? false,
      isHeading4: ctx.editor.isActive("heading", { level: 4 }) ?? false,
      isBulletList: ctx.editor.isActive("bulletList") ?? false,
      isOrderedList: ctx.editor.isActive("orderedList") ?? false,
      isTaskList: ctx.editor.isActive("taskList") ?? false,
      isCodeBlock: ctx.editor.isActive("codeBlock") ?? false,
      isBlockquote: ctx.editor.isActive("blockquote") ?? false,
      isAlignLeft: ctx.editor.isActive({ textAlign: "left" }) ?? false,
      isAlignCenter: ctx.editor.isActive({ textAlign: "center" }) ?? false,
      isAlignRight: ctx.editor.isActive({ textAlign: "right" }) ?? false,
      isAlignJustify: ctx.editor.isActive({ textAlign: "justify" }) ?? false,
      canUndo: ctx.editor.can().chain().undo().run() ?? false,
      canRedo: ctx.editor.can().chain().redo().run() ?? false,
    }),
  });

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (headingRef.current && !headingRef.current.contains(e.target as Node)) setShowHeadingMenu(false);
      if (alignRef.current && !alignRef.current.contains(e.target as Node)) setShowAlignMenu(false);
      if (listRef.current && !listRef.current.contains(e.target as Node)) setShowListMenu(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const headingLbl = s.isHeading1 ? "H₁" : s.isHeading2 ? "H₂" : s.isHeading3 ? "H₃" : s.isHeading4 ? "H₄" : "H₁";

  return (
    <div className="sticky top-0 z-40 bg-zinc-950 border-b border-zinc-800">
      <div className="flex items-center h-12 px-3 gap-0.5">
        <button onClick={() => editor.chain().focus().undo().run()} disabled={!s.canUndo} className="p-2 rounded hover:bg-zinc-800 disabled:opacity-30" title="Undo">
          <Undo className="size-5" />
        </button>
        <button onClick={() => editor.chain().focus().redo().run()} disabled={!s.canRedo} className="p-2 rounded hover:bg-zinc-800 disabled:opacity-30" title="Redo">
          <Redo className="size-5" />
        </button>

        <div className="w-px h-6 bg-zinc-700 mx-1" />

        <div className="relative" ref={headingRef}>
          <button onClick={() => setShowHeadingMenu((v) => !v)} className={`flex items-center gap-1 px-3 py-1.5 rounded hover:bg-zinc-800 ${showHeadingMenu ? "bg-zinc-800" : ""}`}>
            <span className="text-sm text-zinc-300">{headingLbl}</span>
            <ChevronDown className="size-5" />
          </button>
          {showHeadingMenu && (
            <div className="absolute top-full left-0 mt-1 py-1 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl min-w-[180px]">
              {[1, 2, 3, 4].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => {
                    editor.chain().focus().toggleHeading({ level: lvl as 1 | 2 | 3 | 4 }).run();
                    setShowHeadingMenu(false);
                  }}
                  className={`w-full px-3 py-2 text-left hover:bg-zinc-800 flex items-center gap-2 ${
                    s[`isHeading${lvl as 1 | 2 | 3 | 4}` as const] ? "text-purple-400" : "text-zinc-300"
                  }`}
                >
                  <span className="text-zinc-400 font-bold">{`H${String.fromCharCode(0x2080 + lvl)}`}</span> {`Heading ${lvl}`}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-zinc-700 mx-1" />

        <div className="relative" ref={listRef}>
          <button onClick={() => setShowListMenu((v) => !v)} className={`p-2 rounded hover:bg-zinc-800 ${showListMenu ? "bg-zinc-800" : ""}`} title="Lists">
            <List className="size-5" />
          </button>
          {showListMenu && (
            <div className="absolute top-full left-0 mt-1 py-1 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl">
              <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`px-3 py-2 hover:bg-zinc-800 ${s.isBulletList ? "text-purple-400" : "text-zinc-300"}`}>
                • Bullet List
              </button>
              <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`px-3 py-2 hover:bg-zinc-800 block w-full text-left ${s.isOrderedList ? "text-purple-400" : "text-zinc-300"}`}>
                1. Numbered List
              </button>
              <button onClick={() => editor.chain().focus().toggleTaskList().run()} className={`px-3 py-2 hover:bg-zinc-800 block w-full text-left ${s.isTaskList ? "text-purple-400" : "text-zinc-300"}`}>
                ☑ Task List
              </button>
            </div>
          )}
        </div>

        <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`p-2 rounded hover:bg-zinc-800 ${s.isBlockquote ? "bg-purple-500/20 text-purple-400" : ""}`} title="Quote">
          <Quote className="size-5" />
        </button>

        <div className="w-px h-6 bg-zinc-700 mx-1" />

        <button onClick={() => editor.chain().focus().toggleBold().run()} className={`p-2 rounded hover:bg-zinc-800 ${s.isBold ? "bg-purple-500/20 text-purple-400" : ""}`} title="Bold">
          <Bold className="size-5" />
        </button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-2 rounded hover:bg-zinc-800 ${s.isItalic ? "bg-purple-500/20 text-purple-400" : ""}`} title="Italic">
          <Italic className="size-5" />
        </button>
        <button onClick={() => editor.chain().focus().toggleStrike().run()} className={`p-2 rounded hover:bg-zinc-800 ${s.isStrike ? "bg-purple-500/20 text-purple-400" : ""}`} title="Strikethrough">
          <Strikethrough className="size-5" />
        </button>
        <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={`p-2 rounded hover:bg-zinc-800 ${s.isUnderline ? "bg-purple-500/20 text-purple-400" : ""}`} title="Underline">
          <UnderlineIcon className="size-5" />
        </button>
        <button onClick={() => editor.chain().focus().toggleCode().run()} className={`p-2 rounded hover:bg-zinc-800 ${s.isCode ? "bg-purple-500/20 text-purple-400" : ""}`} title="Inline Code">
          <Code className="size-5" />
        </button>
        <button
          onClick={() => {
            if (s.isLink) editor.chain().focus().unsetLink().run();
            else {
              const url = window.prompt("Enter URL");
              if (url) editor.chain().focus().setLink({ href: url }).run();
            }
          }}
          className={`p-2 rounded hover:bg-zinc-800 ${s.isLink ? "bg-purple-500/20 text-purple-400" : ""}`}
          title={s.isLink ? "Remove Link" : "Add Link"}
        >
          <Link2 className="size-5" />
        </button>

        <div className="w-px h-6 bg-zinc-700 mx-1" />

        <div className="relative" ref={alignRef}>
          <button onClick={() => setShowAlignMenu((v) => !v)} className={`p-2 rounded hover:bg-zinc-800 ${showAlignMenu ? "bg-zinc-800" : ""}`} title="Text Alignment">
            <AlignLeft className="size-5" />
          </button>
          {showAlignMenu && (
            <div className="absolute top-full left-0 mt-1 py-1 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl">
              <button onClick={() => editor.chain().focus().setTextAlign("left").run()} className={`px-3 py-2 hover:bg-zinc-800 flex items-center gap-2 ${s.isAlignLeft ? "text-purple-400" : "text-zinc-300"}`}>
                <AlignLeft className="size-5" /> Left
              </button>
              <button onClick={() => editor.chain().focus().setTextAlign("center").run()} className={`px-3 py-2 hover:bg-zinc-800 flex items-center gap-2 ${s.isAlignCenter ? "text-purple-400" : "text-zinc-300"}`}>
                <AlignCenter className="size-5" /> Center
              </button>
              <button onClick={() => editor.chain().focus().setTextAlign("right").run()} className={`px-3 py-2 hover:bg-zinc-800 flex items-center gap-2 ${s.isAlignRight ? "text-purple-400" : "text-zinc-300"}`}>
                <AlignRight className="size-5" /> Right
              </button>
              <button onClick={() => editor.chain().focus().setTextAlign("justify").run()} className={`px-3 py-2 hover:bg-zinc-800 flex items-center gap-2 ${s.isAlignJustify ? "text-purple-400" : "text-zinc-300"}`}>
                <AlignJustify className="size-5" /> Justify
              </button>
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-zinc-700 mx-1" />

        <button onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={`p-2 rounded hover:bg-zinc-800 ${s.isCodeBlock ? "bg-purple-500/20 text-purple-400" : ""}`} title="Code Block">
          <Braces className="size-5" />
        </button>
        <button onClick={() => editor.chain().focus().setHorizontalRule().run()} className="p-2 rounded hover:bg-zinc-800" title="Horizontal Rule">
          <Minus className="size-5" />
        </button>
      </div>
    </div>
  );
}

export default function MarkdownInlineEditor({ id, port, initial }: Props) {
  const storage = useMemo(() => port ?? localStoragePort(), [port]);
  const [note, setNote] = useState<MarkdownNote>(() => ({ ...newNote(id), ...initial }));
  const [saved, setSaved] = useState<{ title: string; body: string }>({
    title: initial?.title ?? "",
    body: initial?.body ?? "",
  });

  const persist = useMemo(() => saveDraft(storage, id), [storage, id]);
  const loadOnceRef = useRef(false);
  const saveTimerRef = useRef<number | null>(null);

  const editor = useEditor({
    extensions: [
      TextStyleKit,
      Document.extend({
        content: "heading paragraph block*",
      }),
      StarterKit.configure({ document: false, heading: false }),
      Heading.configure({ levels: [1, 2, 3, 4] }).extend({
        addKeyboardShortcuts() {
          return {
            Backspace: () => {
              const { $from } = this.editor.state.selection;
              // prevent removing very first H1 node
              if ($from.pos === 1 && $from.parent.type.name === "heading" && $from.parent.attrs.level === 1) {
                return true;
              }
              return false;
            },
          };
        },
        
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === "heading" && node.attrs.level === 1) return "Untitled";
          if (node.type.name === "paragraph") return "Start writing...";
          return "";
        },
        includeChildren: true,
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: initialHtml(note.title),
    autofocus: "start",
    editorProps: {
      attributes: {
        "data-gramm": "false",
        "data-gramm_editor": "false",
        "data-enable-grammarly": "false",
        spellcheck: "false",
        class:
          "prose prose-invert max-w-none focus:outline-none px-6 py-4 bg-zinc-950 text-zinc-100 prose-headings:text-white prose-h1:text-3xl prose-h1:font-bold prose-h1:mb-4 prose-p:text-zinc-300 prose-p:my-3 prose-strong:text-white prose-code:text-purple-300 prose-code:bg-zinc-900 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-blockquote:text-zinc-400 prose-blockquote:border-l-4 prose-blockquote:border-purple-500 prose-blockquote:pl-4 prose-li:text-zinc-300 prose-pre:bg-zinc-900 prose-pre:text-zinc-300",
      },
    },
    onUpdate: ({ editor, transaction }) => {
      if (!transaction.docChanged) return;
      const html = editor.getHTML();
      if (html === note.body) return;
      const title = extractTitle(html);
      setNote((n) => ({ ...n, title, body: html, updatedAt: now() }));
    },
  });

  // Load exactly once, then set content without triggering onUpdate.
  useEffect(() => {
    if (!editor || loadOnceRef.current) return;
    loadOnceRef.current = true;

    let alive = true;
    (async () => {
      const savedNote = (await storage.load(id)) ?? { ...newNote(id), ...initial };
      if (!alive || !editor) return;

      const body = savedNote.body || initialHtml(savedNote.title);
      editor.commands.setContent(body, { emitUpdate: false, parseOptions: { preserveWhitespace: false } });

      setNote(savedNote);
      setSaved({ title: savedNote.title, body: savedNote.body });
    })();

    return () => {
      alive = false;
    };
  }, [editor, id, storage, initial]);

  // Debounced persist (reliable first save).
  useEffect(() => {
    if (!note) return;
    if (note.title === saved.title && note.body === saved.body) return;

    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      persist(note.title, note.body).then(() => setSaved({ title: note.title, body: note.body }));
    }, 800) as unknown as number;

    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [note, persist, saved.title, saved.body]);

  if (!editor) return null;

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <MenuBar editor={editor} />
      <div className="flex-1 overflow-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

export { PersistError, localStoragePort, type MarkdownNote, type StoragePort, type NoteId };
