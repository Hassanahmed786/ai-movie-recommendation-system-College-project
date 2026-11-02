# AI-Powered Movie Recommendation System Using Machine Learning

A full-stack web application that recommends movies using **content-based filtering**: every film is converted into a weighted text profile (genres ×2, overview, cast, director), vectorized with **TF-IDF** (`ngram_range=(1,2)`, `sublinear_tf=True`), and matched to the most similar films via **cosine similarity**. The Flask REST API serves the catalog, search, and recommendations; the React + Tailwind frontend provides browsing, live search, genre filters, star ratings (persisted in `localStorage`), and a cinematic dark UI.

**Tech (plain-text badges):** `React 18` `Vite 5` `Tailwind CSS 3` `react-router-dom 6` `Axios` · `Python 3.10+` `Flask 3` `flask-cors` `pandas 2` `numpy 1.26` `scikit-learn 1.5` `pytest`

> **Dataset note:** `backend/data/movies.csv` contains 1,050 real movie records: 50 hand-curated records with original overviews plus 1,000 popular MovieLens records. MovieLens imports provide verified titles and genres; overview, cast, and director are intentionally blank when the source does not provide them.

---

## 1. Features

What is actually implemented and tested:

- **Browse** the full 1,050-movie catalog from the Flask API, rendered as procedurally generated CSS/SVG poster art (deterministic per title + genre, no external images).
- **Live search** (300 ms debounce) via `GET /api/movies?q=…` over title, genres, overview, cast, and director.
- **Genre filter chips** (13 genres) that combine with the active search query via `?genre=`.
- **Movie details page** with genres, overview, cast, director, a blurred poster-colored backdrop, and a **"Because you viewed this"** recommendation carousel (top 6) with **Match % badges** — a TF-IDF cosine text-similarity score, explicitly documented *not* to be a probability or predicted rating. Clicking a recommendation navigates to that movie and refreshes its recommendations.
- **Star rating widget** (1–5, hover preview, keyboard accessible). Submitting calls `POST /api/ratings` for server-side validation; on success the rating is saved to `localStorage` under the key `movieRatings` as `{movieId: rating}` and a toast is shown. `localStorage` failures are caught.
- **My Ratings page**: lists all ratings with poster art, re-rate via stars, Remove button, and an empty state.
- **Resilient UI**: loading skeletons, "No movies found" empty state, error state with Retry, and an API-offline banner that appears when `/api/health` fails and disappears when the backend returns.
- **Accessible & responsive**: 360 px → 1440 px+, semantic landmarks, `aria-label`s on stars/controls, visible focus rings, `prefers-reduced-motion` support.
- **Backend**: 20 pytest tests covering every endpoint and error path (bad JSON, bool-as-int, out-of-range ratings, unknown ids, non-integer limit, CORS headers).

## 2. Project Status

### Completed

- [x] Flask REST API (`/api/health`, `/api/movies`, `/api/movies/<id>`, `/api/recommend/<id>`, `/api/ratings`) with JSON error handlers and CORS restricted to the Vite dev origins
- [x] `MovieRecommender` (pandas + scikit-learn TF-IDF + cosine similarity) with text-profile weighting
- [x] 1,050-movie catalog: 50 curated records plus 1,000 cleaned MovieLens records
- [x] React 18 + Vite + Tailwind frontend with all routes, ratings persistence, offline banner, skeletons, toasts
- [x] Backend test suite (20 tests, all passing)
- [x] Responsive, accessible, cinematic dark UI with generated poster art

### Pending / Future Work

- [ ] PostgreSQL/MySQL persistence for ratings (currently browser `localStorage` only)
- [ ] User authentication (so ratings sync across devices)
- [ ] User-specific preference vectors built from rating history
- [ ] Hybrid / collaborative filtering (user–user, item–item) blended with content-based scores
- [ ] Model evaluation metrics (precision@k, recall@k, MAP) with a train/holdout split
- [ ] Optional metadata enrichment from a licensed/API source (for imported rows)
- [ ] Deployment (WSGI server + static hosting + reverse proxy)
- [ ] Frontend unit tests (Vitest + React Testing Library)
- [ ] Docker Compose for one-command setup

