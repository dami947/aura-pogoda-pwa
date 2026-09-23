import { getWeatherIcon, formatHour } from "@/lib/weatherHelpers";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Droplets } from "lucide-react";

export const HourlyForecastStrip = ({ hourly = [] }) => {
  if (!hourly.length) return null;

  const chartData = hourly.map((h) => ({
    hour: formatHour(h.dt),
    temp: h.temp,
    pop: h.pop,
  }));

  return (
    <section
      className="rounded-3xl backdrop-blur-2xl bg-white/10 border border-white/20 p-5 sm:p-6 shadow-xl"
      data-testid="hourly-forecast-section"
    >
      <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70 mb-4">
        Prognoza godzinowa
      </h2>

      <div className="h-28 -mx-2 mb-2 min-h-[112px]">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <AreaChart data={chartData} margin={{ top: 8, right: 12, left: 12, bottom: 0 }}>
            <defs>
              <linearGradient id="tempFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFD54F" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#FFD54F" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="hour" tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }} axisLine={false} tickLine={false} interval={1} />
            <YAxis hide domain={["dataMin - 2", "dataMax + 2"]} />
            <Tooltip
              contentStyle={{ background: "rgba(15,20,40,0.9)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, color: "#fff" }}
              formatter={(v) => [`${v}°C`, "Temperatura"]}
              labelStyle={{ color: "rgba(255,255,255,0.7)" }}
            />
            <Area type="monotone" dataKey="temp" stroke="#FFD54F" strokeWidth={2.5} fill="url(#tempFill)" dot={{ r: 3, fill: "#FFD54F" }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin" data-testid="hourly-scroll">
        {hourly.map((h, i) => {
          const Icon = getWeatherIcon(h.icon);
          return (
            <div
              key={i}
              className="flex flex-col items-center gap-2 min-w-[68px] rounded-2xl bg-white/5 border border-white/10 px-3 py-3 transition-colors hover:bg-white/15"
              data-testid={`hourly-item-${i}`}
            >
              <span className="text-xs font-medium text-white/75">{formatHour(h.dt)}</span>
              <Icon className="w-6 h-6 text-white" strokeWidth={1.6} />
              <span className="text-base font-semibold text-white tabular-nums">{h.temp}°</span>
              {h.pop > 0 && (
                <span className="flex items-center gap-0.5 text-[11px] text-sky-200">
                  <Droplets className="w-3 h-3" /> {h.pop}%
                </span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
