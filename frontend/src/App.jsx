import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';
import {
  getHealth,
  getMovie,
  getMovies,
  getRecommendations,
  postRating,
} from './api.js';

const RATINGS_KEY = 'movieRatings';

/* ------------------------------------------------------------------ icons */

function IconSearch({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function IconStar({ className = 'w-5 h-5', filled = true }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5L2.6 9.4l6.5-.9L12 2.6z" />
    </svg>
  );
}

function IconClapper({ className = 'w-6 h-6' }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="clap-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7c5cff" />
          <stop offset="0.5" stopColor="#ff4d8d" />
          <stop offset="1" stopColor="#ffb84d" />
        </linearGradient>
      </defs>
      <rect x="3" y="10" width="26" height="17" rx="4" fill="url(#clap-g)" />
      <path d="M4 10l2.4-5.4 22.4 2.4-1.2 3L4 10z" fill="url(#clap-g)" />
      <path d="M9.5 5.5l3 5.5M15.5 6.3l3 5.5M21.5 7.1l3 5.4" stroke="#0a0a12" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="11" cy="19" r="3.2" fill="#0a0a12" opacity="0.85" />
      <circle cx="21" cy="19" r="3.2" fill="#0a0a12" opacity="0.85" />
    </svg>
  );
}

function IconTrash({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
    </svg>
  );
}

function IconBack({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5M11 18l-6-6 6-6" />
    </svg>
  );
}

function IconFilm({ className = 'w-10 h-10' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d="M8 4v16M16 4v16M3 9h5M3 15h5M16 9h5M16 15h5" />
    </svg>
  );
}

function IconInfo({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 7.5v.5" />
    </svg>
  );
}

function IconSparkles({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="m12 3 1.4 5.6L19 10l-5.6 1.4L12 17l-1.4-5.6L5 10l5.6-1.4L12 3Z" />
      <path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z" />
    </svg>
  );
}

/* --------------------------------------------------------------- contexts */

const ToastCtx = createContext(null);
const RatingsCtx = createContext(null);
const OnlineCtx = createContext(null);

const useToasts = () => useContext(ToastCtx);
const useRatings = () => useContext(RatingsCtx);
const useOnline = () => useContext(OnlineCtx);

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const push = useCallback((message, type = 'success') => {
    idRef.current += 1;
    const id = idRef.current;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3400);
  }, []);

  const host = (
    <div className="fixed bottom-5 right-5 z-[80] flex flex-col gap-2 items-end" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`animate-toast-in glass rounded-xl px-4 py-3 text-sm font-medium shadow-card max-w-xs ${
            t.type === 'error' ? 'text-rose-300' : 'text-mist'
          }`}
        >
          <span className="flex items-center gap-2">
            {t.type === 'error' ? (
              <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" aria-hidden="true" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" aria-hidden="true" />
            )}
            {t.message}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      {host}
    </ToastCtx.Provider>
  );
}

function RatingsProvider({ children }) {
  const { push } = useToasts();
  const [ratings, setRatings] = useState({});
  const [ready, setReady] = useState(false);
  const ref = useRef({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RATINGS_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      ref.current = typeof parsed === 'object' && parsed ? parsed : {};
    } catch {
      ref.current = {};
    }
    setRatings(ref.current);
    setReady(true);
  }, []);

  useEffect(() => {
    ref.current = ratings;
  }, [ratings]);

  const persist = useCallback(
    (next) => {
      try {
        localStorage.setItem(RATINGS_KEY, JSON.stringify(next));
      } catch {
        push('Could not save to this browser storage', 'error');
      }
      setRatings(next);
    },
    [push]
  );

  const rate = useCallback(
    async (movieId, value) => {
      const res = await postRating(movieId, value);
      persist({ ...ref.current, [movieId]: value });
      return res;
    },
    [persist]
  );

  const remove = useCallback(
    (movieId) => {
      const next = { ...ref.current };
      delete next[movieId];
      persist(next);
    },
    [persist]
  );

  return (
    <RatingsCtx.Provider value={{ ratings, ready, rate, remove, count: Object.keys(ratings).length }}>
      {children}
    </RatingsCtx.Provider>
  );
}

