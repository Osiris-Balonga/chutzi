"use strict";

const API_URL = "https://v2.jokeapi.dev/joke/Any?lang=fr&type=twopart&safe-mode&amount=10";
const TERMES_EXCLUS = [
  "sodom",
  "sexe",
  "penis",
  "vagin",
  "porno",
  "bite",
  "couille",
  "pute",
  "drogue",
  "cannabis",
  "alcool",
  "biere",
  "viol"
];

const app = document.querySelector("#app");
const welcomePanel = document.querySelector("#welcome-panel");
const gamePanel = document.querySelector("#game-panel");
const loadingView = document.querySelector("#loading-view");
const jokeView = document.querySelector("#joke-view");
const errorView = document.querySelector("#error-view");
const jokeQuestion = document.querySelector("#joke-question");
const jokeAnswer = document.querySelector("#joke-answer");
const jokeDelivery = document.querySelector("#joke-delivery");
const revealButton = document.querySelector("#reveal-button");
const jokeActions = document.querySelector("#joke-actions");
const audioToggle = document.querySelector("#audio-toggle");
const clickSound = new Audio("assets/audio/click.wav");
const laughSound = new Audio("assets/audio/people-laughing.mp3");
const AUDIO_STORAGE_KEY = "chutzi-audio-muted";

clickSound.preload = "auto";
clickSound.volume = 0.34;
laughSound.preload = "auto";
laughSound.volume = 0.48;

let audioMuted = lirePreferenceAudio();
let dernierIdentifiant = null;

function normaliserTexte(texte) {
  return texte
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function estToutPublic(blague) {
  const texte = normaliserTexte(`${blague.setup} ${blague.delivery}`);
  const signalee = Object.values(blague.flags || {}).some(Boolean);

  return blague.type === "twopart"
    && blague.safe !== false
    && !signalee
    && !TERMES_EXCLUS.some((terme) => texte.includes(terme));
}

function choisirBlague(donnees) {
  const liste = Array.isArray(donnees.jokes) ? donnees.jokes : [donnees];
  const candidates = liste.filter(estToutPublic);
  const nouvelles = candidates.filter((blague) => blague.id !== dernierIdentifiant);
  const selection = nouvelles.length > 0 ? nouvelles : candidates;

  if (selection.length === 0) {
    throw new Error("Aucune blague tout public disponible");
  }

  return selection[Math.floor(Math.random() * selection.length)];
}

function lirePreferenceAudio() {
  try {
    return localStorage.getItem(AUDIO_STORAGE_KEY) === "true";
  } catch (_erreur) {
    return false;
  }
}

function jouerSon(son) {
  if (audioMuted) {
    return;
  }

  son.currentTime = 0;
  void son.play().catch(() => {});
}

function mettreAJourBoutonAudio() {
  audioToggle.classList.toggle("is-muted", audioMuted);
  audioToggle.setAttribute("aria-pressed", String(audioMuted));
  audioToggle.setAttribute("aria-label", audioMuted ? "Activer les sons" : "Couper les sons");
}

function basculerAudio() {
  if (!audioMuted) {
    jouerSon(clickSound);
  }

  audioMuted = !audioMuted;

  try {
    localStorage.setItem(AUDIO_STORAGE_KEY, String(audioMuted));
  } catch (_erreur) {
    // La préférence reste active pour la session si le stockage est indisponible.
  }

  if (audioMuted) {
    laughSound.pause();
  } else {
    jouerSon(clickSound);
  }

  mettreAJourBoutonAudio();
}

function afficherVue(nom) {
  loadingView.hidden = nom !== "loading";
  jokeView.hidden = nom !== "question" && nom !== "revealed";
  errorView.hidden = nom !== "error";
  jokeAnswer.hidden = nom !== "revealed";
  revealButton.hidden = nom !== "question";
  jokeActions.hidden = nom !== "revealed";
  app.dataset.state = nom;
}

async function chargerBlague() {
  laughSound.pause();
  laughSound.currentTime = 0;
  afficherVue("loading");

  try {
    const reponse = await fetch(API_URL);

    if (!reponse.ok) {
      throw new Error(`Erreur HTTP ${reponse.status}`);
    }

    const donnees = await reponse.json();

    if (donnees.error) {
      throw new Error(donnees.message || "Réponse inattendue de l'API");
    }

    const blague = choisirBlague(donnees);
    dernierIdentifiant = blague.id;

    jokeQuestion.textContent = blague.setup;
    jokeDelivery.textContent = blague.delivery;
    afficherVue("question");
    revealButton.focus();
  } catch (erreur) {
    console.error("Impossible de charger la blague :", erreur);
    afficherVue("error");
    document.querySelector("#retry-button").focus();
  }
}

function commencer() {
  app.classList.add("is-entering");
  welcomePanel.hidden = true;
  gamePanel.hidden = false;
  window.setTimeout(() => app.classList.remove("is-entering"), 820);
  void chargerBlague();
}

function revelerReponse() {
  afficherVue("revealed");
  jouerSon(laughSound);
  document.querySelector("#another-button").focus();
}

function quitter() {
  laughSound.pause();
  laughSound.currentTime = 0;
  gamePanel.hidden = true;
  welcomePanel.hidden = false;
  app.classList.remove("is-entering");
  app.dataset.state = "welcome";
  welcomePanel.classList.remove("is-returning");
  void welcomePanel.offsetWidth;
  welcomePanel.classList.add("is-returning");
  document.querySelector("#start-button").focus();
}

document.querySelectorAll(".button").forEach((button) => {
  button.addEventListener("click", () => jouerSon(clickSound));
});

document.querySelector("#start-button").addEventListener("click", commencer);
revealButton.addEventListener("click", revelerReponse);
document.querySelector("#another-button").addEventListener("click", chargerBlague);
document.querySelector("#retry-button").addEventListener("click", chargerBlague);
document.querySelector("#quit-button").addEventListener("click", quitter);
document.querySelector("#error-quit-button").addEventListener("click", quitter);
audioToggle.addEventListener("click", basculerAudio);
mettreAJourBoutonAudio();
