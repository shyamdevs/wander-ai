import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Globe, Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import PillButton from "./PillButton";

const spring = { type: "spring", stiffness: 300, damping: 30 };

// Pill nav on desktop, hamburger + dropdown on phones
export default function Navbar() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const links = user ? (
    <PillButton to="/dashboard" onClick={close} className="!px-5 !py-2.5 max-sm:w-full">Dashboard</PillButton>
  ) : (
    <>
      <PillButton to="/login" variant="glass" onClick={close} className="!px-5 !py-2.5 max-sm:w-full">Login</PillButton>
      <PillButton to="/signup" onClick={close} className="!px-5 !py-2.5 max-sm:w-full">Sign Up</PillButton>
    </>
  );

  return (
    <div className="pointer-events-auto relative z-30 mx-auto mt-3 w-[calc(100%-1.5rem)] max-w-5xl sm:mt-5 sm:w-[calc(100%-2rem)]">
      <motion.nav
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
        className="glass-panel flex items-center justify-between rounded-full py-1.5 pl-4 pr-1.5 sm:px-5 sm:py-2.5"
      >
        <Link to="/" onClick={close} className="flex min-h-[44px] items-center gap-2 text-base font-semibold tracking-tight">
          <Globe size={18} className="text-apple-blue" /> Wander AI
        </Link>
        <div className="hidden items-center gap-2 sm:flex">{links}</div>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="flex h-11 w-11 items-center justify-center rounded-full text-apple-text transition hover:bg-white/10 sm:hidden"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </motion.nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={spring}
            className="absolute inset-x-0 top-full mt-2 flex flex-col gap-2 rounded-3xl border border-white/20 bg-neutral-900/85 p-3 shadow-2xl backdrop-blur-2xl sm:hidden"
          >
            {links}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}