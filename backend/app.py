"""Flask REST API exposing the content-based movie recommender."""

import os

from flask import Flask, jsonify, request
from flask_cors import CORS

from recommender import MovieRecommender

ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": ALLOWED_ORIGINS}})
recommender = MovieRecommender()


@app.get("/api/health")
def health():
    """Liveness probe."""
    return jsonify({"status": "ok"})


@app.get("/api/movies")
def movies():
    """List movies, optionally filtered by ?q= search and ?genre=."""
    q = (request.args.get("q") or "").strip()
    genre = (request.args.get("genre") or "").strip()
    if q:
        result = recommender.search(q)
    else:
        result = recommender.all_movies()
    if genre:
        wanted = genre.lower()
        result = [m for m in result if wanted in (g.lower() for g in m["genres"])]
    return jsonify(result)


@app.get("/api/movies/<int:movie_id>")
def movie_detail(movie_id):
    """Return a single movie by id."""
    movie = recommender.get_movie(movie_id)
    if movie is None:
        return jsonify({"error": f"Movie with id {movie_id} not found"}), 404
    return jsonify(movie)


@app.get("/api/recommend/<int:movie_id>")
def recommendations(movie_id):
    """Return the top-N most similar movies for a given movie id."""
    raw_limit = request.args.get("limit", "5")
    try:
        limit = int(raw_limit)
    except (TypeError, ValueError):
        return jsonify({"error": "'limit' must be an integer"}), 400
    limit = max(1, min(20, limit))

    movie = recommender.get_movie(movie_id)
    if movie is None:
        return jsonify({"error": f"Movie with id {movie_id} not found"}), 404
    recs = recommender.recommend(movie_id, limit)
    return jsonify({"movie": {"id": movie["id"], "title": movie["title"]},
                    "recommendations": recs})


@app.post("/api/ratings")
def create_rating():
    """Validate a 1-5 star rating payload (nothing is stored server-side)."""
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Request body must be a JSON object"}), 400

    movie_id = data.get("movie_id")
    rating = data.get("rating")
    if movie_id is None or rating is None:
        return jsonify({"error": "Both 'movie_id' and 'rating' are required"}), 400
    if isinstance(movie_id, bool) or not isinstance(movie_id, int):
        return jsonify({"error": "'movie_id' must be an integer"}), 400
    if isinstance(rating, bool) or not isinstance(rating, int):
        return jsonify({"error": "'rating' must be an integer"}), 400
    if rating < 1 or rating > 5:
        return jsonify({"error": "'rating' must be between 1 and 5"}), 400
    if recommender.get_movie(movie_id) is None:
        return jsonify({"error": f"Movie with id {movie_id} not found"}), 400

    return jsonify({"message": "Rating validated", "movie_id": movie_id,
                    "rating": rating, "persisted": False})


@app.errorhandler(400)
def bad_request(_err):
    return jsonify({"error": "Bad request"}), 400


@app.errorhandler(404)
def not_found(_err):
    return jsonify({"error": "Not found"}), 404


@app.errorhandler(405)
def method_not_allowed(_err):
    return jsonify({"error": "Method not allowed"}), 405


@app.errorhandler(500)
def server_error(_err):
    return jsonify({"error": "Internal server error"}), 500


if __name__ == "__main__":
    debug = os.environ.get("FLASK_DEBUG", "0").lower() in ("1", "true", "yes")
    app.run(host="127.0.0.1", port=5000, debug=debug)
