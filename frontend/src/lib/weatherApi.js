import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const CACHE_PREFIX = "aura_weather_";

export function cacheWeather(key, data) {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ data, ts: Date.now() }));
  } catch (e) {}
}

export function getCachedWeather(key) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw).data;
  } catch (e) {
    return null;
  }
}

export async function fetchWeatherByCity(city) {
  const res = await axios.get(`${API}/weather`, { params: { city } });
  cacheWeather(`city_${city.toLowerCase()}`, res.data);
  cacheWeather("last", res.data);
  return res.data;
}

export async function fetchWeatherByCoords(lat, lon) {
  const res = await axios.get(`${API}/weather/coords`, { params: { lat, lon } });
  cacheWeather("last", res.data);
  return res.data;
}

export async function searchCities(q) {
  const res = await axios.get(`${API}/cities/search`, { params: { q } });
  return res.data;
}

export async function getFavorites() {
  const res = await axios.get(`${API}/favorites`);
  return res.data;
}

export async function addFavorite(fav) {
  const res = await axios.post(`${API}/favorites`, fav);
  return res.data;
}

export async function deleteFavorite(id) {
  const res = await axios.delete(`${API}/favorites/${id}`);
  return res.data;
}
