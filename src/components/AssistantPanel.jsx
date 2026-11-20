import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, MessageCircle, Send, X } from "lucide-react";
import { apiBase, getCsrfToken } from "../api/axios";
import { useTrip } from "../context/TripContext";
import useWeather from "../hooks/useWeather";

// Chat that knows the current trip, the day and the destination you're looking at
export default function AssistantPanel() {
  const { plan, activeDay, destination, focusStop } = useTrip();
  const weather = useWeather(plan);
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef();
  const inputRef = useRef();
  const launcherRef = useRef();
  const abortRef = useRef(null);
  const place = destination?.stop.name || focusStop?.name;

  const chips = [
    place ? `What should I visit after ${place}?` : "What should I visit next?",
    "Can I cover these stops in one day?",
    place ? `Find a good restaurant near ${place}` : "Find a good restaurant nearby",
    "Suggest an alternative if it rains",
    "Reduce my trip budget",
  ];

  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [msgs, busy, open]);

  // Never keep paying for tokens (or writing to unmounted state) once the panel is gone.
  useEffect(() => () => abortRef.current?.abort(), []);

  // A different trip is a different conversation: stale history would make the model talk about the old trip.
  const tripKey = `${plan.destination}|${plan.title}`;
  useEffect(() => {
    abortRef.current?.abort();
    setMsgs([]);
    setText("");
    setBusy(false);
  }, [tripKey]);

  // Escape closes; focus moves into the dialog and returns to the launcher.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    inputRef.current?.focus();
    const launcher = launcherRef.current;
    return () => { window.removeEventListener("keydown", onKey); launcher?.focus(); };
  }, [open]);

  const send = async (message) => {
    const m = message.trim();
    if (!m || busy) return;
    const history = msgs.filter((x) => !x.error && x.text.trim()).map(({ role, text: t }) => ({ role, text: t }));
    const assistantIndex = msgs.length + 1;
    setMsgs((list) => [...list, { role: "user", text: m }, { role: "assistant", text: "" }]);
    setText("");
    setBusy(true);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const response = await fetch(`${apiBase()}/trips/assistant`, {
        method: "POST",
        signal: controller.signal,
        credentials: "include", // session cookie
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          ...(getCsrfToken() ? { "X-CSRF-Token": getCsrfToken() } : {}),
        },
        body: JSON.stringify({
          plan, message: m, history,
          context: { day: activeDay, stop: place },
          forecast: weather.summary,
        }),
      });
      if (!response.ok) {
        let errorMessage = "The travel assistant is temporarily unavailable.";
        try { errorMessage = (await response.json()).message || errorMessage; } catch { /* non-JSON error */ }
        throw new Error(errorMessage);
      }
      if (!response.body?.getReader) throw new Error("Your browser does not support streamed replies. Please update your browser.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let answer = "";
      const append = (token) => {
        answer += token;
        setMsgs((list) => list.map((item, index) => index === assistantIndex ? { ...item, text: answer } : item));
      };
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split(/\r?\n\r?\n/);
        buffer = events.pop() || "";
        for (const eventText of events) {
          let eventName = "message";
          const dataLines = [];
          for (const line of eventText.split(/\r?\n/)) {
            if (line.startsWith("event:")) eventName = line.slice(6).trim();
            else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
          }
          if (!dataLines.length) continue;
          const payload = JSON.parse(dataLines.join("\n"));
          if (eventName === "error") throw new Error(payload.message || "The travel assistant is temporarily unavailable.");
          if (payload.token) append(payload.token);
        }
      }
      if (!answer.trim()) append("Sorry, I couldn't come up with an answer. Please try rephrasing.");
    } catch (e) {
      if (controller.signal.aborted) return; // closed / switched trip on purpose: nothing to report
      setMsgs((list) => list.map((item, index) => index === assistantIndex
        ? { ...item, error: true, text: e.message || "Sorry, I couldn't answer that right now. Please try again." }
        : item));
    } finally {
      if (abortRef.current === controller) { abortRef.current = null; setBusy(false); }
    }
  };

  return (
    <>
      <button
        ref={launcherRef}
        onClick={() => setOpen(true)}
        aria-label="Open travel assistant"
        aria-haspopup="dialog"
        className="accent-gradient glow-cyan pointer-events-auto fixed left-3 top-[max(0.75rem,env(safe-area-inset-top))] z-30 flex h-12 items-center gap-2 rounded-full px-4 text-sm font-bold shadow-2xl transition active:scale-95 lg:bottom-6 lg:left-auto lg:right-24 lg:top-auto"
      >
        <MessageCircle size={18} /> Ask AI
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Travel assistant"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="glass-panel pointer-events-auto fixed inset-0 z-[80] flex flex-col bg-slate-950/95 lg:inset-auto lg:bottom-4 lg:right-4 lg:h-[min(680px,calc(100dvh-2rem))] lg:max-h-[calc(100dvh-2rem)] lg:w-[420px] lg:rounded-3xl lg:shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.025] p-4">
              <div>
                <p className="flex items-center gap-2 text-sm font-bold"><span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.7)]" /> Travel assistant</p>
                <p className="max-w-[16rem] truncate text-[11px] text-apple-muted">{plan.title}{place ? ` · ${place}` : ""}</p>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close assistant" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/10"><X size={18} /></button>
            </div>

            <div role="log" aria-live="polite" aria-relevant="additions text" className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-4">
              <p className="glass-surface rounded-2xl p-3 text-sm leading-relaxed">
                Hi! Ask me anything about your {plan.destination} trip. I can see your itinerary, budget{weather.summary ? " and the weather forecast" : ""}.
              </p>
              {msgs.map((m, i) => m.text ? (
                <p key={i} className={`max-w-[88%] whitespace-pre-wrap rounded-2xl p-3 text-sm leading-relaxed ${
                  m.role === "user" ? "ml-auto border border-amber-400/20 bg-amber-500/15 text-amber-50" : m.error ? "bg-rose-500/15 text-rose-200" : "glass-surface"
                }`}>{m.text}</p>
              ) : null)}
              {busy && <p className="flex items-center gap-2 text-sm text-apple-muted"><Loader2 size={15} className="animate-spin" /> Thinking…</p>}
              {!msgs.length && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {chips.map((c) => (
                    <button key={c} onClick={() => send(c)} className="min-h-[40px] rounded-full border border-white/15 bg-white/5 px-3 py-2 text-left text-xs transition hover:bg-white/15">{c}</button>
                  ))}
                </div>
              )}
              <div ref={end} />
            </div>

            <form onSubmit={(e) => { e.preventDefault(); send(text); }} className="border-t border-white/10 bg-white/[0.025] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={800}
                  aria-label="Message"
                  placeholder="Ask about your trip…"
                  className="min-h-[48px] min-w-0 flex-1 rounded-full border border-white/10 bg-slate-950/80 px-4 text-sm outline-none placeholder:text-apple-muted focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/10"
                />
                <button type="submit" disabled={busy || !text.trim()} aria-label="Send" className="accent-gradient flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition disabled:opacity-40">
                  <Send size={18} />
                </button>
              </div>
              <p className="mt-2 text-center text-[10px] text-apple-muted">AI can make mistakes. Confirm opening hours and prices before you go.</p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
