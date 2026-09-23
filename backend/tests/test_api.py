"""Backend API tests for Aura Pogoda PWA"""
import os
import pytest
import requests

BASE = os.environ.get("REACT_APP_BACKEND_URL", "https://storm-tracker-pwa.preview.emergentagent.com").rstrip("/")
API = f"{BASE}/api"


# ---------------- Weather endpoints ----------------
class TestWeather:
    def test_weather_by_city_warsaw(self):
        r = requests.get(f"{API}/weather", params={"city": "Warszawa"}, timeout=20)
        assert r.status_code == 200
        d = r.json()
        assert "location" in d and "current" in d and "hourly" in d and "daily" in d
        assert d["location"]["name"] == "Warszawa"
        assert len(d["hourly"]) == 8
        assert 1 <= len(d["daily"]) <= 6
        # mock flag expected since OWM key inactive
        assert d.get("mock") is True
        cur = d["current"]
        for k in ["temp", "feels_like", "humidity", "pressure", "wind_speed", "description", "icon", "dt"]:
            assert k in cur

    def test_weather_by_coords(self):
        r = requests.get(f"{API}/weather/coords", params={"lat": 52.23, "lon": 21.01}, timeout=20)
        assert r.status_code == 200
        d = r.json()
        assert d["location"]["lat"] == 52.23
        assert d["location"]["lon"] == 21.01
        assert len(d["hourly"]) == 8
        assert len(d["daily"]) >= 1

    def test_cities_search(self):
        r = requests.get(f"{API}/cities/search", params={"q": "Krak"}, timeout=20)
        assert r.status_code == 200
        arr = r.json()
        assert isinstance(arr, list) and len(arr) >= 1
        names = [c["name"] for c in arr]
        assert any("Kraków" in n or "Krak" in n for n in names)
        for c in arr:
            assert "lat" in c and "lon" in c


# ---------------- Favorites CRUD ----------------
class TestFavorites:
    payload = {"name": "TEST_Wrocław", "country": "PL", "lat": 51.1079, "lon": 17.0385}

    def test_full_favorite_flow(self):
        # Cleanup any existing
        existing = requests.get(f"{API}/favorites", timeout=10).json()
        for f in existing:
            if f.get("lat") == self.payload["lat"] and f.get("lon") == self.payload["lon"]:
                requests.delete(f"{API}/favorites/{f['id']}", timeout=10)

        # Create
        r = requests.post(f"{API}/favorites", json=self.payload, timeout=10)
        assert r.status_code == 200
        fav = r.json()
        assert fav["name"] == self.payload["name"]
        assert "id" in fav
        fav_id = fav["id"]

        # List
        r = requests.get(f"{API}/favorites", timeout=10)
        assert r.status_code == 200
        assert any(f["id"] == fav_id for f in r.json())

        # Duplicate returns same (no new entry)
        r2 = requests.post(f"{API}/favorites", json=self.payload, timeout=10)
        assert r2.status_code == 200
        assert r2.json()["id"] == fav_id
        listed = requests.get(f"{API}/favorites", timeout=10).json()
        count = sum(1 for f in listed if f["lat"] == self.payload["lat"] and f["lon"] == self.payload["lon"])
        assert count == 1

        # Delete
        r = requests.delete(f"{API}/favorites/{fav_id}", timeout=10)
        assert r.status_code == 200
        assert r.json().get("success") is True

        # Verify deleted
        listed = requests.get(f"{API}/favorites", timeout=10).json()
        assert not any(f["id"] == fav_id for f in listed)

        # Delete non-existent -> 404
        r = requests.delete(f"{API}/favorites/{fav_id}", timeout=10)
        assert r.status_code == 404


# ---------------- PWA assets ----------------
class TestPWA:
    def test_manifest(self):
        r = requests.get(f"{BASE}/manifest.json", timeout=10)
        assert r.status_code == 200

    def test_service_worker(self):
        r = requests.get(f"{BASE}/sw.js", timeout=10)
        assert r.status_code == 200