## 3. Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend UI | React 18 + Vite 5 | SPA, fast dev server, production bundling |
| Styling | Tailwind CSS 3 (+ PostCSS, Autoprefixer) | Utility-first styling, custom theme & keyframes |
| Routing | react-router-dom 6 | Client-side routes (home, details, my ratings, 404) |
| HTTP client | Axios | API calls with 10 s timeout and normalized errors |
| Backend | Flask 3 + flask-cors | REST API, CORS restricted to Vite origins |
| Data wrangling | pandas 2 + numpy | CSV loading, validation, search filtering |
| ML | scikit-learn 1.5 | `TfidfVectorizer` + `cosine_similarity` |
| Testing | pytest | Flask test-client API tests |

## 4. Architecture

```
┌────────────┐   JSON    ┌────────────────────────────────────────────────────┐
│  Browser   │ ────────► │  Flask (127.0.0.1:5000, CORS: localhost:5173)      │
│ React 18 + │  Axios    │                                                    │
│ Vite :5173 │ ◄──────── │  /api/* ──► MovieRecommender                       │
└────────────   JSON    │                    │                               │
                         │                    ▼                               │
                         │  pandas reads movies.csv (validates columns)       │
                         │                    │                               │
                         │                    ▼                               │
                         │  text profiles: genres×2 + overview + cast/director│
                         │                    │                               │
                         │                    ▼                               │
                         │  TfidfVectorizer(stop=english, 1–2 grams,          │
                         │                 sublinear_tf) ──► matrix           │
                         │                    │                               │
                         │                    ▼                               │
                         │  cosine_similarity ──► top-N (rounded to 2 dp)     │
                         │                    │                               │
                         │                    ▼                               │
                         │  JSON response (plain Python types only)           │
                         └────────────────────────────────────────────────────┘
```

## 5. Recommendation Algorithm

1. **Load** `movies.csv` with pandas; validate the six required columns; fill `NaN` with `""`.
2. **Build a text profile** per movie:
   - genres: `|` → space, string repeated **twice** (genre match is weighted twice);
   - overview as-is;
   - cast & director: `|` → space, and spaces inside multi-word names removed, so "Matt Damon" becomes the single token `MattDamon` (prevents first/last names matching as separate words).
3. **Vectorize** all 1,050 profiles once at startup with `TfidfVectorizer(stop_words="english", ngram_range=(1, 2), sublinear_tf=True)`. Bigrams capture adjacent-word context; sublinear TF dampens repeated terms.
4. **Score** `cosine_similarity(profile_i, all_profiles)`, zero out the movie itself, sort descending (ties broken by id), take top N (default 5, clamped 1–20).
5. **Return** plain Python types (no numpy scalars) with `similarity` rounded to 2 decimals.

**Limitation:** this is *movie-to-movie* similarity. User ratings do **not** influence the model; the same user always receives the same "similar movies" for a given film. The Match % badge is a text-similarity score, not a probability or a predicted rating.

## 6. Folder Structure

```
movie-recommendation-system/
├── backend/
│   ├── app.py                  # Flask app: endpoints, CORS, JSON error handlers
│   ├── recommender.py          # MovieRecommender: pandas + TF-IDF + cosine similarity
│   ├── requirements.txt        # Pinned Python dependencies
│   ├── data/
│   │   └── movies.csv          # 1,050-movie dataset (id,title,genres,overview,cast,director)
│   └── tests/
│       └── test_api.py         # 20 pytest tests (verification aid, uses Flask test client)
├── frontend/
│   ├── index.html              # Vite entry, Google Fonts (Sora + Inter), favicon
│   ├── package.json            # React 18 / Vite 5 / Tailwind 3 / axios / react-router 6
│   ├── vite.config.js          # Vite + @vitejs/plugin-react, dev server on :5173
│   ├── tailwind.config.js      # Theme: palette, fonts, glow shadows, keyframes
│   ├── postcss.config.js       # Tailwind + Autoprefixer (required by Tailwind v3)
│   └── src/
│       ├── main.jsx            # React root + BrowserRouter
│       ├── App.jsx             # All routes & components (navbar, home, details, my ratings, 404, toasts, posters)
│       ├── api.js              # Axios instance + typed API helpers with friendly errors
│       └── index.css           # Tailwind directives, glass/grain/gradient/skeleton utilities
├── .gitignore                  # .venv, __pycache__, node_modules, dist, .env
└── README.md
```

