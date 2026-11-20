export const isoDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function tomorrowISO() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return isoDate(d);
}

// Date of trip day N (1-based), or null when the trip has no start date
export function dayDate(startDate, day) {
  const [y, m, d] = String(startDate || "").split("-").map(Number);
  return y && m && d ? new Date(y, m - 1, d + day - 1) : null;
}

export const fmtDate = (d) =>
  d ? d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" }) : "";
