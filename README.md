# Chutzi

Chutzi is a small playful experience with editorially reviewed French and English two-part jokes. The mascot accompanies every moment with expressive animations, sounds and surprise reactions.

![Chutzi home screen on desktop](assets/images/previews/readme-preview.png)

<p align="center">
  <img src="assets/images/previews/readme-preview-mobile.png" alt="Chutzi home screen on mobile" width="278" />
</p>

## Demo

- GitHub Pages: https://osiris-balonga.github.io/chutzi/
- Repository: https://github.com/Osiris-Balonga/chutzi

## Features

- offers French and English interface and joke content;
- stores language and humour-tone choices locally after a one-time onboarding;
- selects from a bundled, reviewed joke catalog instead of trusting runtime API responses;
- guides the player from setup to punchline, then to a simple reaction and another joke or the home screen;
- applies a non-negotiable safety policy to every catalog record;
- brings an animated mascot to life with contextual reactions and idle animations;
- uses anticipation, squash-and-stretch and a grounded shadow for jumps;
- includes thinking, singing, sleeping, laughing and devil transformations;
- plays looping background music and contextual sound effects;
- stores independent music and effects preferences with `localStorage`;
- uses an audio modal on desktop and a bottom sheet on mobile;
- is mobile-first, keyboard navigable and respects `prefers-reduced-motion`.

## User flow

1. Choose a language and humour tone on the first visit.
2. Select **Start** and read the setup.
3. Select **Show the answer** to reveal the punchline.
4. React to the joke, then choose **Another** or **Quit**.

## Technology

- semantic HTML5;
- CSS3 and keyframe animations;
- native browser ES modules, with TypeScript for domain logic;
- Web Audio through the `Audio` element;
- Google Fonts with the Nunito family;
- Git and GitHub Pages.

No frontend framework or server is required. The generated browser modules are committed for GitHub Pages, while TypeScript source and tests are checked in CI.

## Run locally

Install development dependencies and run the checks:

```bash
npm ci
npm run verify
```

Then serve the directory with any static server, for example:

```bash
npx serve . -l 4173
```

Open `http://127.0.0.1:4173/`.

## Architecture

```text
chutzi/
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
│       ├── catalog/
│       ├── config.js
│       ├── core/
│       ├── developer.js
│       ├── jokes.js
│       └── mascot.js
├── .nojekyll
├── index.html
├── src/
│   ├── catalog/
│   └── core/
├── test/
├── robots.txt
├── site.webmanifest
├── sitemap.xml
└── README.md
```

`app.js` orchestrates the flow. Local selection lives in `jokes.js`; catalog validation and content live in `src/catalog`; preferences and translations live in `src/core`; audio lives in `audio.js`; mascot reactions live in `mascot.js`; and preview tools live in `developer.js`. `main.css` imports the stylesheets in cascade order.

## Developer mode

After a game starts, a panel can trigger Chutzi's nine reactions manually: look, hop, think, chat, sleep, sing, devil, laugh and error.

Open it in either of these ways:

- append `?dev=1` to the URL, for example https://osiris-balonga.github.io/chutzi/?dev=1;
- use the <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>D</kbd> shortcut.

![Chutzi reaction preview panel](assets/images/previews/developer.png)

## Safety and privacy

The application never requests jokes from a third party. Each bundled joke is manually marked as approved, carries a language and tone, and must pass the catalog safety policy before it can be shown. Unknown or malformed records fail closed.

Preferences stay in the browser. Chutzi has no account, analytics backend, or required server and does not collect personal data.

## GitHub Pages deployment

The project is ready to publish from the `main` branch and repository root. `.nojekyll` disables Jekyll processing, while `robots.txt`, `sitemap.xml`, the manifest and social metadata target the production URL.

In GitHub, select **Settings → Pages → Deploy from a branch**, then choose the `main` branch and `/ (root)` folder.

## Author

Created by [Osiris Balonga](https://github.com/Osiris-Balonga) as part of Akieni Academy.
