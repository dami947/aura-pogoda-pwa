import { getWeatherIcon, windDirection, formatTime } from "@/lib/weatherHelpers";
import {
  Droplets, Gauge, Wind, Eye, Sunrise, Sunset, Thermometer, CloudCog,
} from "lucide-react";

const MetricCard = ({ icon: Icon, label, value, sub, testid }) => (
  <div
    className="rounded-3xl backdrop-blur-2xl bg-white/10 border border-white/20 p-4 sm:p-5 shadow-lg transition-colors hover:bg-white/15"
    data-testid={testid}
  >
    <div className="flex items-center gap-2 text-white/70 mb-2">
      <Icon className="w-4 h-4" strokeWidth={1.8} />
      <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
    </div>
    <div className="text-xl sm:text-2xl font-semibold text-white tabular-nums">{value}</div>
    {sub && <div className="text-xs text-white/60 mt-0.5">{sub}</div>}
  </div>
);

export const WeatherMetricsBento = ({ current }) => {
  if (!current) return null;
  const tz = current.timezone || 0;
  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5" data-testid="metrics-bento">
      <MetricCard icon={Thermometer} label="Odczuwalna" value={`${current.feels_like}°`} sub={`Min ${current.temp_min}° / Maks ${current.temp_max}°`} testid="metric-feels-like" />
      <MetricCard icon={Droplets} label="Wilgotność" value={`${current.humidity}%`} testid="metric-humidity" />
      <MetricCard icon={Wind} label="Wiatr" value={`${Math.round(current.wind_speed * 3.6)} km/h`} sub={windDirection(current.wind_deg)} testid="metric-wind" />
      <MetricCard icon={Gauge} label="Ciśnienie" value={`${current.pressure}`} sub="hPa" testid="metric-pressure" />
      <MetricCard icon={Eye} label="Widoczność" value={`${(current.visibility / 1000).toFixed(1)} km`} testid="metric-visibility" />
      <MetricCard icon={CloudCog} label="Zachmurzenie" value={`${current.clouds}%`} testid="metric-clouds" />
      {current.sunrise && <MetricCard icon={Sunrise} label="Wschód" value={formatTime(current.sunrise, tz)} testid="metric-sunrise" />}
      {current.sunset && <MetricCard icon={Sunset} label="Zachód" value={formatTime(current.sunset, tz)} testid="metric-sunset" />}
    </section>
  );
};
