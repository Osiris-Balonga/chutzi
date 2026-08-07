# Chutzi

Chutzi est une mini-expérience gamifiée qui récupère une blague en français depuis JokeAPI. La question apparaît d'abord, puis l'utilisateur révèle la chute avant de demander une autre blague ou de quitter.

## Aperçu

### Accueil

![Accueil de Chutzi](assets/images/previews/accueil.png)

### Blague révélée

![Question et réponse d'une blague](assets/images/previews/resultat.png)

### Erreur réseau

![Message affiché en cas d'erreur réseau](assets/images/previews/erreur.png)

## Fonctionnalités

- Chargement de blagues françaises avec `fetch`, `async` et `await`
- Sélection de blagues en deux parties : question et réponse
- Filtrage complémentaire des contenus pour conserver une expérience tout public
- États de chargement, résultat et erreur clairement identifiables
- Mascotte animée qui change d'expression selon l'étape
- Son de clic sur les actions et rire au moment de révéler la réponse
- Bouton pour couper les sons avec préférence conservée dans `localStorage`
- Interface mobile-first utilisable au clavier
- Réduction des animations selon `prefers-reduced-motion`

## Parcours

1. Cliquer sur **Commencer**.
2. Attendre le chargement de la blague.
3. Lire la question.
4. Cliquer sur **Afficher la réponse**.
5. Choisir **Une autre** ou **Quitter**.

## Lancer le projet

Le projet utilise uniquement HTML, CSS et JavaScript. Un petit serveur local est recommandé pour les requêtes réseau :

```bash
python -m http.server 8000
```

Ouvrir ensuite `http://localhost:8000` dans un navigateur.

## Structure

```text
blague-aleatoire/
├── index.html
├── assets/
│   ├── audio/
│   ├── css/style.css
│   ├── images/previews/
│   └── js/blague.js
└── README.md
```

## API utilisée

Les données viennent de [JokeAPI](https://jokeapi.dev/), avec la langue française, le format en deux parties et le mode sécurisé activés.
