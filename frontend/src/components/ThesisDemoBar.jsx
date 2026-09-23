import { FlaskConical, Sun, CloudRain, CloudLightning, CloudSnow, Moon, WifiOff, Wifi } from "lucide-react";

const SIMS = [
  { key: "clear_day", label: "Słonecznie", icon: Sun },
  { key: "clouds", label: "Pochmurno", icon: CloudSnow },
  { key: "rain", label: "Deszcz", icon: CloudRain },
  { key: "storm", label: "Burza", icon: CloudLightning },
  { key: "snow", label: "Śnieg", icon: CloudSnow },
  { key: "clear_night", label: "Noc", icon: Moon },
];

// Panel Inżynierski - symulator warunków pogodowych i trybu offline (do obrony pracy)
export const ThesisDemoBar = ({ activeSim, onSim, simOffline, onToggleOffline }) => {
  return (
    <div
      className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 max-w-[95vw]"
      data-testid="thesis-demo-bar"
    >
      <div className="flex items-center gap-1.5 rounded-full backdrop-blur-2xl bg-black/40 border border-white/15 px-2.5 py-2 shadow-2xl overflow-x-auto">
        <span className="flex items-center gap-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-white/70 shrink-0">
          <FlaskConical className="w-3.5 h-3.5" /> Panel inżynierski
        </span>
        {SIMS.map((s) => {
          const Icon = s.icon;
          const active = activeSim === s.key;
          return (
            <button
              key={s.key}
              onClick={() => onSim(active ? null : s.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors active:scale-95 ${
                active ? "bg-white text-slate-900" : "bg-white/10 text-white/80 hover:bg-white/20"
              }`}
              data-testid={`sim-${s.key}`}
              title={`Symuluj: ${s.label}`}
            >
              <Icon className="w-3.5 h-3.5" /> {s.label}
            </button>
          );
        })}
        <div className="w-px h-6 bg-white/15 mx-1 shrink-0" />
        <button
          onClick={onToggleOffline}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors active:scale-95 ${
            simOffline ? "bg-red-500/90 text-white" : "bg-white/10 text-white/80 hover:bg-white/20"
          }`}
          data-testid="sim-offline-toggle"
        >
          {simOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
          {simOffline ? "Offline" : "Online"}
        </button>
      </div>
    </div>
  );
};
