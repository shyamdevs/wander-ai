import { ArrowDown, ArrowUp, RefreshCw, Trash2 } from "lucide-react";

const btn = "flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-apple-muted transition hover:bg-white/15 hover:text-apple-text disabled:opacity-30";

// Reorder, move to another day, replace, remove. All buttons are 44px for touch.
export default function StopEditControls({ stop, index, count, dayNo, days, editor, onReplace }) {
  const off = !!editor.busy;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      <button className={btn} disabled={off || index === 0} onClick={() => editor.move(stop.sid, -1)} aria-label={`Move ${stop.name} earlier`}><ArrowUp size={16} /></button>
      <button className={btn} disabled={off || index === count - 1} onClick={() => editor.move(stop.sid, 1)} aria-label={`Move ${stop.name} later`}><ArrowDown size={16} /></button>
      <select
        aria-label={`Move ${stop.name} to another day`}
        value=""
        disabled={off || days.length < 2}
        onChange={(e) => e.target.value && editor.toDay(stop.sid, Number(e.target.value))}
        className="h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-xs text-apple-muted outline-none disabled:opacity-30"
      >
        <option value="">Move to day…</option>
        {days.filter((d) => d !== dayNo).map((d) => <option key={d} value={d} className="text-black">Day {d}</option>)}
      </select>
      <button className={btn} disabled={off} onClick={onReplace} aria-label={`Replace ${stop.name}`}><RefreshCw size={16} /></button>
      <button className={`${btn} hover:!text-red-300`} disabled={off} onClick={() => editor.remove(stop.sid)} aria-label={`Remove ${stop.name}`}><Trash2 size={16} /></button>
    </div>
  );
}
