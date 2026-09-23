# Aura Pogoda PWA — Stacja Pogodowa

Przykładowa aplikacja typu **Progressive Web App (PWA)** stworzona w ramach pracy inżynierskiej pt. *„Projekt i implementacja przykładowej aplikacji typu Progressive Web App (PWA)”*.

> **Autor:** Damian Kolasa
> **Kierunek:** Informatyka
> **Rok:** 2026

Aplikacja pogodowa prezentuje pełen zestaw cech PWA: instalowalność, działanie offline (Service Worker + cache), plik manifestu oraz responsywny, nowoczesny interfejs.

## Główne funkcje

- 🌤️ **Aktualna pogoda** — temperatura, temperatura odczuwalna, wilgotność, ciśnienie, wiatr, widoczność, zachmurzenie, wschód/zachód słońca
- ⏱️ **Prognoza godzinowa** — najbliższe 24 h z interaktywnym wykresem (Recharts)
- 📅 **Prognoza na najbliższe dni** — zakres temperatur i szansa opadów
- 🔎 **Wyszukiwanie miast** — autouzupełnianie (geokodowanie)
- 📍 **Geolokalizacja** — pogoda dla bieżącej lokalizacji użytkownika
- ⭐ **Ulubione miasta** — zapisywane w bazie MongoDB
- 🎨 **Dynamiczne tło** — animowany canvas (deszcz, śnieg, gwiazdy, słońce) zależny od warunków
- 🔧 **Panel inżynierski** — symulator warunków pogodowych i trybu offline (przydatny podczas obrony pracy)

## Cechy PWA

| Cecha | Implementacja |
|-------|---------------|
| Manifest | `frontend/public/manifest.json` |
| Service Worker | `frontend/public/sw.js` (strategie: network-first dla API, cache-first dla zasobów) |
| Instalacja | obsługa zdarzenia `beforeinstallprompt` + własny baner |
| Tryb offline | cache API + `localStorage` (ostatnio pobrane dane) |
| Ikony | `frontend/public/icons/` (192×192, 512×512) |

## Stos technologiczny

- **Frontend:** React 19 + Vite + Tailwind CSS v4 + shadcn/ui + Recharts + lucide-react
- **Backend:** FastAPI (Python) — proxy do OpenWeatherMap (ukrywa klucz API) + REST dla ulubionych
- **Baza danych:** MongoDB (ulubione miasta)
- **Dane pogodowe:** [OpenWeatherMap API](https://openweathermap.org/api)

## Konfiguracja

### Backend (`backend/.env`)
```
MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_database"
OPENWEATHER_API_KEY="<twój_klucz_api>"
```
> Uwaga: nowo wygenerowany klucz OpenWeatherMap aktywuje się do ~2 godzin. Do tego czasu aplikacja automatycznie korzysta z realistycznych danych zastępczych (mock), a po aktywacji klucza — z danych na żywo.

### Frontend (`frontend/.env`)
```
REACT_APP_BACKEND_URL=<adres_backendu>
```

## Uruchomienie lokalne (VS Code)

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Frontend (w osobnym terminalu)
cd frontend
yarn install
yarn start
```

## Struktura projektu

```
backend/
  server.py            # API FastAPI (proxy pogodowe + ulubione)
  mock_weather.py      # dane zastępcze (fallback)
frontend/
  public/
    manifest.json      # manifest PWA
    sw.js              # Service Worker
    icons/             # ikony aplikacji
  src/
    App.js             # główny komponent
    components/        # komponenty UI (hero, prognozy, wyszukiwarka, panel)
    lib/               # klient API + funkcje pomocnicze
```

## Endpointy API

| Metoda | Ścieżka | Opis |
|--------|---------|------|
| GET | `/api/weather?city=` | Pogoda dla miasta |
| GET | `/api/weather/coords?lat=&lon=` | Pogoda dla współrzędnych |
| GET | `/api/cities/search?q=` | Wyszukiwanie miast |
| GET | `/api/favorites` | Lista ulubionych |
| POST | `/api/favorites` | Dodanie ulubionego |
| DELETE | `/api/favorites/{id}` | Usunięcie ulubionego |
