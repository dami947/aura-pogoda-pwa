import { useState, useEffect, useCallback } from "react";
import { toast, Toaster } from "sonner";
import {
  CloudSun, Star, StarOff, RefreshCw, WifiOff, Loader2, MapPin, Wind, AlertTriangle,
} from "lucide-react";
import { WeatherCanvasBackground } from "@/components/WeatherCanvasBackground";
import { CitySearch } from "@/components/CitySearch";
import { HourlyForecastStrip } from "@/components/HourlyForecastStrip";
import { WeeklyForecastCard } from "@/components/WeeklyForecastCard";
import { WeatherMetricsBento } from "@/components/WeatherMetricsBento";
import { ThesisDemoBar } from "@/components/ThesisDemoBar";
import { PwaInstallBanner } from "@/components/PwaInstallBanner";
import {
  fetchWeatherByCity, fetchWeatherByCoords, getCachedWeather,
  getFavorites, addFavorite, deleteFavorite,
} from "@/lib/weatherApi";
import { getWeatherIcon, getTheme, getConditionTheme } from "@/lib/weatherHelpers";

const SIM_LABELS = {
  clear_day: { desc: "słonecznie", main: "Clear", icon: "01d" },
  clear_night: { desc: "bezchmurna noc", main: "Clear", icon: "01n" },
  clouds: { desc: "pochmurno", main: "Clouds", icon: "04d" },
  rain: { desc: "deszcz", main: "Rain", icon: "10d" },
  storm: { desc: "burza z piorunami", main: "Thunderstorm", icon: "11d" },
  snow: { desc: "opady śniegu", main: "Snow", icon: "13d" },
};

