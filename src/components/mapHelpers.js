import L from "leaflet";

// Esri World Imagery (satellite) + Esri place/boundary labels = Google-Maps-style "Hybrid"
export const SAT = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
export const LABELS =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}";
export const ATTR = 'Imagery © <a href="https://www.esri.com/" target="_blank" rel="noopener">Esri</a>, Maxar, Earthstar Geographics';

// Only numbers and our own palette colours go into the HTML (stop names never do)
export const stopIcon = (n, color, selected) =>
  L.divIcon({
    className: "",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    html: `<div class="wander-pin${selected ? " sel" : ""}" style="--c:${color}"><span>${n}</span></div>`,
  });

export const pickIcon = (isError) =>
  L.divIcon({
    className: "",
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    html: `<div class="wander-pick${isError ? " err" : ""}"></div>`,
  });

export const visibleDays = (plan, activeDay) =>
  activeDay === "all" ? plan.itinerary : plan.itinerary.filter((d) => d.day === activeDay);

// The map box is already clear of the panel, so only small paddings are needed
export function fitOptions(maxZoom) {
  return { paddingTopLeft: [50, 80], paddingBottomRight: [50, 50], maxZoom, duration: 1.6 };
}

export const normLng = (lng) => ((((lng + 180) % 360) + 360) % 360) - 180;
