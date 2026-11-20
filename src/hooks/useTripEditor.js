import { useRef, useState } from "react";
import api from "../api/axios";
import { lookupPlace } from "../api/places";
import { findStop, insertStop, moveStop, moveStopToDay, removeStop, replaceDay, replaceStop, uid } from "../utils/editOps";
import { money } from "../utils/format";
import { withEstimatedCosts } from "../utils/costEstimates";

const KIND_CATEGORY = { restaurants: "food", cafes: "food", hotels: "stay", shopping: "sightseeing", attractions: "sightseeing" };
const msg = (e) => e.response?.data?.message || e.message || "Something went wrong.";

/**
 * Every itinerary change goes through commit(): it snapshots the old plan (undo),
 * marks the trip as having unsaved changes, and records a plain-language explanation.
 */
export default function useTripEditor({ plan, setPlan, setDirty, toast }) {
  const planRef = useRef(plan);
  planRef.current = plan;
  const history = useRef([]);
  const [undoable, setUndoable] = useState(false);
  const [changes, setChanges] = useState([]);
  const [busy, setBusy] = useState("");

  const commit = (next, notes = []) => {
    history.current = [...history.current.slice(-19), planRef.current];
    setUndoable(true);
    const prepared = withEstimatedCosts(next);
    planRef.current = prepared;
    setPlan(prepared);
    setDirty(true);
    if (notes.length) setChanges((c) => [{ id: uid(), notes }, ...c].slice(0, 8));
  };
  const cur = () => planRef.current.currency;

  // ---- instant local edits ----
  const remove = (sid) => {
    const f = findStop(planRef.current, sid);
    if (!f) return;
    const c = f.stop.estimatedCost || 0;
    commit(removeStop(planRef.current, sid), [
      `Removed “${f.stop.name}” from Day ${f.day.day}.${c ? ` Estimated spend drops by ${money(c, cur())}.` : ""}`,
    ]);
  };
  const move = (sid, dir) => {
    const f = findStop(planRef.current, sid);
    const next = f && moveStop(planRef.current, sid, dir);
    if (!next || next === planRef.current) return;
    commit(next, [`Moved “${f.stop.name}” ${dir < 0 ? "earlier" : "later"} on Day ${f.day.day}. Travel times update automatically.`]);
  };
  const toDay = (sid, day) => {
    const f = findStop(planRef.current, sid);
    const next = f && moveStopToDay(planRef.current, sid, day);
    if (!next || next === planRef.current) return;
    commit(next, [`Moved “${f.stop.name}” from Day ${f.day.day} to the end of Day ${day}. Use Optimize on Day ${day} to place it well.`]);
  };

  // ---- AI edits (server returns an explanation for every change) ----
  const run = async (label, fn) => {
    setBusy(label);
    try { await fn(); } catch (e) { toast.error(msg(e)); } finally { setBusy(""); }
  };
  const refine = (body) => api.post("/trips/refine", { plan: planRef.current, ...body }).then((r) => r.data);

  const regenerateDay = (day, note) =>
    run(`Regenerating Day ${day}…`, async () => {
      const d = await refine({ action: "regenerateDay", day, note });
      commit(replaceDay(planRef.current, day, d.day), d.changes);
      toast.success(`Day ${day} regenerated. See “What changed”.`);
    });

  const optimize = (day) =>
    run("Optimizing route…", async () => {
      const d = await refine({ action: "optimize", day });
      const same = d.itinerary.every((dd, i) => dd.stops.every((s, j) => s.sid === planRef.current.itinerary[i]?.stops[j]?.sid));
      if (same) return toast.info(d.changes[0]);
      commit({ ...planRef.current, itinerary: d.itinerary }, d.changes);
      toast.success("Route optimized. See “What changed”.");
    });

  const replaceStopAI = (sid, request) =>
    run("Finding a replacement…", async () => {
      const d = await refine({ action: "replaceStop", sid, request });
      commit(replaceStop(planRef.current, d.sid, d.stop), d.changes);
      toast.success("Destination replaced.");
    });

  const aiAdd = async (dayNo, request) => {
    const d = await refine({ action: "addStop", day: dayNo, request });
    commit(insertStop(planRef.current, d.dayNo, d.stop, d.index), d.changes);
    toast.success(`Added “${d.stop.name}” to Day ${dayNo}.`);
  };
  const addStopAI = (day, request) => run("Asking AI…", () => aiAdd(day, request));

  // A place verified by the active Geoapify / OpenStreetMap lookup provider.
  const addVerified = (dayNo, info) => {
    commit(
      insertStop(planRef.current, dayNo, {
        sid: uid(), name: String(info.name || "Unnamed place").slice(0, 120), description: String(info.summary || "").slice(0, 400), category: info.category || KIND_CATEGORY[info.kind] || "sightseeing",
        timeOfDay: "afternoon", estimatedCost: 0, durationMinutes: 60, bestTimeToVisit: "", highlights: [],
        placeId: info.placeId, latitude: info.location.latitude, longitude: info.location.longitude,
      }),
      [`Added “${info.name}” (verified place) to the end of Day ${dayNo}. Its cost is unknown, so the budget is unchanged. Use ↑/↓ or Optimize to place it better.`]
    );
    toast.success(`Added “${info.name}” to Day ${dayNo}.`);
  };

  const addPlace = (dayNo, name) =>
    run("Searching nearby places…", async () => {
      const p = planRef.current;
      const anchor = p.itinerary.find((d) => d.day === dayNo)?.stops.at(-1) || p.destinationCoords;
      let info = null;
      try {
        info = await lookupPlace({ name, latitude: anchor.latitude, longitude: anchor.longitude }, p.destination, 30000);
      } catch (e) {
        toast.info("Place search is temporarily unavailable. Asking AI for a suggestion instead…");
      }
      // The server answers `found: true, verified: false` when no provider matched, echoing the
      // anchor stop's own coordinates. Adding that would drop a made-up pin on another place's spot
      // and label it "verified", so only a provider-confirmed place is added directly.
      if (info?.found && info.verified) return addVerified(dayNo, { ...info, summary: info.summary });
      toast.info(`Couldn't verify “${name}” nearby. Asking AI for a suggestion instead…`);
      await aiAdd(dayNo, name);
    });

  const undo = () => {
    const prev = history.current.pop();
    if (!prev) return;
    setUndoable(history.current.length > 0);
    planRef.current = prev;
    setPlan(prev);
    setDirty(true);
    toast.info("Undid the last change.");
  };
  const reset = () => { history.current = []; setUndoable(false); setChanges([]); };

  return {
    busy, changes, canUndo: undoable, undo, reset, remove, move, toDay,
    regenerateDay, optimize, replaceStopAI, addStopAI, addPlace, addVerified,
  };
}
