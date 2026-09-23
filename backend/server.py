from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone, date
from collections import defaultdict
import requests
import mock_weather

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

OWM_KEY = os.environ.get('OPENWEATHER_API_KEY', '')
OWM_BASE = "https://api.openweathermap.org"

app = FastAPI(title="Aura Pogoda PWA API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ---------------- Models ----------------
class Favorite(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    country: Optional[str] = None
    state: Optional[str] = None
    lat: float
    lon: float
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class FavoriteCreate(BaseModel):
    name: str
    country: Optional[str] = None
    state: Optional[str] = None
    lat: float
    lon: float


# ---------------- OpenWeather helpers ----------------
def _owm_get(path: str, params: dict):
    if not OWM_KEY:
        raise HTTPException(status_code=503, detail="Brak klucza API OpenWeatherMap")
    params = {**params, "appid": OWM_KEY}
    try:
        r = requests.get(f"{OWM_BASE}{path}", params=params, timeout=12)
    except requests.RequestException as e:
        raise HTTPException(status_code=502, detail=f"Błąd połączenia z serwisem pogodowym: {e}")
    if r.status_code == 401:
        raise HTTPException(status_code=401, detail="Nieprawidłowy klucz API OpenWeatherMap")
    if r.status_code == 404:
        raise HTTPException(status_code=404, detail="Nie znaleziono lokalizacji")
    if r.status_code != 200:
        raise HTTPException(status_code=502, detail=f"Serwis pogodowy zwrócił błąd ({r.status_code})")
    return r.json()


def geocode(q: str, limit: int = 5):
    return _owm_get("/geo/1.0/direct", {"q": q, "limit": limit})


def reverse_geocode(lat: float, lon: float):
    data = _owm_get("/geo/1.0/reverse", {"lat": lat, "lon": lon, "limit": 1})
    return data[0] if data else None


def build_daily(forecast_list):
    groups = defaultdict(list)
    for item in forecast_list:
        d = datetime.fromtimestamp(item["dt"], tz=timezone.utc).date().isoformat()
        groups[d].append(item)
    daily = []
    for d in sorted(groups.keys()):
        items = groups[d]
        temps = [i["main"]["temp"] for i in items]
        # pick the entry closest to 12:00 for the representative icon/description
        rep = min(items, key=lambda i: abs(datetime.fromtimestamp(i["dt"], tz=timezone.utc).hour - 12))
        pops = [i.get("pop", 0) for i in items]
        daily.append({
            "dt": items[0]["dt"],
            "date": d,
            "temp_min": round(min(temps)),
            "temp_max": round(max(temps)),
            "icon": rep["weather"][0]["icon"],
            "weather_main": rep["weather"][0]["main"],
            "description": rep["weather"][0]["description"],
            "pop": round(max(pops) * 100),
            "humidity": rep["main"]["humidity"],
            "wind_speed": rep["wind"]["speed"],
        })
    return daily


def assemble_weather(lat: float, lon: float, name: str, country: str = None, state: str = None):
    cur = _owm_get("/data/2.5/weather", {"lat": lat, "lon": lon, "units": "metric", "lang": "pl"})
    fc = _owm_get("/data/2.5/forecast", {"lat": lat, "lon": lon, "units": "metric", "lang": "pl"})

    w = cur["weather"][0]
    sys = cur.get("sys", {})
    current = {
        "temp": round(cur["main"]["temp"]),
        "feels_like": round(cur["main"]["feels_like"]),
        "temp_min": round(cur["main"]["temp_min"]),
        "temp_max": round(cur["main"]["temp_max"]),
        "humidity": cur["main"]["humidity"],
        "pressure": cur["main"]["pressure"],
        "wind_speed": cur["wind"]["speed"],
        "wind_deg": cur["wind"].get("deg", 0),
        "visibility": cur.get("visibility", 0),
        "clouds": cur.get("clouds", {}).get("all", 0),
        "description": w["description"],
        "weather_main": w["main"],
        "icon": w["icon"],
        "dt": cur["dt"],
        "sunrise": sys.get("sunrise"),
        "sunset": sys.get("sunset"),
        "timezone": cur.get("timezone", 0),
    }

    hourly = []
    for item in fc["list"][:8]:
        hourly.append({
            "dt": item["dt"],
            "temp": round(item["main"]["temp"]),
            "feels_like": round(item["main"]["feels_like"]),
            "pop": round(item.get("pop", 0) * 100),
            "icon": item["weather"][0]["icon"],
            "weather_main": item["weather"][0]["main"],
            "description": item["weather"][0]["description"],
            "wind_speed": item["wind"]["speed"],
        })

    daily = build_daily(fc["list"])

    return {
        "location": {
            "name": name or cur.get("name"),
            "country": country or sys.get("country"),
            "state": state,
            "lat": lat,
            "lon": lon,
        },
        "current": current,
        "hourly": hourly,
        "daily": daily,
        "fetched_at": datetime.now(timezone.utc).isoformat(),
    }


# ---------------- Routes ----------------
@api_router.get("/")
async def root():
    return {"message": "Aura Pogoda PWA API", "has_key": bool(OWM_KEY)}


# Kody statusu, przy których przełączamy się na dane zastępcze (mock)
FALLBACK_CODES = {401, 403, 429, 502, 503}


@api_router.get("/cities/search")
async def cities_search(q: str = Query(..., min_length=1)):
    try:
        results = geocode(q, limit=6)
    except HTTPException as e:
        if e.status_code in FALLBACK_CODES:
            return mock_weather.search(q)
        raise
    return [
        {
            "name": c.get("local_names", {}).get("pl", c["name"]) if c.get("local_names") else c["name"],
            "raw_name": c["name"],
            "country": c.get("country"),
            "state": c.get("state"),
            "lat": c["lat"],
            "lon": c["lon"],
        }
        for c in results
    ]


@api_router.get("/weather")
async def weather_by_city(city: str = Query(...)):
    try:
        results = geocode(city, limit=1)
        if not results:
            raise HTTPException(status_code=404, detail="Nie znaleziono miasta")
        c = results[0]
        name = c.get("local_names", {}).get("pl", c["name"]) if c.get("local_names") else c["name"]
        return assemble_weather(c["lat"], c["lon"], name, c.get("country"), c.get("state"))
    except HTTPException as e:
        if e.status_code in FALLBACK_CODES:
            return mock_weather.generate_weather(city)
        raise


@api_router.get("/weather/coords")
async def weather_by_coords(lat: float = Query(...), lon: float = Query(...)):
    try:
        rev = reverse_geocode(lat, lon)
        if rev:
            name = rev.get("local_names", {}).get("pl", rev["name"]) if rev.get("local_names") else rev["name"]
            return assemble_weather(lat, lon, name, rev.get("country"), rev.get("state"))
        return assemble_weather(lat, lon, "Twoja lokalizacja")
    except HTTPException as e:
        if e.status_code in FALLBACK_CODES:
            return mock_weather.generate_weather("Twoja lokalizacja", lat, lon)
        raise


@api_router.get("/favorites", response_model=List[Favorite])
async def get_favorites():
    docs = await db.favorites.find({}, {"_id": 0}).sort("created_at", 1).to_list(100)
    return docs


@api_router.post("/favorites", response_model=Favorite)
async def add_favorite(fav: FavoriteCreate):
    existing = await db.favorites.find_one(
        {"lat": fav.lat, "lon": fav.lon}, {"_id": 0}
    )
    if existing:
        return existing
    obj = Favorite(**fav.model_dump())
    await db.favorites.insert_one(obj.model_dump())
    return obj


@api_router.delete("/favorites/{fav_id}")
async def delete_favorite(fav_id: str):
    res = await db.favorites.delete_one({"id": fav_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Nie znaleziono ulubionego miasta")
    return {"success": True}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
