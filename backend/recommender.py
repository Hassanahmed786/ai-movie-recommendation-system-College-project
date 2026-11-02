"""Content-based movie recommender built on TF-IDF + cosine similarity."""

import os
import re

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "data", "movies.csv")
REQUIRED_COLUMNS = ["id", "title", "genres", "overview", "cast", "director"]


class MovieRecommender:
    """Loads the movie catalog and serves content-based recommendations.

    Each movie is turned into a text profile (weighted genres + overview +
    compact cast/director names), vectorized with TF-IDF, and similarity is
    measured with cosine distance between profiles.
    """

    def __init__(self, csv_path: str = DATA_PATH) -> None:
        if not os.path.exists(csv_path):
            raise FileNotFoundError(f"Movie dataset not found at: {csv_path}")
        self.df = self._load(csv_path)
        self.profiles = self._build_profiles()
        self.vectorizer = TfidfVectorizer(
            stop_words="english", ngram_range=(1, 2), sublinear_tf=True
        )
        self.matrix = self.vectorizer.fit_transform(self.profiles)

    # ------------------------------------------------------------------ load
    @staticmethod
    def _load(csv_path: str) -> pd.DataFrame:
        """Read and validate the CSV, filling missing values with ''."""
        df = pd.read_csv(csv_path)
        missing = [col for col in REQUIRED_COLUMNS if col not in df.columns]
        if missing:
            raise ValueError(
                f"movies.csv is missing required columns: {', '.join(missing)}"
            )
        df = df.fillna("")
        return df

    @staticmethod
    def _compact_names(raw: str) -> str:
        """'Matt Damon | Chris Pratt' -> 'MattDamon ChrisPratt'."""
        parts = [p.strip() for p in str(raw).split("|") if p.strip()]
        return " ".join(re.sub(r"\s+", "", part) for part in parts)

    def _build_profiles(self) -> list:
        """Build one text profile per movie row."""
        profiles = []
        for row in self.df.itertuples(index=False):
            genres = re.sub(r"\s+", " ", str(row.genres).replace("|", " ")).strip()
            text = (
                f"{genres} {genres} {row.overview} "
                f"{self._compact_names(row.cast)} {self._compact_names(row.director)}"
            )
            profiles.append(re.sub(r"\s+", " ", text).strip())
        return profiles

    # ---------------------------------------------------------------- output
    @staticmethod
    def _plain(row) -> dict:
        """Convert a DataFrame row to a JSON-safe dict of plain Python types."""
        return {
            "id": int(row.id),
            "title": str(row.title),
            "genres": [g.strip() for g in str(row.genres).split("|") if g.strip()],
            "overview": str(row.overview),
            "cast": [c.strip() for c in str(row.cast).split("|") if c.strip()],
            "director": str(row.director),
        }

    # ---------------------------------------------------------------- queries
    def all_movies(self) -> list:
        """Return every movie in the catalog."""
        return [self._plain(row) for row in self.df.itertuples(index=False)]

    def get_movie(self, movie_id: int):
        """Return one movie by id, or None when unknown."""
        hits = self.df[self.df["id"] == movie_id]
        if hits.empty:
            return None
        return self._plain(hits.iloc[0])

    def search(self, query: str) -> list:
        """Case-insensitive substring search across the main text fields."""
        q = str(query).strip().lower()
        if not q:
            return []
        mask = pd.Series(False, index=self.df.index)
        for col in ("title", "genres", "overview", "cast", "director"):
            mask |= self.df[col].astype(str).str.lower().str.contains(q, regex=False)
        return [self._plain(row) for row in self.df[mask].itertuples(index=False)]

    def genres_list(self) -> list:
        """Return the sorted list of unique genres in the catalog."""
        seen = set()
        for raw in self.df["genres"]:
            seen.update(g.strip() for g in str(raw).split("|") if g.strip())
        return sorted(seen)

    def recommend(self, movie_id: int, limit: int = 5):
        """Top-N most similar movies (excluding the given one), or None."""
        hits = self.df[self.df["id"] == movie_id]
        if hits.empty:
            return None
        idx = int(hits.index[0])
        scores = cosine_similarity(self.matrix[idx : idx + 1], self.matrix)[0]
        scores[idx] = 0.0
        order = sorted(
            range(len(self.df)), key=lambda i: (-float(scores[i]), int(self.df.iloc[i]["id"]))
        )
        results = []
        for i in order[:limit]:
            movie = self._plain(self.df.iloc[i])
            movie["similarity"] = round(float(scores[i]), 2)
            results.append(movie)
        return results
