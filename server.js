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

// ----- NATIVE STREAM ENDPOINT (Consumet → FlixHQ → m3u8) -----
// Cache stream URLs for 30 min (they expire fast on FlixHQ)
const streamCache = new Map();
const STREAM_TTL = 30 * 60 * 1000;

function cacheKey(p) { return `${p.title}|${p.year}|${p.type}|${p.season || ''}|${p.episode || ''}`; }

app.get('/api/stream', async (req, res) => {
  const base = process.env.CONSUMET_BASE_URL;
  if (!base) return res.status(503).json({ error: 'CONSUMET_BASE_URL not configured. Voir README pour deployer Consumet.' });

  const { title, year, type = 'movie', season, episode } = req.query;
  if (!title) return res.status(400).json({ error: 'title required' });

  const key = cacheKey({ title, year, type, season, episode });
  const cached = streamCache.get(key);
  if (cached && Date.now() - cached.t < STREAM_TTL) {
    return res.json(cached.data);
  }

  try {
    // 1) Search
    const searchUrl = `${base.replace(/\/$/, '')}/movies/flixhq/${encodeURIComponent(title)}`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) throw new Error(`search: ${searchRes.status}`);
    const search = await searchRes.json();

    const wantType = type === 'tv' ? 'TV Series' : 'Movie';
    const matches = (search.results || []).filter(x => x.type === wantType);
    let best = matches.find(x => x.releaseDate?.includes(year)) || matches[0] || search.results?.[0];
    if (!best) throw new Error('No FlixHQ match');

    // 2) Info
    const infoUrl = `${base.replace(/\/$/, '')}/movies/flixhq/info?id=${encodeURIComponent(best.id)}`;
    const info = await (await fetch(infoUrl)).json();

    // 3) Pick the right episode
    let ep;
    if (type === 'tv') {
      ep = (info.episodes || []).find(e => e.season == season && e.number == episode);
    } else {
      ep = (info.episodes || [])[0];
    }
    if (!ep) throw new Error('Episode not found');

    // 4) Watch — get streaming sources
    const watchUrl = `${base.replace(/\/$/, '')}/movies/flixhq/watch?episodeId=${encodeURIComponent(ep.id)}&mediaId=${encodeURIComponent(info.id)}&server=upcloud`;
    const stream = await (await fetch(watchUrl)).json();

    const data = {
      sources: (stream.sources || []).map(s => ({ url: s.url, quality: s.quality, isM3U8: s.isM3U8 })),
      subtitles: (stream.subtitles || []).map(s => ({ url: s.url, lang: s.lang })),
      headers: stream.headers || null,
      title: best.title,
      year: best.releaseDate
    };

    streamCache.set(key, { t: Date.now(), data });
    res.setHeader('Cache-Control', 'public, max-age=600');
    res.json(data);
  } catch (err) {
    console.error('Stream error:', err.message);
    res.status(502).json({ error: err.message });
  }
});

// SPA fallback – serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

createServer(app).listen(PORT, () => {
  console.log(`StreamFlix running on http://localhost:${PORT}`);
});
