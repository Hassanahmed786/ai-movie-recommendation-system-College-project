"""API tests using Flask's test client (run with pytest)."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app import app  # noqa: E402


def client():
    app.config["TESTING"] = True
    return app.test_client()


def test_health():
    res = client().get("/api/health")
    assert res.status_code == 200
    assert res.get_json() == {"status": "ok"}


def test_movies_list():
    res = client().get("/api/movies")
    data = res.get_json()
    assert res.status_code == 200
    assert isinstance(data, list) and len(data) >= 50
    assert data[0]["id"] == 1
    assert data[0]["title"] == "Interstellar"
    for key in ("id", "title", "genres", "overview", "cast", "director"):
        assert key in data[0]


def test_movies_search():
    res = client().get("/api/movies?q=space")
    data = res.get_json()
    assert res.status_code == 200
    titles = [m["title"].lower() for m in data]
    assert "interstellar" in titles


def test_movies_genre_filter():
    res = client().get("/api/movies?genre=Sci-Fi")
    data = res.get_json()
    assert res.status_code == 200
    assert len(data) >= 5
    assert all("sci-fi" in (g.lower() for g in m["genres"]) for m in data)


def test_movie_detail():
    res = client().get("/api/movies/1")
    assert res.status_code == 200
    body = res.get_json()
    assert body["title"] == "Interstellar"
    assert "similarity" not in body


def test_movie_detail_404():
    res = client().get("/api/movies/9999")
    assert res.status_code == 404
    assert "error" in res.get_json()


def test_recommend_default():
    res = client().get("/api/recommend/1")
    body = res.get_json()
    assert res.status_code == 200
    assert body["movie"] == {"id": 1, "title": "Interstellar"}
    recs = body["recommendations"]
    assert len(recs) == 5
    assert all(r["id"] != 1 for r in recs)
    scores = [r["similarity"] for r in recs]
    assert scores == sorted(scores, reverse=True)
    assert all(isinstance(s, float) for s in scores)


def test_recommend_limit_clamped():
    res = client().get("/api/recommend/1?limit=100")
    assert res.status_code == 200
    assert len(res.get_json()["recommendations"]) == 20
    res = client().get("/api/recommend/1?limit=1")
    assert len(res.get_json()["recommendations"]) == 1


def test_recommend_bad_limit():
    res = client().get("/api/recommend/1?limit=abc")
    assert res.status_code == 400
    assert "error" in res.get_json()


def test_recommend_unknown_movie():
    res = client().get("/api/recommend/9999")
    assert res.status_code == 404


def test_rating_valid():
    res = client().post("/api/ratings", json={"movie_id": 1, "rating": 5})
    body = res.get_json()
    assert res.status_code == 200
    assert body["message"] == "Rating validated"
    assert body["movie_id"] == 1
    assert body["rating"] == 5
    assert body["persisted"] is False


def test_rating_out_of_range():
    for rating in (0, 6, -1):
        res = client().post("/api/ratings", json={"movie_id": 1, "rating": rating})
        assert res.status_code == 400, rating


def test_rating_wrong_types():
    cases = [
        {"movie_id": 1.5, "rating": 4},
        {"movie_id": "1", "rating": 4},
        {"movie_id": 1, "rating": "4"},
        {"movie_id": True, "rating": 4},
        {"movie_id": 1, "rating": True},
    ]
    for payload in cases:
        res = client().post("/api/ratings", json=payload)
        assert res.status_code == 400, payload


def test_rating_missing_fields():
    res = client().post("/api/ratings", json={"movie_id": 1})
    assert res.status_code == 400
    res = client().post("/api/ratings", json={"rating": 4})
    assert res.status_code == 400


def test_rating_unknown_movie():
    res = client().post("/api/ratings", json={"movie_id": 9999, "rating": 4})
    assert res.status_code == 400


def test_rating_bad_body():
    res = client().post(
        "/api/ratings", data="not json", content_type="application/json"
    )
    assert res.status_code == 400
    res = client().post("/api/ratings", json=[1, 2, 3])
    assert res.status_code == 400


def test_unknown_route_is_json():
    res = client().get("/api/nope")
    assert res.status_code == 404
    assert "error" in res.get_json()


def test_method_not_allowed_is_json():
    res = client().post("/api/health")
    assert res.status_code == 405
    assert "error" in res.get_json()


def test_cors_header_for_vite_origin():
    res = client().get(
        "/api/movies", headers={"Origin": "http://localhost:5173"}
    )
    assert res.headers.get("Access-Control-Allow-Origin") == "http://localhost:5173"


def test_cors_preflight():
    res = client().options(
        "/api/ratings",
        headers={
            "Origin": "http://127.0.0.1:5173",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert res.status_code == 200
    assert res.headers.get("Access-Control-Allow-Origin") == "http://127.0.0.1:5173"