## 7. Requirements

- **Python 3.10+** (tested on 3.11)
- **Current Node.js LTS** (18+; tested on 22) with npm
- **VS Code** (or any editor) with two integrated terminals

## 8. Setup & Run

Open two terminals in `movie-recommendation-system/`.

### Terminal 1 — Backend

**Windows PowerShell (primary):**

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

> If PowerShell blocks the activation script: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`, then re-run `.venv\Scripts\Activate.ps1`.

**Windows CMD (fallback):**

```bat
cd backend
python -m venv .venv
.venv\Scripts\activate.bat
pip install -r requirements.txt
python app.py
```

**macOS / Linux:**

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

The API runs at `http://127.0.0.1:5000` (set `FLASK_DEBUG=1` to enable the debug reloader).

### Terminal 2 — Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**.

## 9. Verify the API

With the backend running (Windows-safe quoting: use double quotes around URLs with `?`/`&`):

```bash
curl http://127.0.0.1:5000/api/health
curl http://127.0.0.1:5000/api/movies
curl "http://127.0.0.1:5000/api/movies?q=space"
curl "http://127.0.0.1:5000/api/movies?genre=Sci-Fi"
curl http://127.0.0.1:5000/api/movies/1
curl http://127.0.0.1:5000/api/movies/9999          # 404
curl "http://127.0.0.1:5000/api/recommend/1?limit=5"
curl "http://127.0.0.1:5000/api/recommend/1?limit=abc"   # 400
curl http://127.0.0.1:5000/api/recommend/9999       # 404
curl -X POST http://127.0.0.1:5000/api/ratings -H "Content-Type: application/json" -d "{\"movie_id\": 1, \"rating\": 5}"
```

Actual observed responses from a live run (this README was written from real output):

| Request | Status | Response (truncated) |
|---|---|---|
| `GET /api/health` | 200 | `{"status":"ok"}` |
| `GET /api/movies` | 200 | list of 1,050 movies |
| `GET /api/movies?q=space` | 200 | `[Interstellar]` |
| `GET /api/movies?genre=Sci-Fi` | 200 | 12 movies, all containing `Sci-Fi` |
| `GET /api/movies/1` | 200 | Interstellar object |
| `GET /api/movies/9999` | 404 | `{"error":"Movie with id 9999 not found"}` |
| `GET /api/recommend/1?limit=5` | 200 | see example below |
| `GET /api/recommend/1?limit=abc` | 400 | `{"error":"'limit' must be an integer"}` |
| `GET /api/recommend/9999` | 404 | `{"error":"Movie with id 9999 not found"}` |
| `POST /api/ratings` `{"movie_id":1,"rating":5}` | 200 | `{"message":"Rating validated","movie_id":1,"rating":5,"persisted":false}` |
| `POST /api/ratings` `{"movie_id":1,"rating":6}` | 400 | `{"error":"'rating' must be between 1 and 5"}` |
| `POST /api/ratings` `not json` | 400 | `{"error":"Request body must be a JSON object"}` |
| `POST /api/ratings` `{"movie_id":1,"rating":true}` | 400 | `{"error":"'rating' must be an integer"}` |
| `POST /api/ratings` `{"movie_id":1}` | 400 | `{"error":"Both 'movie_id' and 'rating' are required"}` |
| CORS `Origin: http://localhost:5173` | 200 | header `Access-Control-Allow-Origin: http://localhost:5173` |

