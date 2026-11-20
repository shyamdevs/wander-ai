import { BadgeCheck, Sparkles } from "lucide-react";

// Makes the source of every fact visible: provider-verified data, or an AI estimate
const KINDS = {
  verified: ["bg-emerald-400/15 text-emerald-300", BadgeCheck, "Mapped data"],
  estimate: ["bg-amber-400/15 text-amber-300", Sparkles, "AI estimate"],
  ai: ["bg-violet-400/15 text-violet-300", Sparkles, "AI-written"],
};

export default function Badge({ kind, label }) {
  const [cls, Icon, text] = KINDS[kind];
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${cls}`}>
      <Icon size={10} /> {label || text}
    </span>
  );
}
