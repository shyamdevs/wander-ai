const WEEK = 7 * 1440;
const at = (p) => p.day * 1440 + (p.hour || 0) * 60 + (p.minute || 0);

/**
 * Is the place open at `minutes` after midnight on `date`? Uses Google's regularOpeningHours
 * periods (day 0 = Sunday). Returns "open" | "closed" | "unknown" — never guesses.
 */
export function openStatus(periods, date, minutes) {
  if (!periods?.length || !date) return "unknown";
  // Open 24/7 is reported as a single period opening Sunday 00:00 with no close
  if (periods.length === 1 && periods[0].open && !periods[0].close) return "open";
  const t = date.getDay() * 1440 + minutes;
  for (const p of periods) {
    if (!p.open || !p.close) continue;
    const o = at(p.open);
    let c = at(p.close);
    if (c <= o) c += WEEK;
    if ((t >= o && t < c) || (t + WEEK >= o && t + WEEK < c)) return "open";
  }
  return "closed";
}
