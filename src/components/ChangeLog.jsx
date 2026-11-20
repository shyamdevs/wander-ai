import { useState } from "react";
import { ChevronDown, Undo2 } from "lucide-react";
import { useTrip } from "../context/TripContext";

// Plain-language explanation of every edit, so nothing changes silently
export default function ChangeLog() {
  const { editor } = useTrip();
  const [open, setOpen] = useState(true);
  if (!editor.changes.length) return null;

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5" aria-label="What changed">
      <div className="flex items-center">
        <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex min-h-[44px] flex-1 items-center gap-2 px-4 text-left text-sm font-semibold">
          What changed
          <ChevronDown size={16} className={`text-apple-muted transition ${open ? "rotate-180" : ""}`} />
        </button>
        {editor.canUndo && (
          <button onClick={editor.undo} className="mr-2 flex min-h-[44px] items-center gap-1.5 rounded-full px-3 text-xs font-medium text-apple-blue transition hover:bg-white/10">
            <Undo2 size={14} /> Undo
          </button>
        )}
      </div>
      {open && (
        <ul className="space-y-2 px-4 pb-4">
          {editor.changes.slice(0, 4).flatMap((c) => c.notes.map((n, i) => (
            <li key={`${c.id}-${i}`} className="text-xs leading-relaxed text-apple-muted">• {n}</li>
          )))}
        </ul>
      )}
    </section>
  );
}
