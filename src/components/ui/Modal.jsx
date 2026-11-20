import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

// Bottom sheet on phones, centred dialog on larger screens. Esc / backdrop closes.
export default function Modal({ open, onClose, title, children }) {
  const ref = useRef();
  const opener = useRef(null);
  // Parents pass inline arrows for onClose; reading it through a ref keeps the effect below from
  // re-running (and moving focus) on every parent render.
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return undefined;
    opener.current = document.activeElement;
    const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const onKey = (e) => {
      if (e.key === "Escape") return closeRef.current();
      if (e.key !== "Tab" || !ref.current) return undefined;
      // Keep keyboard focus inside the dialog while it is open (aria-modal does not do this by itself).
      const items = [...ref.current.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (!items.length) { e.preventDefault(); return ref.current.focus(); }
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      return undefined;
    };
    window.addEventListener("keydown", onKey);
    // Focus moves into the dialog unless a child (e.g. an autoFocus input) already took it.
    if (!ref.current?.contains(document.activeElement)) ref.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      if (opener.current instanceof HTMLElement) opener.current.focus();
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="pointer-events-auto fixed inset-0 z-[90] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            ref={ref}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            onClick={(e) => e.stopPropagation()}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="max-h-[90dvh] w-full overflow-y-auto rounded-t-3xl border border-white/20 bg-neutral-900/90 p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl outline-none backdrop-blur-2xl sm:max-w-md sm:rounded-3xl"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
              <button onClick={onClose} aria-label="Close" className="-m-2 flex h-11 w-11 items-center justify-center text-apple-muted hover:text-apple-text">
                <X size={18} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
