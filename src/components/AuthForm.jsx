import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import GlassCard from "./GlassCard";
import GlassInput from "./GlassInput";
import PillButton from "./PillButton";

const spring = { type: "spring", stiffness: 300, damping: 30 };

// Shared by /login and /signup. `dir` sets which way the card swings in/out in 3D.
export default function AuthForm({ mode }) {
  const isLogin = mode === "login";
  const dir = isLogin ? -1 : 1;
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (isLogin) await login(form.email, form.password);
      else await signup(form.name, form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4 py-6" style={{ perspective: 1200 }}>
      <GlassCard
        className="pointer-events-auto w-full max-w-md p-8"
        initial={{ opacity: 0, rotateY: dir * 40, scale: 0.92 }}
        animate={{ opacity: 1, rotateY: 0, scale: 1, transition: spring }}
        exit={{ opacity: 0, rotateY: -dir * 40, scale: 0.92, transition: { duration: 0.25 } }}
        style={{ transformStyle: "preserve-3d" }}
      >
        <div className="mb-6 grid grid-cols-2 rounded-full bg-black/30 p-1 text-sm font-medium">
          {["login", "signup"].map((m) => (
            <Link
              key={m}
              to={`/${m}`}
              className={`rounded-full py-2 text-center transition ${
                mode === m ? "bg-white/20 text-apple-text" : "text-apple-muted hover:text-apple-text"
              }`}
            >
              {m === "login" ? "Login" : "Sign Up"}
            </Link>
          ))}
        </div>

        <h1 className="text-3xl font-semibold tracking-tight">
          {isLogin ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-1 mb-6 text-sm text-apple-muted">
          {isLogin ? "Pick up your trips where you left off." : "Plan your next trip around your budget."}
        </p>

        <form onSubmit={submit} className="space-y-4">
          {!isLogin && (
            <GlassInput label="Name" value={form.name} onChange={set("name")} placeholder="Your name" autoComplete="name" maxLength={80} required />
          )}
          <GlassInput label="Email" type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" autoComplete="email" maxLength={320} required />
          <GlassInput
            label="Password"
            type="password"
            value={form.password}
            onChange={set("password")}
            placeholder={isLogin ? "Your password" : "10+ characters, with a number or symbol"}
            minLength={isLogin ? undefined : 10}
            maxLength={72}
            autoComplete={isLogin ? "current-password" : "new-password"}
            required
          />
          {error && (
            <motion.p role="alert" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-red-300">
              {error}
            </motion.p>
          )}
          <PillButton type="submit" disabled={busy} className="w-full">
            {busy ? "Please wait…" : isLogin ? "Login" : "Create account"}
          </PillButton>
        </form>
      </GlassCard>
    </div>
  );
}
