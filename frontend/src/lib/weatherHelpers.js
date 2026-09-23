import {
  Sun, Moon, Cloud, CloudSun, CloudMoon, Cloudy, CloudRain, CloudDrizzle,
  CloudLightning, CloudSnow, CloudFog,
} from "lucide-react";

// Mapa kodów ikon OpenWeatherMap -> ikony lucide-react
const ICON_MAP = {
  "01d": Sun, "01n": Moon,
  "02d": CloudSun, "02n": CloudMoon,
  "03d": Cloud, "03n": Cloud,
  "04d": Cloudy, "04n": Cloudy,
  "09d": CloudDrizzle, "09n": CloudDrizzle,
  "10d": CloudRain, "10n": CloudRain,
  "11d": CloudLightning, "11n": CloudLightning,
  "13d": CloudSnow, "13n": CloudSnow,
  "50d": CloudFog, "50n": CloudFog,
};

export function getWeatherIcon(iconCode) {
  return ICON_MAP[iconCode] || Cloud;
}

// Zwraca klucz motywu (tła) na podstawie warunków i pory dnia
export function getConditionTheme(iconCode = "", weatherMain = "") {
  const isNight = iconCode.endsWith("n");
  const m = weatherMain.toLowerCase();
  if (m.includes("thunder")) return "storm";
  if (m.includes("rain") || m.includes("drizzle")) return "rain";
  if (m.includes("snow")) return "snow";
  if (m.includes("cloud")) return isNight ? "clear_night" : "clouds";
  if (m.includes("mist") || m.includes("fog") || m.includes("haze") || m.includes("smoke")) return "fog";
  return isNight ? "clear_night" : "clear_day";
}

export const THEMES = {
  clear_day: {
    gradient: "linear-gradient(135deg, #1565C0 0%, #1E88E5 40%, #64B5F6 100%)",
    accent: "#FFC107",
    particle: "sun",
  },
  clear_night: {
    gradient: "linear-gradient(135deg, #060B1E 0%, #131A38 50%, #232C54 100%)",
    accent: "#818CF8",
    particle: "stars",
  },
  clouds: {
    gradient: "linear-gradient(135deg, #45596B 0%, #607D8B 45%, #90A4AE 100%)",
    accent: "#ECEFF1",
    particle: "clouds",
  },
  rain: {
    gradient: "linear-gradient(135deg, #16222E 0%, #26343F 45%, #3A4C5C 100%)",
    accent: "#38BDF8",
    particle: "rain",
  },
  storm: {
    gradient: "linear-gradient(135deg, #0C1116 0%, #1C2731 45%, #2E3D49 100%)",
    accent: "#7C3AED",
    particle: "storm",
  },
  snow: {
    gradient: "linear-gradient(135deg, #37474F 0%, #607D8B 40%, #B0BEC5 100%)",
    accent: "#E0F2FE",
    particle: "snow",
  },
  fog: {
    gradient: "linear-gradient(135deg, #37414A 0%, #55606B 50%, #7A848E 100%)",
    accent: "#CFD8DC",
    particle: "fog",
  },
};

export function getTheme(iconCode, weatherMain) {
  return THEMES[getConditionTheme(iconCode, weatherMain)] || THEMES.clear_day;
}

const DAYS_PL = ["Niedziela", "Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota"];
const DAYS_PL_SHORT = ["Ndz", "Pon", "Wt", "Śr", "Czw", "Pt", "Sob"];

export function dayName(dt, short = false) {
  const d = new Date(dt * 1000);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  if (isToday) return short ? "Dziś" : "Dzisiaj";
  return short ? DAYS_PL_SHORT[d.getDay()] : DAYS_PL[d.getDay()];
}

export function formatHour(dt) {
  const d = new Date(dt * 1000);
  return `${String(d.getHours()).padStart(2, "0")}:00`;
}

export function formatTime(unix, timezoneOffset = 0) {
  const d = new Date((unix + timezoneOffset) * 1000);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

export function windDirection(deg) {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8];
}
