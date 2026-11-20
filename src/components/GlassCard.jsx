import { motion } from "framer-motion";

// visionOS-style frosted panel. Accepts any motion props.
export default function GlassCard({ className = "", children, ...rest }) {
  return (
    <motion.div
      className={`glass-panel rounded-3xl ${className}`}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
