import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Crosshair, Tag } from "lucide-react";
import { useTrip } from "../context/TripContext";
import { dayColor, sameStop } from "../three/tripHelpers";
import { view } from "../three/viewState";
import { SAT, LABELS, ATTR, stopIcon, pickIcon, visibleDays, fitOptions, normLng } from "./mapHelpers";
import { MAP_BOX } from "./mapLayout";
import { routeLeg } from "../api/places";
import { estimateLeg } from "../utils/geo";

// Full-screen satellite map (zoom to street level). Shows the trip's real places as numbered pins.
export default function SatelliteMap() {
  const { plan, activeDay, focusStop, openDestination, pick, pickPlace, closeMap, travelMode } = useTrip();
  const box = useRef();
  const map = useRef();
  const stops = useRef();
  const pickLayer = useRef();
  const labels = useRef();
  const routeLayer = useRef();
  const baseLayer = useRef();
  const roadLayer = useRef();
  const live = useRef({}); // latest callbacks for Leaflet event handlers
  live.current = { plan, pickPlace, closeMap, openDestination };
  const [showLabels, setShowLabels] = useState(true);
  const [baseType, setBaseType] = useState("satellite");

  // Create the map once
  useEffect(() => {
    const m = L.map(box.current, {
      zoomControl: false, attributionControl: false, minZoom: 2, maxZoom: 19, zoomSnap: 0.5, worldCopyJump: true,
    });
    m.setView([view.lat, view.lon], 4); // start where the globe was facing
    baseLayer.current = L.tileLayer(SAT, { maxNativeZoom: 18, maxZoom: 19, attribution: ATTR }).addTo(m);
    roadLayer.current = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>' });
    labels.current = L.tileLayer(LABELS, { maxNativeZoom: 18, maxZoom: 19, zIndex: 5 }).addTo(m);
    L.control.zoom({ position: "bottomright" }).addTo(m);
    L.control.attribution({ position: "bottomright", prefix: false }).addTo(m);
    stops.current = L.layerGroup().addTo(m);
    routeLayer.current = L.layerGroup().addTo(m);
    pickLayer.current = L.layerGroup().addTo(m);

    // Before a plan exists, tapping the map picks a destination (same as tapping the globe)
    m.on("click", (e) => {
      if (!live.current.plan) live.current.pickPlace(e.latlng.lat, normLng(e.latlng.lng));
    });
    // Zooming far out returns to the 3D globe
    const arm = setTimeout(() => {
      m.on("zoomend", () => { if (m.getZoom() <= 2.5) live.current.closeMap(); });
    }, 2500);

    map.current = m;
    const ro = new ResizeObserver(() => m.invalidateSize());
    ro.observe(box.current);
    return () => { clearTimeout(arm); ro.disconnect(); m.remove(); map.current = null; };
  }, []);

  // First fly-in when there is no plan yet: to the picked place, or where the globe was facing
  useEffect(() => {
    const m = map.current;
    if (!m || plan) return;
    const c = pick ? [pick.lat, pick.lon] : [view.lat, view.lon];
    m.flyToBounds(L.latLngBounds([c, c]), fitOptions(pick ? 9 : 6));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  useEffect(() => {
    const m = map.current;
    if (!m || !baseLayer.current || !roadLayer.current) return;
    if (baseType === "satellite") {
      roadLayer.current.remove();
      baseLayer.current.addTo(m);
      if (showLabels) labels.current?.addTo(m);
    } else {
      baseLayer.current.remove();
      roadLayer.current.addTo(m);
      labels.current?.remove();
    }
  }, [baseType, showLabels]);

  useEffect(() => {
    const m = map.current;
    if (!m || !labels.current) return;
    if (showLabels && baseType === "satellite") labels.current.addTo(m);
    else labels.current.remove();
  }, [showLabels, baseType]);

  // Trip places + routes. Day N selected -> only Day N is drawn, and the map flies to it.
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    stops.current.clearLayers();
    routeLayer.current.clearLayers();
    if (!plan) return;

    const pts = [];
    visibleDays(plan, activeDay).forEach((d) => {
      const color = dayColor(d.day);
      const line = d.stops.map((s) => [s.latitude, s.longitude]);
      if (line.length > 1) {
        L.polyline(line, { color, weight: 3, opacity: 0.45, dashArray: "3 9", lineCap: "round", className: "route-flow" })
          .addTo(stops.current);
      }
      d.stops.forEach((s, i) => {
        const stop = { ...s, day: d.day };
        const marker = L.marker([s.latitude, s.longitude], {
          icon: stopIcon(i + 1, color, sameStop(stop, focusStop)),
          riseOnHover: true,
        }).addTo(stops.current);
        const tip = document.createElement("span");
        tip.textContent = s.name; // textContent: never trust model output as HTML
        marker.bindTooltip(tip, { direction: "top", offset: [0, -16], className: "wander-tip" });
        marker.on("click", () => live.current.openDestination(stop));
        pts.push([s.latitude, s.longitude]);
      });
    });

    let cancelled = false;
    const routeRequests = visibleDays(plan, activeDay).flatMap((day) => day.stops.slice(1).map(async (stop, index) => {
      const from = day.stops[index];
      const mode = travelMode === "AUTO" ? estimateLeg(from, stop, "AUTO").mode : travelMode;
      if (mode === "TRANSIT") return;
      try {
        const route = await routeLeg(from, stop, mode);
        if (cancelled || !route?.geometry || route.geometry.length < 2) return;
        L.polyline(route.geometry, { color: "#60a5fa", weight: 5, opacity: 0.95, lineCap: "round" }).addTo(routeLayer.current);
      } catch { /* the dotted estimate remains visible when a route provider is unavailable */ }
    }));
    Promise.all(routeRequests).catch(() => {});
    const target = focusStop ? [[focusStop.latitude, focusStop.longitude]] : pts;
    if (target.length) m.flyToBounds(L.latLngBounds(target), fitOptions(focusStop ? 16 : 15));
    return () => { cancelled = true; };
  }, [plan, activeDay, focusStop, travelMode]);

  useEffect(() => {
    if (!map.current) return;
    pickLayer.current.clearLayers();
    if (plan || !pick) return;
    L.marker([pick.lat, pick.lon], { icon: pickIcon(pick.state === "error"), interactive: false }).addTo(pickLayer.current);
  }, [pick, plan]);

  return (
    <motion.div
      className={`${MAP_BOX} workspace-map-frame`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div ref={box} className="h-full w-full" />
      <div className="glass-panel absolute left-4 top-4 z-[1000] hidden items-center gap-2 rounded-2xl px-3 py-2 sm:flex">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-sky-400/15 text-sky-300"><Crosshair size={16} /></span>
        <span className="min-w-0">
          <span className="block telemetry-chip">Spatial workspace</span>
          <span className="block max-w-[220px] truncate text-xs font-semibold text-white">{plan?.destination || "Choose a destination"}</span>
        </span>
        {plan && <span className="telemetry-chip rounded-full border border-sky-400/20 bg-sky-400/10 px-2 py-1">{plan.itinerary?.length || 0} days</span>}
      </div>
      <div className="glass-control absolute left-4 top-[4.5rem] z-[1000] flex rounded-full p-1">
        {[ ["satellite", "Satellite"], ["road", "Road"] ].map(([id, label]) => (
          <button key={id} onClick={() => setBaseType(id)} aria-pressed={baseType === id}
            className={`min-h-9 rounded-full px-3 text-xs font-semibold transition ${baseType === id ? "bg-sky-400 text-slate-950 shadow-cyan" : "text-slate-300 hover:bg-white/10"}`}>{label}</button>
        ))}
      </div>
      <button
        onClick={() => setShowLabels((v) => !v)}
        className={`glass-control absolute right-4 top-[4.5rem] z-[1000] flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition active:scale-95 ${
          showLabels ? "border-sky-400/40 bg-sky-400 text-slate-950" : "text-apple-text"
        }`}
      >
        <Tag size={15} /> Labels
      </button>
    </motion.div>
  );
}
