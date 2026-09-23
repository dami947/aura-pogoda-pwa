"""Realistyczne dane zastępcze (mock) - używane gdy klucz API OpenWeatherMap
jest nieaktywny lub brak połączenia. Aplikacja działa od razu do celów pracy inżynierskiej."""
import math
from datetime import datetime, timezone, timedelta

# Popularne polskie miasta z współrzędnymi i profilem pogodowym
CITIES = {
    "warszawa": {"name": "Warszawa", "country": "PL", "lat": 52.2297, "lon": 21.0122, "base": 18, "cond": "clouds"},
    "warsaw":   {"name": "Warszawa", "country": "PL", "lat": 52.2297, "lon": 21.0122, "base": 18, "cond": "clouds"},
    "kraków":   {"name": "Kraków", "country": "PL", "lat": 50.0647, "lon": 19.9450, "base": 19, "cond": "clear"},
    "krakow":   {"name": "Kraków", "country": "PL", "lat": 50.0647, "lon": 19.9450, "base": 19, "cond": "clear"},
    "gdańsk":   {"name": "Gdańsk", "country": "PL", "lat": 54.3520, "lon": 18.6466, "base": 15, "cond": "rain"},
    "gdansk":   {"name": "Gdańsk", "country": "PL", "lat": 54.3520, "lon": 18.6466, "base": 15, "cond": "rain"},
    "wrocław":  {"name": "Wrocław", "country": "PL", "lat": 51.1079, "lon": 17.0385, "base": 20, "cond": "clear"},
    "wroclaw":  {"name": "Wrocław", "country": "PL", "lat": 51.1079, "lon": 17.0385, "base": 20, "cond": "clear"},
    "poznań":   {"name": "Poznań", "country": "PL", "lat": 52.4064, "lon": 16.9252, "base": 18, "cond": "clouds"},
    "poznan":   {"name": "Poznań", "country": "PL", "lat": 52.4064, "lon": 16.9252, "base": 18, "cond": "clouds"},
    "łódź":     {"name": "Łódź", "country": "PL", "lat": 51.7592, "lon": 19.4560, "base": 17, "cond": "clouds"},
    "lodz":     {"name": "Łódź", "country": "PL", "lat": 51.7592, "lon": 19.4560, "base": 17, "cond": "clouds"},
    "szczecin": {"name": "Szczecin", "country": "PL", "lat": 53.4285, "lon": 14.5528, "base": 16, "cond": "rain"},
    "zakopane": {"name": "Zakopane", "country": "PL", "lat": 49.2992, "lon": 19.9496, "base": 9, "cond": "snow"},
    "katowice": {"name": "Katowice", "country": "PL", "lat": 50.2649, "lon": 19.0238, "base": 18, "cond": "clouds"},
}

COND = {
    "clear": {"icon": "01", "main": "Clear", "desc": "bezchmurnie", "pop": 0},
    "clouds": {"icon": "04", "main": "Clouds", "desc": "zachmurzenie duże", "pop": 10},
    "rain": {"icon": "10", "main": "Rain", "desc": "umiarkowany deszcz", "pop": 65},
    "snow": {"icon": "13", "main": "Snow", "desc": "opady śniegu", "pop": 55},
    "storm": {"icon": "11", "main": "Thunderstorm", "desc": "burza z piorunami", "pop": 80},
}

DESCS = {
    "01": "bezchmurnie", "02": "częściowe zachmurzenie", "03": "zachmurzenie umiarkowane",
    "04": "zachmurzenie duże", "09": "przelotne opady", "10": "umiarkowany deszcz",
    "11": "burza z piorunami", "13": "opady śniegu",
}