export default function App() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [online, setOnline] = useState(navigator.onLine);
  const [simCondition, setSimCondition] = useState(null);
  const [simOffline, setSimOffline] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [fromCache, setFromCache] = useState(false);

  const isOffline = !online || simOffline;

  // Rejestracja Service Workera
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    const onl = () => { setOnline(true); toast.success("Połączenie przywrócone"); };
    const off = () => { setOnline(false); toast.error("Brak połączenia — tryb offline"); };
    window.addEventListener("online", onl);
    window.addEventListener("offline", off);

    const bip = (e) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener("beforeinstallprompt", bip);
    window.addEventListener("appinstalled", () => { setInstallPrompt(null); toast.success("Zainstalowano aplikację PWA!"); });

    return () => {
      window.removeEventListener("online", onl);
      window.removeEventListener("offline", off);
      window.removeEventListener("beforeinstallprompt", bip);
    };
  }, []);

  const loadFavorites = useCallback(async () => {
    try {
      const favs = await getFavorites();
      setFavorites(favs);
    } catch (e) {}
  }, []);

  const loadCity = useCallback(async (city) => {
    setLoading(true);
    setError(null);
    setFromCache(false);
    try {
      const data = await fetchWeatherByCity(city);
      setWeather(data);
    } catch (e) {
      const cached = getCachedWeather(`city_${city.toLowerCase()}`) || getCachedWeather("last");
      if (cached) {
        setWeather(cached);
        setFromCache(true);
        toast.info("Wyświetlono dane z pamięci podręcznej (offline)");
      } else {
        setError(e.response?.data?.detail || "Nie udało się pobrać pogody");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Inicjalne ładowanie
  useEffect(() => {
    loadFavorites();
    const last = getCachedWeather("last");
    if (last) { setWeather(last); setLoading(false); }
    loadCity(last?.location?.name || "Warszawa");
  }, []);

  const handleSelectCity = (c) => {
    loadCity(c.raw_name || c.name);
  };

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      toast.error("Geolokalizacja niedostępna w tej przeglądarce");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const data = await fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
          setWeather(data);
          setError(null);
          setFromCache(false);
          toast.success(`Pogoda dla: ${data.location.name}`);
        } catch (e) {
          toast.error("Nie udało się pobrać pogody dla lokalizacji");
        } finally {
          setGeoLoading(false);
        }
      },
      () => {
        toast.error("Nie udało się ustalić lokalizacji");
        setGeoLoading(false);
      }
    );
  };

  const isFavorite = weather && favorites.some(
    (f) => Math.abs(f.lat - weather.location.lat) < 0.01 && Math.abs(f.lon - weather.location.lon) < 0.01
  );

  const toggleFavorite = async () => {
    if (!weather) return;
    if (isFavorite) {
      const fav = favorites.find((f) => Math.abs(f.lat - weather.location.lat) < 0.01 && Math.abs(f.lon - weather.location.lon) < 0.01);
      await deleteFavorite(fav.id);
      toast.info("Usunięto z ulubionych");
    } else {
      await addFavorite({
        name: weather.location.name,
        country: weather.location.country,
        state: weather.location.state,
        lat: weather.location.lat,
        lon: weather.location.lon,
      });
      toast.success("Zapisano miasto w ulubionych");
    }
    loadFavorites();
  };

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setInstallPrompt(null);
  };

  // Zastosuj symulację warunków (Panel inżynierski)
  const displayCurrent = weather ? { ...weather.current } : null;
  if (displayCurrent && simCondition) {
    const s = SIM_LABELS[simCondition];
    displayCurrent.icon = s.icon;
    displayCurrent.weather_main = s.main;
    displayCurrent.description = s.desc;
  }

  const theme = displayCurrent
    ? getTheme(displayCurrent.icon, displayCurrent.weather_main)
    : getTheme("01d", "Clear");
  const particle = getConditionTheme(
    displayCurrent?.icon || "01d",
    displayCurrent?.weather_main || "Clear"
  );
  const particleType = { clear_day: "sun", clear_night: "stars", clouds: "clouds", rain: "rain", storm: "storm", snow: "snow", fog: "fog" }[particle] || "sun";

  const HeroIcon = displayCurrent ? getWeatherIcon(displayCurrent.icon) : CloudSun;

  return (
    <div
      className="min-h-screen w-full relative transition-[background] duration-700"
      style={{ background: theme.gradient }}
      data-testid="app-root"
    >
      <WeatherCanvasBackground particle={particleType} accent={theme.accent} />
      <Toaster position="top-center" theme="dark" richColors />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-28">
        {/* Header */}
        <header className="sticky top-3 z-40 rounded-2xl backdrop-blur-2xl bg-black/25 border border-white/15 px-4 py-3 flex items-center gap-3 shadow-2xl mb-6">
          <div className="flex items-center gap-2 shrink-0">
            <div className="p-1.5 rounded-xl bg-sky-500/25">
              <CloudSun className="w-5 h-5 text-white" />
            </div>
            <span className="hidden sm:block font-semibold text-white tracking-tight">Aura Pogoda</span>
          </div>
          <CitySearch onSelect={handleSelectCity} onGeolocate={handleGeolocate} geoLoading={geoLoading} />
          {isOffline && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/25 border border-red-400/30 text-[11px] text-red-100 shrink-0" data-testid="offline-badge">
              <WifiOff className="w-3 h-3" /> Offline
            </span>
          )}
        </header>

        {/* Ulubione */}
        {favorites.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-3 mb-4" data-testid="favorites-list">
            {favorites.map((f) => (
              <button
                key={f.id}
                onClick={() => loadCity(f.name)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-sm text-white whitespace-nowrap hover:bg-white/20 transition-colors active:scale-95"
                data-testid={`favorite-chip-${f.id}`}
              >
                <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" /> {f.name}
              </button>
            ))}
          </div>
        )}

        {loading && !weather && (
          <div className="flex flex-col items-center justify-center py-32 text-white" data-testid="loading-state">
            <Loader2 className="w-10 h-10 animate-spin mb-3" />
            <p className="text-sm text-white/70">Ładowanie danych pogodowych...</p>
          </div>
        )}

        {error && !weather && (
          <div className="flex flex-col items-center justify-center py-32 text-white text-center" data-testid="error-state">
            <AlertTriangle className="w-10 h-10 mb-3 text-amber-300" />
            <p className="text-lg font-medium">{error}</p>
            <button onClick={() => loadCity("Warszawa")} className="mt-4 px-5 py-2 rounded-full bg-white/15 hover:bg-white/25 text-sm transition-colors">
              Spróbuj ponownie
            </button>
          </div>
        )}

        {weather && (
          <div className="space-y-5" data-testid="weather-content">
            {fromCache && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500/15 border border-amber-400/25 text-amber-100 text-xs" data-testid="cache-notice">
                <WifiOff className="w-4 h-4" /> Dane z pamięci podręcznej (tryb offline)
              </div>
            )}

            {/* Hero */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <section
                className="lg:col-span-5 rounded-3xl backdrop-blur-2xl bg-white/10 border border-white/20 p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.15)] relative overflow-hidden"
                data-testid="current-weather-hero"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-1.5 text-white/80 mb-1">
                      <MapPin className="w-4 h-4" />
                      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white" data-testid="city-name">
                        {weather.location.name}
                      </h1>
                    </div>
                    <p className="text-xs text-white/60">{weather.location.country}</p>
                  </div>
                  <button
                    onClick={toggleFavorite}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors active:scale-95"
                    data-testid="favorite-toggle-btn"
                    title={isFavorite ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
                  >
                    {isFavorite ? <Star className="w-5 h-5 text-amber-300 fill-amber-300" /> : <StarOff className="w-5 h-5 text-white/70" />}
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <HeroIcon className="w-20 h-20 text-white shrink-0" strokeWidth={1.2} data-testid="hero-weather-icon" />
                  <div>
                    <div className="text-6xl sm:text-7xl font-extralight tracking-tighter tabular-nums text-white drop-shadow-sm" data-testid="hero-temp">
                      {displayCurrent.temp}°
                    </div>
                    <p className="text-lg font-medium capitalize text-white/90" data-testid="hero-description">
                      {displayCurrent.description}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-4 text-sm text-white/75">
                  <span>Odczuwalna {displayCurrent.feels_like}°</span>
                  <span className="flex items-center gap-1"><Wind className="w-4 h-4" /> {Math.round(displayCurrent.wind_speed * 3.6)} km/h</span>
                </div>
              </section>

              <div className="lg:col-span-7">
                <WeatherMetricsBento current={displayCurrent} />
              </div>
            </div>

            <HourlyForecastStrip hourly={weather.hourly} />
            <WeeklyForecastCard daily={weather.daily} />

            <footer className="flex items-center justify-center gap-2 pt-4 text-xs text-white/50" data-testid="footer">
              <RefreshCw className="w-3 h-3" />
              Praca inżynierska — aplikacja PWA · dane: OpenWeatherMap
            </footer>
          </div>
        )}
      </div>

      <PwaInstallBanner
        prompt={installPrompt}
        onInstall={handleInstall}
        onDismiss={() => setInstallPrompt(null)}
      />

      <ThesisDemoBar
        activeSim={simCondition}
        onSim={setSimCondition}
        simOffline={simOffline}
        onToggleOffline={() => {
          setSimOffline((v) => {
            const nv = !v;
            toast[nv ? "error" : "success"](nv ? "Symulacja: tryb offline" : "Symulacja: powrót online");
            return nv;
          });
        }}
      />
    </div>
  );
}
