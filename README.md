# 🎬 StreamFlix

Site de streaming films & séries, interface style Netflix, propulsé par l'API TMDB et des lecteurs vidéo embarqués.

## Fonctionnalités

- **Page d'accueil** : hero dynamique, rangées de films/séries par catégorie, sliders horizontaux
- **Recherche** : overlay de recherche en temps réel via TMDB
- **Genres** : filtrage par genre (Action, Comédie, Thriller…)
- **Lecteur** : page dédiée avec 5 serveurs vidéo (VidSrc, VidSrc 2, SuperEmbed, EmbedSu, AutoEmbed)
- **Séries TV** : navigation par saison/épisode
- **Modal détail** : infos complètes, casting, films similaires
- **Design** : dark mode, responsive, animations fluides

## Installation

```bash
git clone https://github.com/YOUR_USERNAME/streamflix.git
cd streamflix
npm install
cp .env.example .env
# Éditez .env et ajoutez votre clé TMDB
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000)

## Clé API TMDB

1. Créez un compte sur [themoviedb.org](https://www.themoviedb.org)
2. Allez dans **Paramètres → API**
3. Demandez une clé API v3 (gratuite)
4. Ajoutez-la dans `.env` : `TMDB_API_KEY=votre_cle`

> Le serveur Express agit en proxy pour garder la clé côté serveur.  
> En mode statique (sans serveur), renseignez directement `TMDB_KEY` dans `index.html` et `watch.html`.

## Structure

```
streamflix/
├── index.html      # Page d'accueil
├── watch.html      # Lecteur vidéo
├── server.js       # Backend Express (proxy TMDB)
├── package.json
├── .env.example
└── .gitignore
```

## Déploiement

Compatible avec **Render**, **Railway**, **Vercel** (statique), **Netlify**.

### Render (recommandé)
- Build command : `npm install`
- Start command : `npm start`
- Ajoutez `TMDB_API_KEY` dans les variables d'environnement

## Lecteurs vidéo

| Serveur | URL |
|---------|-----|
| VidSrc | vidsrc.to |
| VidSrc 2 | vidsrc.xyz |
| SuperEmbed | multiembed.mov |
| EmbedSu | embed.su |
| AutoEmbed | autoembed.co |

> Ce projet n'héberge aucun fichier vidéo. Il agrège des sources tierces publiques.

## Licence

MIT
