# 🎬 StreamFlix

Site de streaming films & séries **complet**, interface style Netflix, avec deux lecteurs vidéo :
- ⚡ **Lecteur HD natif** (HLS.js) — sans pubs, qualités multiples, comme Cineby/Movieshd
- 📺 **15 serveurs iframe** en fallback — VidSrc, EmbedSu, SuperEmbed, 2Embed, MoviesAPI, etc.

## Fonctionnalités

- Page d'accueil dynamique : hero animé, sliders par genre, recherche temps réel
- Filtrage par genre (Action, Comédie, Thriller, Romance…)
- Lecteur natif **sans pub** (via Consumet self-hosted)
- 15 serveurs iframe en fallback automatique (10s timeout)
- Navigation saison/épisode pour les séries
- Casting, films similaires, modal détail
- Design dark mode responsive
- Emplacements pub intégrés pour la monétisation

## Installation rapide

```bash
git clone https://github.com/tamalou25/streamflix.git
cd streamflix
npm install
cp .env.example .env
# Édite .env et ajoute ta clé TMDB
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000)

## Configuration des APIs

### 1. TMDB (obligatoire — métadonnées)
- Crée un compte sur [themoviedb.org](https://www.themoviedb.org)
- **Paramètres → API → Créer une clé v3** (gratuit, instantané)
- Ajoute dans `.env` : `TMDB_API_KEY=ta_cle`

### 2. Consumet (optionnel — lecteur HD sans pub)

Sans Consumet, le site fonctionne quand même : il bascule automatiquement sur les 15 serveurs iframe. Mais avec, tu as un lecteur natif **propre, sans popup, sans redirection**.

**Déploiement gratuit sur Render (5 minutes) :**

1. Fork [consumet/api.consumet.org](https://github.com/consumet/api.consumet.org)
2. Va sur [render.com](https://render.com) → New → Web Service
3. Connecte le fork
4. Build : `npm install && npm run build` · Start : `npm start`
5. Une fois déployé, copie l'URL (ex. `https://api-consumet-xxx.onrender.com`)
6. Dans ton `.env` : `CONSUMET_BASE_URL=https://api-consumet-xxx.onrender.com`

**Alternatives** :
- [Vercel](https://vercel.com) — un-clic depuis le repo Consumet
- [Railway](https://railway.app) — template officiel

## Monétisation

Le code contient déjà **un emplacement pub** (`.ad-slot` dans `watch.html`). Pour gagner de l'argent avec ce type de site :

### Réseaux qui acceptent les sites de streaming
| Réseau | Type | CPM moyen |
|--------|------|-----------|
| **PopAds** | Pop-under | $1-3 |
| **AdsTerra** | Banner + popup | $1-5 |
| **PropellerAds** | Push + popunder | $1-4 |
| **HilltopAds** | Vidéo + banner | $2-6 |
| **JuicyAds** | Adulte (CPM élevé) | $5-15 |
| **ExoClick** | Multi-format | $3-8 |

> **Google AdSense et Media.net refusent ce type de contenu** (CGU). Inutile d'essayer.

### Comment intégrer un script pub
Dans `watch.html`, remplace le contenu de `.ad-slot` par le script donné par le réseau :
```html
<div class="ad-slot" id="adSlot1">
  <script src="//ton-reseau-pub.com/script.js" data-zone="123456"></script>
</div>
```

### Optimisation revenus
1. **Trafic** : SEO sur les nouveautés ciné (Google indexe vite si tu as un sitemap)
2. **Multi-formats** : combine pop-under + banner sticky + interstitielle après 30s de visionnage
3. **Geo-targeting** : Tier 1 (US/UK/FR) = 5-10× plus rémunérateur que Tier 3
4. **VPN affiliate** : commission de 30-50% sur chaque vente — top niche pour ce trafic
5. **Domaine .com court** : meilleur taux de retour qu'un sous-domaine Render

## Structure

```
streamflix/
├── index.html      # Accueil
├── watch.html      # Lecteur (natif HLS + 15 iframes)
├── server.js       # Backend Express + proxy Consumet
├── package.json
├── .env.example
└── .gitignore
```

## Endpoints serveur

| Route | Usage |
|-------|-------|
| `GET /api/tmdb/*` | Proxy TMDB (clé serveur) |
| `GET /api/search?q=` | Recherche multi |
| `GET /api/trending/:type/:window` | Trending |
| `GET /api/stream?title=&year=&type=&season=&episode=` | **Stream m3u8** via Consumet |

## Déploiement

**Render** (recommandé) :
- Build : `npm install`
- Start : `npm start`
- Env : `TMDB_API_KEY`, `CONSUMET_BASE_URL` (optionnel)

Compatible aussi : Railway, Fly.io, Vercel (statique sans Consumet).

## Licence

MIT — Le projet n'héberge aucun fichier vidéo. Les flux sont fournis par des sources tierces publiques.
