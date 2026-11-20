import { motion } from "framer-motion";
import { Wallet, Route, BedDouble } from "lucide-react";
import Navbar from "../components/Navbar";
import GlassCard from "../components/GlassCard";
import PillButton from "../components/PillButton";

const spring = { type: "spring", stiffness: 300, damping: 30 };

// `pos` only applies on lg+ screens; below that the cards form a swipeable row
const FEATURES = [
  { icon: Wallet, title: "AI Budget Breakdown", text: "Tell us your budget. Gemini splits it across travel, stay, food and activities.", pos: "lg:left-[6%] lg:top-[22%]", float: 6 },
  { icon: Route, title: "3D Route Visualization", text: "Watch the globe fly to your destination and trace every stop in 3D.", pos: "lg:right-[6%] lg:top-[28%]", float: 7.5 },
  { icon: BedDouble, title: "Smart Stay & Food Planner", text: "Hotels and local food spots that actually fit what you can spend.", pos: "lg:left-[10%] lg:top-[52%]", float: 6.8 },
];

export default function Landing() {
  return (
    <motion.main
      className="pointer-events-none relative flex min-h-[100dvh] flex-col overflow-hidden"
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
    >
      <Navbar />

      {/* Feature cards only on large screens (floating around the globe); phones keep the globe uncluttered */}
      <div className="hidden lg:contents">
        {FEATURES.map(({ icon: Icon, title, text, pos, float }, i) => (
          <motion.div
            key={title}
            className={`pointer-events-auto w-64 shrink-0 lg:absolute lg:w-72 ${pos}`}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.3 + i * 0.12 }}
          >
            {/* Slow idle float, separate from the entrance spring */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: float, repeat: Infinity, ease: "easeInOut" }}
            >
              <GlassCard className="p-5">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15">
                  <Icon size={20} />
                </div>
                <h3 className="text-base font-semibold tracking-tight">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-apple-muted">{text}</p>
              </GlassCard>
            </motion.div>
          </motion.div>
        ))}
      </div>

      <motion.section
        className="mt-auto px-6 pb-10 pt-8 text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: 0.15 }}
      >
        <h1 className="text-4xl font-extrabold tracking-[-0.04em] text-white md:text-6xl">
          Travel smarter.<br className="md:hidden" /> Spend smarter.
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-base text-apple-muted md:text-lg">
          Enter a budget. Wander AI plans the trip, itemizes every rupee, and shows it on a living 3D globe.
        </p>
        <div className="pointer-events-auto mt-6 flex items-center justify-center gap-3">
          <PillButton to="/signup" className="!px-8">Get Started</PillButton>
          <PillButton to="/login" variant="glass" className="!px-8">Login</PillButton>
        </div>
      </motion.section>
    </motion.main>
  );
}