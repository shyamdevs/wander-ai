import { Cloud, CloudFog, CloudLightning, CloudRain, CloudSnow, Sun } from "lucide-react";

const ICONS = { clear: Sun, cloud: Cloud, fog: CloudFog, rain: CloudRain, snow: CloudSnow, storm: CloudLightning };

// Real forecast (Open-Meteo). Renders nothing when the date is outside the forecast window.
export default function WeatherChip({ w }) {
  if (!w) return null;
  const Icon = ICONS[w.kind] || Cloud;
  return (
    <span
      title={`${w.label}, ${w.min}–${w.max}°C${w.rain != null ? `, ${w.rain}% chance of rain` : ""} (Open-Meteo forecast)`}
      className="flex shrink-0 items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-[11px] text-apple-muted"
    >
      <Icon size={13} /> {w.max}°{w.rain >= 40 && <span className="text-apple-blue">{w.rain}%</span>}
    </span>
  );
}