function OnlineProvider({ children }) {
  const [online, setOnline] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    const check = async () => {
      const ok = await getHealth();
      if (alive) {
        setOnline(ok);
        setReady(true);
      }
    };
    check();
    const timer = setInterval(check, 8000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  return <OnlineCtx.Provider value={{ online, ready }}>{children}</OnlineCtx.Provider>;
}

function OfflineBanner() {
  const { online, ready } = useOnline();
  if (ready && online) return null;
  return (
    <div
      className="bg-amber-500/15 border-b border-amber-400/30 text-amber-200 text-sm"
      role="status"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" aria-hidden="true" />
        Recommendation server offline. Start the Flask backend (python app.py) to enable
        search and matches — the banner disappears automatically.
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- posters */

const GENRE_HUES = {
  'Sci-Fi': 232,
  Drama: 262,
  Action: 16,
  Thriller: 288,
  Comedy: 42,
  Romance: 336,
  Animation: 192,
  Crime: 212,
  Fantasy: 268,
  Horror: 352,
  Adventure: 152,
  Mystery: 254,
  Biography: 206,
};

function hashStr(s) {
  let h = 7;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function posterArt(movie) {
  const genre = movie.genres?.[0] || 'Drama';
  const base = GENRE_HUES[genre] ?? 260;
  const h = hashStr(movie.title);
  const angle = 118 + (h % 84);
  const h1 = (base + (h % 16) - 8 + 360) % 360;
  const h2 = (base + 30 + (Math.floor(h / 7) % 22)) % 360;
  const bg = `linear-gradient(${angle}deg, hsl(${h1} 64% 52%) 0%, hsl(${(h1 + h2) / 2} 58% 32%) 52%, hsl(${h2} 48% 13%) 100%)`;
  return { bg, hue: Math.round((h1 + h2) / 2) };
}

function Poster({ movie, className = '', letterClass = 'text-[6.5rem]' }) {
  const art = useMemo(() => posterArt(movie), [movie]);
  const initial = (movie.title || '?').trim().charAt(0).toUpperCase();
  return (
    <div
      className={`relative overflow-hidden poster-gloss ${className}`}
      style={{ background: art.bg }}
      aria-hidden="true"
    >
      <span
        className={`absolute -top-6 -right-2 font-display font-extrabold text-white/[0.16] leading-none select-none ${letterClass}`}
      >
        {initial}
      </span>
      <div className="absolute inset-x-0 top-0 p-3 pl-24 text-right">
        <span className="text-[10px] font-semibold tracking-[0.18em] uppercase text-white/70">
          {(movie.genres || [])[0] || 'Film'}
        </span>
      </div>
      <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/70 via-black/25 to-transparent pt-10">
        <p className="font-display font-bold leading-[1.15] text-white text-[15px] line-clamp-3">
          {movie.title}
        </p>
        {movie.director && (
          <p className="text-[11px] text-white/60 mt-1 truncate">{movie.director}</p>
        )}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- widgets */

function StarRating({ value, onChange, size = 'md', label = 'Rate this movie', busy = false }) {
  const [hover, setHover] = useState(0);
  const active = hover || value;
  const starCls =
    size === 'lg' ? 'w-9 h-9' : size === 'sm' ? 'w-3.5 h-3.5' : 'w-6 h-6';
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label={label}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={value === i}
          aria-label={`${label}: ${i} star${i > 1 ? 's' : ''}`}
          disabled={busy}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onFocus={() => setHover(i)}
          onBlur={() => setHover(0)}
          onClick={() => onChange && onChange(i)}
          className="p-0.5 rounded transition-transform hover:scale-110 disabled:opacity-60"
        >
          <IconStar
            className={`${starCls} ${i <= active ? 'text-star' : 'text-white/25'} ${
              i === value && !hover ? 'animate-pop' : ''
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function SmallStars({ value }) {
  return (
    <span className="flex items-center" aria-label={`Rated ${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <IconStar
          key={i}
          className={`w-3.5 h-3.5 ${i <= value ? 'text-star' : 'text-white/25'}`}
        />
      ))}
    </span>
  );
}

function SkeletonCard() {
  return <div className="skeleton aspect-[2/3] rounded-2xl" aria-hidden="true" />;
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="glass rounded-2xl p-10 text-center max-w-md mx-auto">
      <div className="w-12 h-12 mx-auto rounded-full bg-rose-500/15 text-rose-300 flex items-center justify-center text-xl font-bold">
        !
      </div>
      <p className="mt-4 text-mist font-medium">Something went wrong</p>
      <p className="mt-1 text-sm text-muted break-words">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 rounded-xl bg-gradient-to-r from-accent-violet to-accent-magenta px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition"
        >
          Retry
        </button>
      )}
    </div>
  );
}

function EmptyState({ title, hint, action }) {
  return (
    <div className="text-center py-20">
      <IconFilm className="w-12 h-12 mx-auto text-white/20" />
      <p className="mt-4 font-display text-xl text-mist">{title}</p>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
      {action}
    </div>
  );
}

/* ------------------------------------------------------------- movie card */

function MovieCard({ movie, index = 0 }) {
  const { ratings } = useRatings();
  const rated = ratings[movie.id];
  const imported = movie.id > 50;
  return (
    <Link
      to={`/movie/${movie.id}`}
      className="group block animate-fade-up rounded-2xl"
      style={{ animationDelay: `${Math.min(index * 45, 420)}ms` }}
      aria-label={`View details for ${movie.title}`}
    >
      <div className="movie-card relative rounded-2xl overflow-hidden border border-white/10 shadow-card transition-all duration-500 group-hover:-translate-y-2 group-hover:scale-[1.035] group-hover:shadow-glow group-hover:border-accent-violet/40">
        <Poster movie={movie} className="aspect-[2/3]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-300" />
        <div className="absolute inset-x-0 bottom-0 p-3 translate-y-5 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 transition-all duration-300">
          <p className="text-[11px] text-white/75 truncate">
            {(movie.genres || []).join(' · ')}
          </p>
          <p className="mt-1 text-xs font-semibold text-accent-amber flex items-center gap-1">
            View details
            <span aria-hidden="true" className="translate-x-0 group-hover:translate-x-0.5 transition-transform">
              →
            </span>
          </p>
        </div>
        <span className="absolute left-2 top-2 rounded-full bg-ink/70 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-white/75 backdrop-blur border border-white/10">
          {imported ? 'MovieLens' : 'Curated'}
        </span>
        {rated && (
          <div className="absolute top-2 right-2 rounded-full bg-ink/75 backdrop-blur px-2 py-1 border border-white/10">
            <SmallStars value={rated} />
          </div>
        )}
      </div>
    </Link>
  );
}

/* ----------------------------------------------------------------- navbar */

const navLinkCls = ({ isActive }) =>
  `relative px-1 py-1 text-sm font-medium transition-colors ${
    isActive ? 'text-mist' : 'text-muted hover:text-mist'
  } after:absolute after:left-0 after:-bottom-[3px] after:h-[2px] after:w-full after:rounded-full after:bg-gradient-to-r after:from-accent-violet after:via-accent-magenta after:to-accent-amber after:transition-transform after:duration-300 after:origin-left ${
    isActive ? 'after:scale-x-100' : 'after:scale-x-0 hover:after:scale-x-100'
  }`;

function Navbar() {
  const { count } = useRatings();
  return (
    <header className="sticky top-0 z-50">
      <nav className="glass nav-shell border-x-0 border-t-0" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5" aria-label="Reelwise home">
            <IconClapper className="w-7 h-7" />
            <span className="font-display font-extrabold text-lg tracking-tight">
              Reel<span className="text-gradient">wise</span>
            </span>
          </Link>
          <div className="flex items-center gap-5 sm:gap-7">
            <NavLink to="/" end className={navLinkCls}>
              Home
            </NavLink>
            <NavLink to="/my-ratings" className={navLinkCls}>
              <span className="flex items-center gap-2">
                My Ratings
                {count > 0 && (
                  <span className="min-w-[20px] h-5 px-1 rounded-full bg-gradient-to-r from-accent-violet to-accent-magenta text-white text-[11px] font-bold flex items-center justify-center">
                    {count}
                  </span>
                )}
              </span>
            </NavLink>
          </div>
        </div>
      </nav>
      <OfflineBanner />
    </header>
  );
}

/* ------------------------------------------------------------------- home */

function Home() {
  const [catalog, setCatalog] = useState([]);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('');

  const genres = useMemo(
    () => [...new Set(catalog.flatMap((m) => m.genres))].sort(),
    [catalog]
  );

  useEffect(() => {
    let alive = true;
    getMovies()
      .then((data) => alive && setCatalog(data))
      .catch(() => alive && setCatalog([]));
    return () => {
      alive = false;
    };
  }, []);

  // 300ms debounce for live search
  useEffect(() => {
    const t = setTimeout(() => setQuery(input.trim()), 300);
    return () => clearTimeout(t);
  }, [input]);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getMovies({ q: query, genre })
      .then((data) => {
        setMovies(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [query, genre]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6">
      {/* Hero */}
      <section className="relative hero-section pt-14 sm:pt-20 pb-10">
        <div aria-hidden="true" className="absolute -top-10 left-1/4 w-80 h-80 rounded-full bg-accent-violet/25 blur-3xl animate-float-slow" />
        <div aria-hidden="true" className="absolute top-10 right-1/4 w-72 h-72 rounded-full bg-accent-magenta/20 blur-3xl animate-float-slow" style={{ animationDelay: '-4s' }} />
        <div className="relative hero-panel text-center max-w-3xl mx-auto">
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-accent-amber">
            Content-based recommendations
          </p>
          <h1 className="mt-4 font-display font-extrabold tracking-tight text-mist" style={{ fontSize: 'clamp(2.4rem, 6vw, 4.3rem)', lineHeight: 1.04 }}>
            Find your next
            <br />
            <span className="text-gradient">favourite movie</span>
          </h1>
          <p className="mt-5 text-muted text-base sm:text-lg">
            TF-IDF text profiles and cosine similarity match every film to the
            ones most like it — instantly.
          </p>
          <div className="mt-7 grid grid-cols-3 gap-2 sm:gap-3 max-w-xl mx-auto">
            {[
              ['1,050+', 'real films'],
              [genres.length || 13, 'genres'],
              ['20', 'match results'],
            ].map(([value, label]) => (
              <div key={label} className="stat-tile rounded-2xl px-3 py-3 text-left">
                <p className="font-display font-bold text-lg sm:text-xl text-mist">{value}</p>
                <p className="mt-0.5 text-[10px] sm:text-xs uppercase tracking-[0.12em] text-muted">{label}</p>
              </div>
            ))}
          </div>

          {/* Search bar */}
          <div className="mt-8 glass search-shell rounded-2xl flex items-center gap-3 px-5 py-2 transition-all focus-within:border-accent-violet/60 focus-within:shadow-glow">
            <IconSearch className="w-5 h-5 text-muted shrink-0" />
            <input
              type="search"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Search titles, genres, cast, directors…"
              aria-label="Search movies"
              className="bg-transparent flex-1 py-3 text-mist placeholder:text-muted outline-none text-base"
            />
            {input && (
              <button
                type="button"
                onClick={() => setInput('')}
                aria-label="Clear search"
                className="text-muted hover:text-mist text-sm font-medium px-2 py-1"
              >
                Clear
              </button>
            )}
          </div>

          {/* Stat strip */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted flex-wrap">
            <span className="glass rounded-full px-3 py-1">
              {catalog.length || 1050}+ movies
            </span>
            <span className="text-white/20" aria-hidden="true">•</span>
            <span className="glass rounded-full px-3 py-1">TF-IDF powered</span>
            <span className="text-white/20" aria-hidden="true">•</span>
            <span className="glass rounded-full px-3 py-1">Instant matches</span>
          </div>
          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted">
            <IconSparkles className="w-3.5 h-3.5 text-accent-amber" />
            Curated picks plus popular MovieLens titles, cleaned for discovery
          </p>
        </div>
      </section>

      {/* Genre chips */}
      <section aria-label="Filter by genre" className="pb-6">
        <div className="genre-rail glass rounded-2xl p-2 flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-2 sm:flex-wrap">
          <button
            type="button"
            onClick={() => setGenre('')}
            aria-pressed={genre === ''}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium border transition-all ${
              genre === ''
                ? 'bg-gradient-to-r from-accent-violet to-accent-magenta border-transparent text-white shadow-glow'
                : 'border-white/10 text-muted hover:text-mist hover:border-white/25'
            }`}
          >
            All
          </button>
          {genres.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGenre(genre === g ? '' : g)}
              aria-pressed={genre === g}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium border transition-all ${
                genre === g
                  ? 'bg-gradient-to-r from-accent-violet to-accent-magenta border-transparent text-white shadow-glow'
                  : 'border-white/10 text-muted hover:text-mist hover:border-white/25'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </section>

      {/* Grid */}
      <section aria-label="Movie catalog" className="pb-16">
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-accent-amber font-semibold">Your next watch</p>
            <h2 className="mt-1 font-display font-bold text-xl text-mist">
            {genre ? `${genre} movies` : query ? 'Search results' : 'Browse the catalog'}
            </h2>
          </div>
          {!loading && !error && (
            <p className="text-sm text-muted">
              {movies.length} {movies.length === 1 ? 'movie' : 'movies'}
            </p>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : movies.length === 0 ? (
          <EmptyState
            title="No movies found"
            hint="Try a different search or clear the genre filter."
            action={
              <button
                type="button"
                onClick={() => {
                  setInput('');
                  setGenre('');
                }}
                className="mt-5 rounded-xl border border-white/15 px-5 py-2.5 text-sm font-semibold text-mist hover:bg-white/5 transition"
              >
                Clear filters
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
            {movies.map((m, i) => (
              <MovieCard key={m.id} movie={m} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* --------------------------------------------------------------- details */

function MatchNote() {
  return (
    <p className="flex items-start gap-1.5 text-xs text-muted mt-3">
      <IconInfo className="w-3.5 h-3.5 mt-[1px] shrink-0" />
      <span>
        Match % is a TF-IDF text-similarity score (cosine similarity between
        movie profiles) — not a probability or a predicted rating.
      </span>
    </p>
  );
}

function MovieDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { ratings, rate } = useRatings();
  const { push } = useToasts();
  const [movie, setMovie] = useState(null);
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([getMovie(id), getRecommendations(id, 6)])
      .then(([m, r]) => {
        setMovie(m);
        setRecs(r.recommendations || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    setMovie(null);
    setRecs([]);
    load();
  }, [load]);

  const handleRate = async (value) => {
    setBusy(true);
    try {
      await rate(movie.id, value);
      push(`Rated “${movie.title}” ${value}/5`);
    } catch (err) {
      push(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="skeleton h-9 w-32 rounded-lg" />
        <div className="mt-6 grid md:grid-cols-[300px_1fr] gap-8">
          <div className="skeleton aspect-[2/3] rounded-3xl max-w-[300px]" />
          <div className="space-y-4">
            <div className="skeleton h-12 w-3/4 rounded-xl" />
            <div className="skeleton h-4 w-full rounded" />
            <div className="skeleton h-4 w-5/6 rounded" />
            <div className="skeleton h-24 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <ErrorState
          message={error || 'Movie not found.'}
          onRetry={error ? load : undefined}
        />
        <div className="text-center mt-6">
          <Link to="/" className="text-accent-amber text-sm font-semibold hover:underline">
            Back to catalog
          </Link>
        </div>
      </div>
    );
  }

  const art = posterArt(movie);
  const myRating = ratings[movie.id];

  return (
    <div className="relative">
      {/* Blurred backdrop built from poster colors */}
      <div
        aria-hidden="true"
        className="absolute -top-16 inset-x-0 h-[420px] opacity-30 blur-3xl pointer-events-none"
        style={{
          background: `radial-gradient(60% 80% at 28% 50%, hsl(${art.hue} 70% 45% / 0.9), transparent 70%)`,
        }}
      />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-medium text-muted hover:text-mist transition-colors"
        >
          <IconBack /> Back
        </button>

        <div className="mt-6 grid md:grid-cols-[300px_1fr] gap-8 lg:gap-12 items-start">
          <div className="animate-fade-up max-w-[300px]">
            <Poster
              movie={movie}
              className="aspect-[2/3] rounded-3xl border border-white/10 shadow-card"
              letterClass="text-[9rem]"
            />
          </div>

          <div className="animate-fade-up" style={{ animationDelay: '80ms' }}>
            <div className="flex flex-wrap gap-2">
              {(movie.genres || []).map((g) => (
                <span key={g} className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-mist">
                  {g}
                </span>
              ))}
            </div>
            <h1 className="mt-4 font-display font-extrabold tracking-tight text-mist" style={{ fontSize: 'clamp(1.9rem, 4vw, 3rem)', lineHeight: 1.08 }}>
              {movie.title}
            </h1>
            <p className="mt-2 text-muted">
              Directed by <span className="text-mist font-medium">{movie.director}</span>
            </p>

            <p className="mt-5 text-mist/90 leading-relaxed max-w-2xl">{movie.overview}</p>

            <div className="mt-5">
              <h2 className="text-xs font-semibold tracking-[0.18em] uppercase text-muted">Cast</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {(movie.cast || []).map((c) => (
                  <span key={c} className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-sm text-mist/90">
                    {c}
                  </span>
                ))}
              </div>
            </div>

            {/* Rating card */}
            <div className="mt-7 glass rounded-2xl p-5 max-w-md">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-sm font-semibold text-mist">
                    {myRating ? `You rated this ${myRating}/5` : 'Rate this movie'}
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    Validated by the API · stored locally in your browser
                  </p>
                </div>
                <StarRating value={myRating} onChange={handleRate} size="lg" busy={busy} />
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {recs.length > 0 && (
          <section className="mt-12" aria-label="Recommendations">
            <h2 className="font-display font-bold text-xl text-mist">
              Because you viewed this
            </h2>
            <div className="mt-5 flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
              {recs.map((r, i) => (
                <Link
                  key={r.id}
                  to={`/movie/${r.id}`}
                  className="group w-40 sm:w-44 shrink-0 snap-start animate-fade-up"
                  style={{ animationDelay: `${i * 60}ms` }}
                  aria-label={`View details for ${r.title}, ${Math.round(r.similarity * 100)}% match`}
                >
                  <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-card transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-glow">
                    <Poster movie={r} className="aspect-[2/3]" />
                    <span className="absolute top-2 left-2 rounded-full bg-ink/80 backdrop-blur border border-white/10 px-2 py-0.5 text-[11px] font-bold text-accent-amber">
                      Match {Math.round(r.similarity * 100)}%
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-mist truncate group-hover:text-accent-amber transition-colors">
                    {r.title}
                  </p>
                  <p className="text-xs text-muted truncate">
                    {(r.genres || []).join(' · ')}
                  </p>
                </Link>
              ))}
            </div>
            <MatchNote />
          </section>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- my ratings */

function MyRatings() {
  const { ratings, remove, rate, ready } = useRatings();
  const { push } = useToasts();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  const ids = useMemo(() => Object.keys(ratings), [ratings]);

  useEffect(() => {
    if (!ready) return;
    let alive = true;
    setLoading(true);
    Promise.all(
      ids.map((id) => getMovie(Number(id)).catch(() => null))
    ).then((results) => {
      if (!alive) return;
      setMovies(results.filter(Boolean));
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [ids, ready]);

  const handleRemove = (id, title) => {
    remove(id);
    push(`Removed rating for “${title}”`);
  };

  const handleRate = async (movie, value) => {
    try {
      await rate(movie.id, value);
      push(`Updated “${movie.title}” to ${value}/5`);
    } catch (err) {
      push(err.message, 'error');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-display font-extrabold tracking-tight text-3xl sm:text-4xl text-mist">
        My <span className="text-gradient">Ratings</span>
      </h1>
      <p className="mt-2 text-muted text-sm">
        Your personal star list — kept in this browser only.
      </p>

      {!ready || loading ? (
        <div className="mt-8 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-24 rounded-2xl" />
          ))}
        </div>
      ) : movies.length === 0 ? (
        <EmptyState
          title="No ratings yet"
          hint="Rate a movie from the details page and it will show up here."
          action={
            <Link
              to="/"
              className="inline-block mt-5 rounded-xl bg-gradient-to-r from-accent-violet to-accent-magenta px-6 py-3 text-sm font-semibold text-white shadow-glow hover:opacity-90 transition"
            >
              Browse movies
            </Link>
          }
        />
      ) : (
        <ul className="mt-8 space-y-4">
          {movies.map((m, i) => (
            <li
              key={m.id}
              className="glass rounded-2xl p-4 flex items-center gap-4 animate-fade-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <Link to={`/movie/${m.id}`} className="shrink-0 block w-14 rounded-xl overflow-hidden border border-white/10">
                <Poster movie={m} className="aspect-[2/3]" letterClass="text-3xl" />
              </Link>
              <div className="flex-1 min-w-0">
                <Link
                  to={`/movie/${m.id}`}
                  className="font-display font-semibold text-mist hover:text-accent-amber transition-colors block truncate"
                >
                  {m.title}
                </Link>
                <p className="text-xs text-muted truncate mt-0.5">
                  {(m.genres || []).join(' · ')}
                </p>
                <div className="mt-2">
                  <StarRating
                    value={ratings[m.id]}
                    onChange={(v) => handleRate(m, v)}
                    size="sm"
                    label={`Rate ${m.title}`}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(m.id, m.title)}
                aria-label={`Remove rating for ${m.title}`}
                className="shrink-0 flex items-center gap-1.5 rounded-xl border border-rose-400/30 text-rose-300 px-3 py-2 text-xs font-semibold hover:bg-rose-500/10 transition"
              >
                <IconTrash /> Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------- 404 */

function NotFound() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-24 text-center">
      <p
        className="font-display font-extrabold text-gradient tracking-tight"
        style={{ fontSize: 'clamp(5rem, 16vw, 9rem)', lineHeight: 1 }}
      >
        404
      </p>
      <h1 className="mt-4 font-display font-bold text-2xl text-mist">
        This reel doesn't exist
      </h1>
      <p className="mt-3 text-muted">
        The page you're looking for was cut in the edit. Let's get you back to
        the good stuff.
      </p>
      <Link
        to="/"
        className="inline-block mt-8 rounded-xl bg-gradient-to-r from-accent-violet to-accent-magenta px-6 py-3 text-sm font-semibold text-white shadow-glow hover:opacity-90 transition"
      >
        Back to the catalog
      </Link>
    </div>
  );
}

/* ---------------------------------------------------------------- footer */

function Footer() {
  return (
    <footer className="border-t border-line mt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted">
        <p className="font-display font-semibold text-mist text-center sm:text-left">
          AI-Powered Movie Recommendation System
        </p>
        <p className="text-center">Team 11 · Anurag University, Department of Data Science</p>
        <p className="text-center sm:text-right">Built with React · Tailwind · Flask · Scikit-learn</p>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------- app */

function Shell() {
  const location = useLocation();
  return (
    <div className="min-h-screen flex flex-col">
      <div className="grain" aria-hidden="true" />
      <Navbar />
      <main className="flex-1" id="main">
        <div key={location.pathname} className="animate-fade-up">
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/movie/:id" element={<MovieDetails />} />
            <Route path="/my-ratings" element={<MyRatings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <RatingsProvider>
        <OnlineProvider>
          <Shell />
        </OnlineProvider>
      </RatingsProvider>
    </ToastProvider>
  );
}
