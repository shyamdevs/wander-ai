import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

const ToastCtx = createContext(null);
export const useToast = () => useContext(ToastCtx);

const STYLE = {
  success: ["text-emerald-300", CheckCircle2],
  error: ["text-red-300", AlertCircle],
  info: ["text-apple-blue", Info],
};

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const dismiss = useCallback((id) => setItems((l) => l.filter((t) => t.id !== id)), []);
  const push = useCallback(
    (type, text, ms = 4500) => {
      const id = Math.random().toString(36).slice(2);
      setItems((l) => [...l.slice(-2), { id, type, text }]);
      setTimeout(() => dismiss(id), ms);
    },
    [dismiss]
  );
  const api = useMemo(
    () => ({
      success: (t) => push("success", t),
      error: (t) => push("error", t, 7000),
      info: (t) => push("info", t),
    }),
    [push]
  );

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-3">
        <AnimatePresence>
          {items.map((t) => {
            const [color, Icon] = STYLE[t.type];
            return (
              <motion.div
                key={t.id}
                role="status"
                initial={{ opacity: 0, y: -16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border border-white/20 bg-neutral-900/85 px-4 py-3 text-sm shadow-2xl backdrop-blur-2xl"
              >
                <Icon size={18} className={`mt-0.5 shrink-0 ${color}`} />
                <p className="min-w-0 flex-1 leading-snug">{t.text}</p>
                <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="-m-1 p-1 text-apple-muted hover:text-apple-text">
                  <X size={16} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}