Example `GET /api/recommend/1?limit=5` (real output):

```json
{
  "movie": { "id": 1, "title": "Interstellar" },
  "recommendations": [
    { "id": 14, "title": "Arrival",           "similarity": 0.16, "genres": ["Sci-Fi", "Drama"] },
    { "id": 16, "title": "Her",               "similarity": 0.09, "genres": ["Romance", "Sci-Fi"] },
    { "id": 9,  "title": "Jurassic Park",     "similarity": 0.08, "genres": ["Adventure", "Sci-Fi"] },
    { "id": 2,  "title": "The Martian",       "similarity": 0.08, "genres": ["Sci-Fi", "Adventure"] },
    { "id": 5,  "title": "The Matrix",        "similarity": 0.08, "genres": ["Action", "Sci-Fi"] }
  ]
}
```

(Each real response item also includes `overview`, `cast`, and `director` fields.)

## 10. API Reference

| Method | Endpoint | Params | Success | Errors |
|---|---|---|---|---|
| GET | `/api/health` | – | `{"status":"ok"}` | – |
| GET | `/api/movies` | `q` (search), `genre` (filter) | `[{id,title,genres[],overview,cast[],director}]` | – |
| GET | `/api/movies/<id>` | – | single movie object | 404 unknown id |
| GET | `/api/recommend/<id>` | `limit` (default 5, clamped 1–20) | `{movie:{id,title}, recommendations:[…+similarity]}` | 400 non-integer limit · 404 unknown id |
| POST | `/api/ratings` | JSON `{movie_id:int, rating:int 1–5}` | `{"message":"Rating validated","movie_id":…,"rating":…,"persisted":false}` | 400 bad JSON / wrong types / bool / out of range / unknown movie |

## 11. Dataset Format

`backend/data/movies.csv` — header `id,title,genres,overview,cast,director`:

- `id`: unique integer starting at 1 (ids 1 and 2 are Interstellar and The Martian).
- `genres`, `cast`: pipe-separated (`|`), comma-free.
- `overview`: quoted if it contains commas. Curated records include original overviews; MovieLens imports may be blank because that source provides titles and genres only.
- `cast` and `director`: pipe-separated when available; blank for MovieLens imports.
- All rows have the six required columns, unique IDs, and deduplicated titles.

The catalog combines the original 50 curated records with 1,000 records selected from the MovieLens `ml-latest-small` dataset by rating-count popularity. MovieLens is provided by GroupLens for research use; see the dataset's included README and [MovieLens](https://grouplens.org/datasets/movielens/) for terms and attribution. The imported rows were cleaned, filtered to records with genres, deduplicated against the curated titles, and assigned stable IDs beginning after the curated records.

To swap in another dataset: keep the same six columns and pipe delimiters, replace `movies.csv`, restart the backend — nothing else changes. If your source uses comma-separated lists, convert them to `|` first.

## 12. Configuration

- **`VITE_API_BASE_URL`** (frontend, optional): create `frontend/.env` with `VITE_API_BASE_URL=http://127.0.0.1:5000/api` to point the UI at a different API host/port. Defaults to `http://127.0.0.1:5000/api`.
- **CORS origins** (backend): `ALLOWED_ORIGINS` in `app.py` — only `http://localhost:5173` and `http://127.0.0.1:5173` are allowed, applied to `/api/*`. Add your own origin there if you change the dev port.
- **Port change**: edit `app.run(host=..., port=...)` at the bottom of `app.py` and the matching `VITE_API_BASE_URL` + `ALLOWED_ORIGINS`.
- **Debug mode**: `FLASK_DEBUG=1` env var enables the Flask debugger (off by default).

## 13. Testing

```bash
# Backend (with the venv active)
cd backend
python -m pytest tests/ -q
# → 20 passed

# Frontend production build check
cd frontend
npm run build
```

### Manual UI test pass (no headless browser was available in the build environment)

The backend was verified end-to-end over HTTP (every endpoint, CORS, error paths) and the frontend production build compiles with zero warnings; the browser-side pass below should be repeated manually once:

