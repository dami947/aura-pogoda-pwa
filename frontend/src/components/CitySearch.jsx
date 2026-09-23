import { useState, useEffect, useRef } from "react";
import { Search, MapPin, Loader2, X } from "lucide-react";
import { searchCities } from "@/lib/weatherApi";

export const CitySearch = ({ onSelect, onGeolocate, geoLoading }) => {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const data = await searchCities(q.trim());
        setResults(data);
        setOpen(true);
      } catch (e) {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(timerRef.current);
  }, [q]);

  const pick = (c) => {
    onSelect(c);
    setQ("");
    setResults([]);
    setOpen(false);
  };

  return (
    <div className="relative flex-1 max-w-md" ref={boxRef}>
      <div className="flex items-center gap-2 rounded-full bg-white/12 border border-white/20 backdrop-blur-md px-4 py-2.5 focus-within:border-white/45 transition-colors">
        <Search className="w-4 h-4 text-white/70 shrink-0" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          placeholder="Szukaj miasta..."
          className="bg-transparent outline-none text-sm text-white placeholder:text-white/50 w-full"
          data-testid="city-search-input"
        />
        {loading && <Loader2 className="w-4 h-4 text-white/70 animate-spin" />}
        {q && !loading && (
          <button onClick={() => setQ("")} data-testid="search-clear-btn">
            <X className="w-4 h-4 text-white/60 hover:text-white" />
          </button>
        )}
        <button
          onClick={onGeolocate}
          className="shrink-0 p-1.5 rounded-full hover:bg-white/15 transition-colors active:scale-95"
          title="Użyj mojej lokalizacji"
          data-testid="geolocate-btn"
        >
          {geoLoading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <MapPin className="w-4 h-4 text-white" />}
        </button>
      </div>

      {open && results.length > 0 && (
        <div
          className="absolute top-full mt-2 w-full rounded-2xl backdrop-blur-2xl bg-slate-900/85 border border-white/15 shadow-2xl overflow-hidden z-50"
          data-testid="search-results"
        >
          {results.map((c, i) => (
            <button
              key={i}
              onClick={() => pick(c)}
              className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-white/10 transition-colors border-b border-white/5 last:border-0"
              data-testid={`search-result-${i}`}
            >
              <MapPin className="w-4 h-4 text-white/50 shrink-0" />
              <span className="text-sm text-white">{c.name}</span>
              <span className="text-xs text-white/50 ml-auto">
                {c.state ? `${c.state}, ` : ""}{c.country}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
