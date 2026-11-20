import { useEffect, useState } from "react";
import Modal from "./ui/Modal";
import PillButton from "./PillButton";

// Small "type something" dialog used by Add place / Replace / Regenerate day
export default function PromptDialog({ open, onClose, title, description, label, placeholder, submitLabel, required, onSubmit }) {
  const [text, setText] = useState("");
  useEffect(() => { if (open) setText(""); }, [open]);

  const submit = (e) => {
    e.preventDefault();
    if (required && !text.trim()) return;
    onSubmit(text.trim());
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form onSubmit={submit} className="space-y-4">
        {description && <p className="text-sm leading-relaxed text-apple-muted">{description}</p>}
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium tracking-wide text-apple-muted">{label}</span>
          <input
            autoFocus
            value={text}
            maxLength={200}
            onChange={(e) => setText(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-apple-text placeholder-apple-muted outline-none transition focus:border-white/40 focus:bg-white/15"
          />
        </label>
        <PillButton type="submit" disabled={required && !text.trim()} className="min-h-[48px] w-full">{submitLabel}</PillButton>
      </form>
    </Modal>
  );
}
