# Chutzi

Chutzi est une mini-expérience gamifiée qui récupère des blagues françaises en deux parties depuis JokeAPI. La mascotte accompagne chaque étape avec des expressions, des sons et des réactions surprises.

![Accueil de Chutzi sur ordinateur](assets/images/previews/readme-preview.png)

<p align="center">
  <img src="assets/images/previews/readme-preview-mobile.png" alt="Accueil de Chutzi sur mobile" width="278" />
</p>

## Démo

- GitHub Pages : https://osiris-balonga.github.io/blague-aleatoire/
- Repository : https://github.com/Osiris-Balonga/blague-aleatoire

## Fonctionnalités

- récupération asynchrone de blagues françaises avec `fetch` ;
- parcours question, révélation de la chute, nouvelle blague ou retour à l'accueil ;
- filtrage complémentaire pour conserver une expérience tout public ;
- états de chargement et d'erreur dédiés ;
- mascotte animée avec réactions contextuelles et animations d'inactivité ;
- saut avec anticipation, squash and stretch et ombre ancrée sur la carte ;
- réactions de réflexion, chant, sommeil, rire et transformation en diablotin ;
- musique de fond en boucle et effets sonores contextuels ;
- réglages séparés pour la musique et les effets, mémorisés avec `localStorage` ;
- modal audio sur ordinateur et bottom sheet sur mobile ;
- interface mobile-first, navigation clavier et prise en charge de `prefers-reduced-motion`.

## Parcours utilisateur

1. Cliquer sur **Commencer**.
2. Attendre le chargement de la blague.
3. Lire la question.
4. Cliquer sur **Afficher la réponse**.
5. Choisir **Une autre** ou **Quitter**.

## Technologies

- HTML5 sémantique ;
- CSS3 et animations par keyframes ;
- JavaScript natif avec modules ES ;
- Fetch API et Web Audio via l'élément `Audio` ;
- JokeAPI ;
- Google Fonts avec la famille Nunito ;
- Git et GitHub Pages.

Aucun framework, aucune dépendance JavaScript et aucune étape de compilation ne sont nécessaires.

## Lancement local

Les scripts utilisent les modules ES. Il faut donc servir le dossier avec un serveur statique plutôt que d'ouvrir directement `index.html` :

```bash
python -m http.server 8000
```

Ouvrir ensuite `http://127.0.0.1:8000/`.

## Architecture

```text
blague-aleatoire/
├── assets/
│   ├── audio/
│   ├── css/
│   │   ├── animations.css
│   │   ├── audio.css
│   │   ├── developer.css
│   │   ├── foundation.css
│   │   ├── game.css
│   │   ├── layout.css
│   │   ├── main.css
│   │   ├── mascot.css
│   │   └── responsive.css
│   ├── images/
│   │   ├── brand/
│   │   ├── previews/
│   │   └── reactions/
│   └── js/
│       ├── app.js
│       ├── audio.js
│       ├── config.js
│       ├── developer.js
│       ├── jokes.js
│       └── mascot.js
├── .nojekyll
├── index.html
├── robots.txt
├── site.webmanifest
├── sitemap.xml
└── README.md
```

`app.js` orchestre le parcours. Les requêtes et le filtrage vivent dans `jokes.js`, l'audio dans `audio.js`, les réactions dans `mascot.js` et les outils de prévisualisation dans `developer.js`. `main.css` importe les feuilles de styles dans l'ordre de cascade.

## Mode développeur

Un panneau permet de déclencher manuellement les neuf réactions de Chutzi après le démarrage du jeu : regard, saut, réflexion, bavardage, sommeil, chant, diablotin, rire et erreur.

Deux méthodes permettent de l'ouvrir :

- ajouter `?dev=1` à l'URL, par exemple https://osiris-balonga.github.io/blague-aleatoire/?dev=1 ;
- utiliser le raccourci <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>D</kbd>.

![Panneau de prévisualisation des réactions de Chutzi](assets/images/previews/developer.png)

## API et confidentialité

Les blagues proviennent de [JokeAPI](https://jokeapi.dev/) avec la langue française, le format en deux parties et le mode sécurisé activés. Seules les préférences audio sont conservées localement dans le navigateur ; l'application ne collecte aucune donnée personnelle.

## Déploiement GitHub Pages

Le projet est prêt pour une publication depuis la branche `main` et le dossier racine. Le fichier `.nojekyll` désactive le traitement Jekyll, tandis que `robots.txt`, `sitemap.xml`, le manifeste et les métadonnées de partage ciblent l'URL de production.

Dans GitHub, sélectionner **Settings → Pages → Deploy from a branch**, puis choisir la branche `main` et le dossier `/ (root)`.

## Auteur

Projet réalisé par [Osiris Balonga](https://github.com/Osiris-Balonga) dans le cadre de l'Akieni Academy.
