# Wdrożenie aplikacji Aura Pogoda PWA (Vercel + Render + MongoDB Atlas)

Aplikacja składa się z trzech części, które hostujemy osobno:

| Część | Technologia | Hosting (darmowy) |
|-------|-------------|-------------------|
| Frontend | React + Vite (PWA) | **Vercel** |
| Backend | FastAPI (Python) | **Render** |
| Baza danych | MongoDB | **MongoDB Atlas** |

Kolejność: najpierw **baza (Atlas)** → potem **backend (Render)** → na końcu **frontend (Vercel)**.

---

## 1. Baza danych — MongoDB Atlas (darmowy klaster M0)

1. Załóż konto na https://www.mongodb.com/cloud/atlas → utwórz darmowy klaster **M0**.
2. **Database Access** → dodaj użytkownika (login + hasło).
3. **Network Access** → dodaj `0.0.0.0/0` (dostęp z każdego IP — wymagane, by Render mógł się połączyć).
4. **Connect → Drivers** → skopiuj *connection string*, np.:
   ```
   mongodb+srv://uzytkownik:HASLO@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   To będzie zmienna `MONGO_URL`.

---

## 2. Backend — Render

1. Wejdź na https://render.com → **New → Web Service** → połącz swoje repozytorium GitHub.
2. Ustawienia (jeśli nie użyjesz pliku `render.yaml`):
   - **Root Directory:** `backend`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements-deploy.txt`
   - **Start Command:** `uvicorn server:app --host 0.0.0.0 --port $PORT`
3. **Environment Variables** (zakładka Environment):
   | Klucz | Wartość |
   |-------|---------|
   | `MONGO_URL` | *(connection string z Atlas)* |
   | `DB_NAME` | `aura_pogoda` |
   | `CORS_ORIGINS` | `*` (później możesz wpisać dokładny adres z Vercel) |
   | `OPENWEATHER_API_KEY` | `58a5a7b75510c5d9cf6f24f33b39b531` |
4. **Create Web Service** → poczekaj na deploy.
5. Zapamiętaj publiczny adres backendu, np. `https://aura-pogoda-api.onrender.com`.
6. Test: otwórz `https://aura-pogoda-api.onrender.com/api/` — powinno zwrócić JSON `{"message": "Aura Pogoda PWA API", ...}`.

> Uwaga: darmowy plan Render „usypia" usługę po ~15 min bezczynności — pierwsze wejście po przerwie ładuje się ok. 30–60 s. To normalne dla darmowego tieru.

---

## 3. Frontend — Vercel

1. Wejdź na https://vercel.com → **Add New → Project** → zaimportuj to repozytorium.
2. Ustawienia projektu:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Other (plik `vercel.json` ustawia resztę: build `yarn build`, output `build`)
3. **Environment Variables**:
   | Klucz | Wartość |
   |-------|---------|
   | `REACT_APP_BACKEND_URL` | *(adres backendu z Render, np. `https://aura-pogoda-api.onrender.com`)* |
   > ⚠️ Ta zmienna jest wczytywana podczas builda (Vite wstawia ją do kodu). Jeśli zmienisz adres backendu, wykonaj **Redeploy** na Vercel.
4. **Deploy** → po chwili dostaniesz publiczny adres, np. `https://aura-pogoda.vercel.app`.

---

## 4. Domknięcie (zalecane) — CORS

Gdy znasz już adres z Vercel, wróć do Render → zmień `CORS_ORIGINS` z `*` na dokładny adres frontendu:
```
CORS_ORIGINS=https://aura-pogoda.vercel.app
```
i wykonaj redeploy backendu. To zawęża dostęp do API tylko do Twojej aplikacji.

---

## Częste problemy

| Objaw | Przyczyna / rozwiązanie |
|-------|--------------------------|
| Frontend pokazuje dane, ale nie łączy się z API | Zła `REACT_APP_BACKEND_URL` na Vercel — sprawdź adres i zrób redeploy |
| Błąd CORS w konsoli przeglądarki | Ustaw `CORS_ORIGINS` na Render na adres z Vercel (lub `*`) |
| Ulubione miasta się nie zapisują | Zły `MONGO_URL` lub brak `0.0.0.0/0` w Network Access w Atlas |
| Backend zwraca dane „mock" | Klucz `OPENWEATHER_API_KEY` nieustawiony/nieaktywny — sprawdź zmienną na Render |
| Build na Vercel nie przechodzi na `@emergentbase/*` | Usuń z `frontend/package.json` dwie zależności `@emergentbase/overlay` i `@emergentbase/visual-edits` oraz odwołania do nich w `frontend/vite.config.mjs` (są to narzędzia deweloperskie, niepotrzebne w produkcji) |

---

## Alternatywne hostingi
- **Frontend:** Netlify, Cloudflare Pages, GitHub Pages (tylko statyczny frontend — backend i tak musi być osobno)
- **Backend:** Railway, Fly.io, Heroku, własny VPS
Zasada jest zawsze ta sama: backend dostaje `MONGO_URL` + `OPENWEATHER_API_KEY` + `CORS_ORIGINS`, a frontend `REACT_APP_BACKEND_URL` wskazujący na adres backendu.
