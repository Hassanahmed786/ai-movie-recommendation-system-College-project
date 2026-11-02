import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000/api',
  timeout: 10000,
});

/** Turn any axios/network error into a short, friendly message. */
export function friendlyError(err) {
  const status = err?.response?.status;
  const detail = err?.response?.data?.error;
  if (status) return detail ? `${detail} (HTTP ${status})` : `Request failed (HTTP ${status})`;
  if (err?.code === 'ECONNABORTED') return 'The request timed out. Is the Flask backend running?';
  if (err?.message === 'Network Error') {
    return "Can't reach the recommendation server. Start the Flask backend (python app.py) and try again.";
  }
  return err?.message || 'Something went wrong.';
}

export async function getMovies({ q, genre } = {}) {
  try {
    const params = {};
    if (q) params.q = q;
    if (genre) params.genre = genre;
    const { data } = await client.get('/movies', { params });
    return data;
  } catch (err) {
    throw new Error(friendlyError(err));
  }
}

export async function getMovie(id) {
  try {
    const { data } = await client.get(`/movies/${id}`);
    return data;
  } catch (err) {
    throw new Error(friendlyError(err));
  }
}

export async function getRecommendations(id, limit = 5) {
  try {
    const { data } = await client.get(`/recommend/${id}`, { params: { limit } });
    return data;
  } catch (err) {
    throw new Error(friendlyError(err));
  }
}

export async function postRating(movieId, rating) {
  try {
    const { data } = await client.post('/ratings', { movie_id: movieId, rating });
    return data;
  } catch (err) {
    throw new Error(friendlyError(err));
  }
}

export async function getHealth() {
  try {
    const { data } = await client.get('/health');
    return data?.status === 'ok';
  } catch {
    return false;
  }
}
