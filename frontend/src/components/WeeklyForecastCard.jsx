import { getWeatherIcon, dayName } from "@/lib/weatherHelpers";
import { Droplets } from "lucide-react";

export const WeeklyForecastCard = ({ daily = [] }) => {
  if (!daily.length) return null;

  const globalMin = Math.min(...daily.map((d) => d.temp_min));
  const globalMax = Math.max(...daily.map((d) => d.temp_max));
  const range = globalMax - globalMin || 1;

  return (
    <section
      className="rounded-3xl backdrop-blur-2xl bg-white/10 border border-white/20 p-5 sm:p-6 shadow-xl"
      data-testid="weekly-forecast-section"
    >
      <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70 mb-4">
        Prognoza na najbliższe dni
      </h2>
      <div className="flex flex-col divide-y divide-white/10">
        {daily.map((d, i) => {
          const Icon = getWeatherIcon(d.icon);
          const leftPct = ((d.temp_min - globalMin) / range) * 100;
          const widthPct = ((d.temp_max - d.temp_min) / range) * 100;
          return (
            <div key={i} className="flex items-center gap-3 py-3" data-testid={`daily-item-${i}`}>
              <span className="w-20 text-sm font-medium text-white capitalize">{dayName(d.dt)}</span>
              <Icon className="w-6 h-6 text-white shrink-0" strokeWidth={1.6} />
              <span className="w-10 flex items-center gap-0.5 text-[11px] text-sky-200">
                {d.pop > 0 ? (<><Droplets className="w-3 h-3" />{d.pop}%</>) : ""}
              </span>
              <span className="w-8 text-right text-sm text-white/60 tabular-nums">{d.temp_min}°</span>
              <div className="flex-1 h-1.5 rounded-full bg-white/15 relative overflow-hidden">
                <div
                  className="absolute h-full rounded-full"
                  style={{
                    left: `${leftPct}%`,
                    width: `${Math.max(widthPct, 8)}%`,
                    background: "linear-gradient(90deg, #38BDF8, #FFD54F, #FB8C00)",
                  }}
                />
              </div>
              <span className="w-8 text-right text-sm font-semibold text-white tabular-nums">{d.temp_max}°</span>
            </div>
          );
        })}
      </div>
    </section>
  );
};
