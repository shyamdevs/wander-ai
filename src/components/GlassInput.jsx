export default function GlassInput({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium tracking-wide text-apple-muted">{label}</span>
      <input
        {...props}
        className="w-full rounded-2xl border border-white/10 bg-slate-950/65 px-4 py-3 text-sm text-apple-text
          placeholder-apple-muted outline-none transition focus:border-sky-400 focus:bg-slate-950/90 focus:ring-2 focus:ring-sky-400/60"
      />
    </label>
  );
}
