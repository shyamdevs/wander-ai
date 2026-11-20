import { Link } from "react-router-dom";

const variants = {
  primary: "accent-gradient",
  glass: "border border-white/20 bg-white/10 text-apple-text backdrop-blur-xl hover:bg-white/20",
};

// Renders a router <Link> when `to` is set, otherwise a <button>
export default function PillButton({ to, variant = "primary", className = "", children, ...rest }) {
  const cls = `inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium
    tracking-tight transition duration-200 hover:scale-[1.02] active:scale-95
    disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`;
  return to ? (
    <Link to={to} className={cls} {...rest}>{children}</Link>
  ) : (
    <button className={cls} {...rest}>{children}</button>
  );
}
