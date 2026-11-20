import { estimateLeg } from "./geo";

export const DAY_START = 9 * 60; // 9:00 AM
const DEFAULT_MIN = { food: 60, stay: 30, transport: 20, sightseeing: 90, activity: 90 };

export const stopMinutes = (s) => (s.durationMinutes > 0 ? s.durationMinutes : DEFAULT_MIN[s.category] ?? 75);

/**
 * Chronological timetable for one day. legs[i] is the leg from stop i-1 to stop i
 * (real Google data when loaded, otherwise an estimate). All times are suggestions.
 */
export function buildSchedule(stops, legs = [], start = DAY_START) {
  let t = start;
  return stops.map((s, i) => {
    const leg = i === 0 ? null : legs[i] || estimateLeg(stops[i - 1], s);
    if (leg) t += leg.minutes;
    const arrive = t;
    const depart = arrive + stopMinutes(s);
    t = depart;
    return { arrive, depart, leg };
  });
}