1. Open `http://localhost:5173` — grid loads 1,050 posters (skeletons first).
2. Type "space" in the search bar (waits 300 ms) — grid filters to Interstellar.
3. Click a genre chip (e.g. Animation) — filters; combine with a search term.
4. Open a movie — details, cast, and "Because you viewed this" row with Match % badges appear.
5. Click a recommendation — navigates to that movie; recommendations refresh.
6. Rate 4 stars — toast appears; reload the page — rating persists.
7. Visit My Ratings — the movie is listed with stars; use Remove — toast, list updates, empty state shows when the last rating is removed.
8. Navigate to `/nope` — styled 404 page.
9. Stop the Flask server — amber offline banner appears within ~8 s; restart Flask — banner disappears.

## 14. Troubleshooting

- **`python` / `npm` not found** — install Python 3.10+ and Node LTS; on Windows make sure "Add to PATH" was checked; reopen the terminal after installing.
- **Port 5000 busy** — stop the other process (`lsof -i :5000` / `netstat -ano | findstr :5000`) or change the port in `app.py` + `VITE_API_BASE_URL`.
- **CORS error in the browser console** — you opened the frontend from a non-5173 origin (e.g. `npm run preview` on 4173). Use `npm run dev`, or add your origin to `ALLOWED_ORIGINS` in `app.py`.
- **API connection error / offline banner** — the Flask backend isn't running: start it in terminal 1 (`python app.py`) and wait for `Running on http://127.0.0.1:5000`.
- **No recommendations for a movie** — impossible for a known id (every movie has ≥1 other film to compare against); if you see 404, the id doesn't exist in the CSV.
- **CSV load error on startup** — the header must be exactly `id,title,genres,overview,cast,director`; re-export with all six columns and re-run the pandas check in §11's notes (unique ids, no empty fields).
- **PowerShell script blocked** (`Activate.ps1 cannot be loaded…`) — run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` or use the CMD fallback in §8.

## 15. Limitations

- **Metadata coverage** — the 1,000 MovieLens imports primarily contain title and genre metadata, so their similarity profiles are less rich than the 50 curated records.
- **No authentication** — anyone on the machine can POST ratings.
- **Ratings live only in the browser** (`localStorage` key `movieRatings`); clearing site data clears them. Nothing is stored server-side (`"persisted": false`).
- **No server database** — the CSV is read once at startup; edits require a restart.
- **Similarity ≠ probability** — Match % is a text-similarity score, not a predicted rating or chance of enjoying the film.

## 16. Assumptions

1. **Poster art is generated** (CSS gradients + typography derived from genre hue + title hash) instead of real poster images, to stay offline-friendly and copyright-safe.
2. **Search is substring-based** (case-insensitive) across the five text fields. Imported MovieLens rows are primarily searchable by title and genre because their source record does not include plot, cast, or director metadata.
3. **Ratings are validated but intentionally not persisted** server-side (spec requirement); localStorage is the source of truth.
4. **Sandbox note:** in the automated build sandbox, Python packages were installed to the system interpreter (PEP 668 / missing `ensurepip` blocks `venv` bootstrapping there); the documented `python -m venv` flow is unchanged and is the supported path on normal machines.
5. **Recommendation ties** (equal cosine scores) are broken by ascending movie id for stable output.
6. All overviews were **written from scratch** (1–2 sentences) rather than copied from official synopses.

## 17. Optional Dev Tools

- **pytest** (included in `requirements.txt`) for the API test suite.
- Optional: any VS Code extensions (Python, ESLint, Prettier) for development comfort.

## 18. Academic Project Information

- **Title:** AI-Powered Movie Recommendation System Using Machine Learning
- **Institution:** Anurag University, Department of Data Science
- **Team No.:** 11
- **Team Members:**
  - A. Girish Reddy (23EG110B02)
  - J. Janveer (23EG110B19)
  - Hassan Ahmed (23EG110B53)
- **Guide:** A. Ravi, Associate Professor, Department of Data Science