def _city_profile(name, lat=None, lon=None):
    key = (name or "").strip().lower()
    if key in CITIES:
        return CITIES[key]
    # miasto spoza listy - generujemy profil deterministycznie z nazwy
    seed = sum(ord(c) for c in key) if key else 42
    conds = ["clear", "clouds", "rain"]
    return {
        "name": name.title() if name else "Miasto",
        "country": "PL",
        "lat": lat if lat is not None else 52.0 + (seed % 30) / 10,
        "lon": lon if lon is not None else 19.0 + (seed % 40) / 10,
        "base": 12 + (seed % 12),
        "cond": conds[seed % 3],
    }


def _icon(code, hour):
    return f"{code}{'d' if 6 <= hour < 20 else 'n'}"


def generate_weather(name, lat=None, lon=None):
    p = _city_profile(name, lat, lon)
    now = datetime.now(timezone.utc)
    hour = now.hour
    base = p["base"]
    c = COND[p["cond"]]

    # temperatura zależna od pory dnia (fala sinusoidalna, maks ~15:00)
    def temp_at(h):
        return round(base + 5 * math.sin((h - 9) / 24 * 2 * math.pi))

    cur_temp = temp_at(hour)
    icon = _icon(c["icon"], hour)

    current = {
        "temp": cur_temp,
        "feels_like": cur_temp - 2,
        "temp_min": temp_at(4),
        "temp_max": temp_at(15),
        "humidity": 55 + (c["pop"] // 3),
        "pressure": 1013,
        "wind_speed": 3.5,
        "wind_deg": 220,
        "visibility": 10000 if p["cond"] == "clear" else 8000,
        "clouds": {"clear": 5, "clouds": 75, "rain": 90, "snow": 85, "storm": 95}[p["cond"]],
        "description": c["desc"],
        "weather_main": c["main"],
        "icon": icon,
        "dt": int(now.timestamp()),
        "sunrise": int((now.replace(hour=5, minute=30, second=0, microsecond=0)).timestamp()),
        "sunset": int((now.replace(hour=20, minute=15, second=0, microsecond=0)).timestamp()),
        "timezone": 7200,
    }

    hourly = []
    for i in range(8):
        t = now + timedelta(hours=i * 3)
        h = t.hour
        hourly.append({
            "dt": int(t.timestamp()),
            "temp": temp_at(h),
            "feels_like": temp_at(h) - 2,
            "pop": c["pop"] if i % 2 == 0 else max(0, c["pop"] - 20),
            "icon": _icon(c["icon"], h),
            "weather_main": c["main"],
            "description": c["desc"],
            "wind_speed": 3.5 + i * 0.2,
        })

    daily = []
    conds_cycle = [p["cond"], "clouds", "clear", "rain", "clouds", "clear"]
    for i in range(6):
        d = (now + timedelta(days=i)).date()
        dc = COND[conds_cycle[i % len(conds_cycle)]]
        daily.append({
            "dt": int(datetime(d.year, d.month, d.day, 12, tzinfo=timezone.utc).timestamp()),
            "date": d.isoformat(),
            "temp_min": base - 4 + i % 3,
            "temp_max": base + 6 - i % 4,
            "icon": f"{dc['icon']}d",
            "weather_main": dc["main"],
            "description": dc["desc"],
            "pop": dc["pop"],
            "humidity": 60,
            "wind_speed": 3.0 + i * 0.3,
        })

    return {
        "location": {"name": p["name"], "country": p["country"], "state": None, "lat": p["lat"], "lon": p["lon"]},
        "current": current,
        "hourly": hourly,
        "daily": daily,
        "fetched_at": now.isoformat(),
        "mock": True,
    }


def search(q):
    ql = q.strip().lower()
    seen = set()
    out = []
    for key, c in CITIES.items():
        if c["name"] in seen:
            continue
        if ql in key or ql in c["name"].lower():
            seen.add(c["name"])
            out.append({"name": c["name"], "raw_name": c["name"], "country": c["country"], "state": None, "lat": c["lat"], "lon": c["lon"]})
    if not out:
        p = _city_profile(q)
        out.append({"name": p["name"], "raw_name": p["name"], "country": p["country"], "state": None, "lat": p["lat"], "lon": p["lon"]})
    return out[:6]
