import { useState } from "react";
import { LogOut, Globe } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTrip } from "../context/TripContext";
import PlannerForm from "./PlannerForm";
import PlanResult from "./PlanResult";
import SavedTrips from "./SavedTrips";
import PickCard from "./PickCard";

export default function PlanPanel({ mobile = false }) {
  const { user, logout } = useAuth();
  const { plan, trips, pick } = useTrip();
  const [tab, setTab] = useState("plan");

  const tabCls = (on) =>
    `flex-1 min-h-[44px] rounded-full text-center text-sm font-semibold transition ${
      on ? "bg-sky-400 text-slate-950 shadow-cyan" : "text-apple-muted hover:bg-white/5 hover:text-apple-text"
    }`;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-center justify-between px-5 pb-3 pt-5 sm:px-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-base font-extrabold tracking-tight">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-sky-400/15 text-sky-300 glow-cyan"><Globe size={18} /></span> Wander AI
          </div>
          <p className="mt-1 pl-10 telemetry-chip">{plan ? `${plan.destination} · ${plan.durationDays}D workspace` : "Obsidian cartography · AI trip desk"}</p>
        </div>
        <button onClick={logout} className="glass-control -mr-2 flex min-h-[40px] items-center gap-1.5 rounded-full px-3 text-xs text-apple-muted transition hover:text-apple-text">
          <span className="max-w-[9rem] truncate">{user?.name}</span> <LogOut size={14} />
        </button>
      </header>

      <div className="mx-5 mt-2 flex rounded-full border border-white/10 bg-slate-950/70 p-1 sm:mx-6">
        <button className={tabCls(tab === "plan")} onClick={() => setTab("plan")}>Plan</button>
        <button className={tabCls(tab === "saved")} onClick={() => setTab("saved")}>
          Saved{trips.length > 0 && ` (${trips.length})`}
        </button>
      </div>

      {/* --hidden = part of the phone sheet that is off-screen; padding keeps the last item reachable */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-5 pb-[calc(2rem+var(--hidden,0px))] sm:px-6">
        {tab === "saved" ? (
          <SavedTrips onOpen={() => setTab("plan")} />
        ) : plan ? (
          <PlanResult />
        ) : (
          <>
            {mobile && pick && <div className="mb-5"><PickCard /></div>}
            <h1 className="text-2xl font-semibold tracking-tight">Plot your next escape.</h1>
            <p className="mb-5 mt-1 text-sm text-apple-muted">Set your coordinates, budget and pace. Wander handles the route.</p>
            <PlannerForm />
          </>
        )}
      </div>
    </div>
  );
}
