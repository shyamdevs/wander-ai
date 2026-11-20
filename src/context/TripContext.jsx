import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";
import usePick from "./usePick";
import useTripEditor from "../hooks/useTripEditor";
import useTripStorage from "../hooks/useTripStorage";
import useTripGenerator from "../hooks/useTripGenerator";
import { computeFocus, pickFocus } from "../three/tripHelpers";
import { view } from "../three/viewState";
import { findStop, withIds } from "../utils/editOps";
import { tomorrowISO } from "../utils/dates";
import { withEstimatedCosts } from "../utils/costEstimates";

const TripContext = createContext(null);
export const useTrip = () => useContext(TripContext);

const emptyForm = () => ({
  destination: "", budget: "", currency: "INR", days: 5, style: "balanced", travelers: 1, startDate: tomorrowISO(),
});

export function TripProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();
  const [plan, setPlanRaw] = useState(null);
  const setPlan = useCallback((p) => setPlanRaw(p ? withIds(withEstimatedCosts(p)) : null), []);
  const [savedId, setSavedId] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [activeDay, setActiveDay] = useState("all");
  const [focusStop, setFocusStop] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | loading | saving
  const [generationKey, setGenerationKey] = useState(0);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [destSid, setDestSid] = useState(null); // destination currently open in the detail view
  const [travelMode, setTravelMode] = useState("AUTO"); // AUTO | WALK | DRIVE | TRANSIT
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [mapOpen, setMapOpen] = useState(false);
  const { pick, pickPlace, clearPick } = usePick((label) => setForm((f) => ({ ...f, destination: label })));
  const editor = useTripEditor({ plan, setPlan, setDirty, toast });

  const openMap = () => setMapOpen(true);
  const closeMap = () => { setMapOpen(false); view.scale = 1; };

  const show = (p, id = null) => {
    setPlan(p);
    setSavedId(id);
    setActiveDay("all");
    setFocusStop(null);
    setDestSid(null);
    setExpanded(p ? { 1: true } : {});
    setDirty(false);
    setEditing(false);
    editor.reset();
    // A loaded/generated trip opens directly on its satellite itinerary map.
    setMapOpen(Boolean(p));
  };

  const storage = useTripStorage({ plan, savedId, setSavedId, dirty, setDirty, show, setStatus, toast });
  const gen = useTripGenerator({
    form, setForm, pick, plan, show, setStatus, setError,
    onGenerationStart: () => {
      setMapOpen(false);
      setGenerationKey((key) => key + 1);
      view.scale = 1;
    },
    // Once the itinerary is ready, reveal its satellite map automatically.
    onGenerationComplete: () => setMapOpen(true),
  });

  useEffect(() => {
    if (!user) {
      show(null);
      storage.setTrips([]);
      clearPick();
      setForm(emptyForm());
      closeMap();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ---- destination detail view (the itinerary stays mounted underneath) ----
  const destination = useMemo(() => {
    const f = plan && destSid ? findStop(plan, destSid) : null;
    if (!f) return null;
    const { stops } = f.day;
    return { stop: f.stop, day: f.day, index: f.index, prev: stops[f.index - 1] || null, next: stops[f.index + 1] || null };
  }, [plan, destSid]);
  useEffect(() => { if (destSid && !destination) setDestSid(null); }, [destSid, destination]);

  const openDestination = (stop) => {
    const f = plan && findStop(plan, stop.sid);
    if (!f) return;
    setDestSid(f.stop.sid);
    setFocusStop({ ...f.stop, day: f.day.day });
    setExpanded((e) => ({ ...e, [f.day.day]: true }));
  };
  const closeDestination = () => {
    const sid = destSid;
    setDestSid(null);
    requestAnimationFrame(() => document.getElementById(`stop-${sid}`)?.scrollIntoView({ block: "center", behavior: "smooth" }));
  };

  // Provider confirmed the place: use its real id + coordinates instead of the AI's guess
  const verifyStop = useCallback((sid, place) => {
    const patch = { placeId: place.placeId, latitude: place.location.latitude, longitude: place.location.longitude };
    setPlanRaw((p) => {
      const f = p && findStop(p, sid);
      if (!f) return p;
      const s = f.stop;
      if (s.placeId === patch.placeId && Math.abs(s.latitude - patch.latitude) < 1e-6 && Math.abs(s.longitude - patch.longitude) < 1e-6) return p;
      return { ...p, itinerary: p.itinerary.map((d) => ({ ...d, stops: d.stops.map((x) => (x.sid === sid ? { ...x, ...patch } : x)) })) };
    });
    setFocusStop((f) => (f?.sid === sid ? { ...f, ...patch } : f));
  }, []);

  const toggleDay = (d) => setExpanded((e) => ({ ...e, [d]: !e[d] }));
  const selectDay = (d) => {
    setActiveDay(d);
    setFocusStop(null);
    if (d === "all") return;
    setExpanded((e) => ({ ...e, [d]: true }));
    requestAnimationFrame(() => document.getElementById(`day-${d}`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const focus = useMemo(
    () => (plan ? computeFocus(plan, activeDay, focusStop) : pick ? pickFocus(pick) : null),
    [plan, activeDay, focusStop, pick]
  );

  const value = {
    plan, savedId, dirty, activeDay, focusStop, focus, status, generationKey, error, form, setForm, pick, pickPlace, clearPick,
    mapOpen, openMap, closeMap, destination, openDestination, closeDestination, verifyStop,
    travelMode, setTravelMode, editing, setEditing, expanded, toggleDay, selectDay, setFocusStop, setActiveDay,
    editor, ...storage, ...gen,
    clearPlan: () => { show(null); clearPick(); setError(""); },
  };
  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}
