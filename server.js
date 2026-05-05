import 'dotenv/config';
import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// TMDB proxy – keeps the API key server-side
app.get('/api/tmdb/*', async (req, res) => {
  const key = process.env.TMDB_API_KEY;
  if (!key) return res.status(503).json({ error: 'TMDB_API_KEY not configured' });

  const path = req.params[0];
  const query = new URLSearchParams(req.query);
  query.set('api_key', key);
  if (!query.has('language')) query.set('language', 'fr-FR');

  try {
    const upstream = await fetch(`https://api.themoviedb.org/3/${path}?${query}`);
    const data = await upstream.json();
    res.setHeader('Cache-Control', 'public, max-age=300'); // 5 min cache
    res.json(data);
  } catch (err) {
    console.error('TMDB proxy error:', err);
    res.status(502).json({ error: 'Upstream error' });
  }
});

// Search endpoint
app.get('/api/search', async (req, res) => {
  const key = process.env.TMDB_API_KEY;
  if (!key) return res.status(503).json({ error: 'TMDB_API_KEY not configured' });

  const { q, page = 1 } = req.query;
  if (!q?.trim()) return res.json({ results: [] });

  try {
    const url = `https://api.themoviedb.org/3/search/multi?api_key=${key}&language=fr-FR&query=${encodeURIComponent(q)}&page=${page}&include_adult=false`;
    const r = await fetch(url);
    const data = await r.json();
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'Upstream error' });
  }
});

// Trending endpoint
app.get('/api/trending/:type/:window', async (req, res) => {
  const key = process.env.TMDB_API_KEY;
  if (!key) return res.status(503).json({ error: 'TMDB_API_KEY not configured' });

  const { type, window } = req.params;
  const allowed = { types: ['all','movie','tv'], windows: ['day','week'] };
  if (!allowed.types.includes(type) || !allowed.windows.includes(window)) {
    return res.status(400).json({ error: 'Invalid params' });
  }

  try {
    const url = `https://api.themoviedb.org/3/trending/${type}/${window}?api_key=${key}&language=fr-FR`;
    const r = await fetch(url);
    const data = await r.json();
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'Upstream error' });
  }
});

// SPA fallback – serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

createServer(app).listen(PORT, () => {
  console.log(`StreamFlix running on http://localhost:${PORT}`);
});
