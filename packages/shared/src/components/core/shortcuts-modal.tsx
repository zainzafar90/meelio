import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Keyboard } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { DOCK_SHORTCUTS } from "../../hooks/use-dock-shortcuts";

export function ShortcutsModal() {
  const [isOpen, setIsOpen] = useState(false);

  const isMac =
    typeof navigator !== "undefined" &&
    navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  const modKey = isMac ? "⌘" : "Ctrl";

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        setIsOpen((v) => !v);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const Kbd = ({ children }: { children: React.ReactNode }) => (
    <kbd className="inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 text-[11px] font-mono font-medium text-zinc-300 bg-zinc-800 border border-zinc-700 rounded shadow-sm">
      {children}
    </kbd>
  );

  const shortcuts = [
    { section: "Dock Features", items: DOCK_SHORTCUTS },
    {
      section: "Notes",
      items: [
        { key: "N", label: "New note" },
        { key: "P", label: "Pin note" },
        { key: "⌫", label: "Delete note" },
        { key: "⇧ F", label: "Zen mode" },
      ],
    },
    {
      section: "General",
      items: [
        { key: "/", label: "Show shortcuts" },
        { key: "Esc", label: "Close panel", noMod: true },
      ],
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Keyboard className="h-5 w-5 text-zinc-400" />
                <h2 className="text-base font-semibold text-white">Keyboard Shortcuts</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-5 max-h-[60vh] overflow-auto space-y-6">
              {shortcuts.map((section) => (
                <div key={section.section}>
                  <h3 className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium mb-3">
                    {section.section}
                  </h3>
                  <div className="space-y-2">
                    {section.items.map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center justify-between py-1"
                      >
                        <span className="text-sm text-zinc-300">{item.label}</span>
                        <div className="flex items-center gap-1">
                          {!("noMod" in item && item.noMod) && <Kbd>{modKey}</Kbd>}
                          {item.key.split(" ").map((k, i) => (
                            <Kbd key={i}>{k}</Kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="px-5 py-3 border-t border-white/5 bg-zinc-900/50">
              <p className="text-[10px] text-zinc-500 text-center">
                Press <Kbd>{modKey}</Kbd> <Kbd>/</Kbd> to toggle this panel
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
