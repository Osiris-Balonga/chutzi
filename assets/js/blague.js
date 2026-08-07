"use strict";

const API_URL = "https://v2.jokeapi.dev/joke/Any?lang=fr&type=twopart&safe-mode";

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
  afficherVue("loading");

  try {
    const reponse = await fetch(API_URL);

    if (!reponse.ok) {
      throw new Error(`Erreur HTTP ${reponse.status}`);
    }

    const blague = await reponse.json();

    if (blague.error || blague.type !== "twopart") {
      throw new Error("Format de blague inattendu");
    }

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
  welcomePanel.hidden = true;
  gamePanel.hidden = false;
  void chargerBlague();
}

function revelerReponse() {
  afficherVue("revealed");
  jokeAnswer.focus?.();
}

function quitter() {
  gamePanel.hidden = true;
  welcomePanel.hidden = false;
  app.dataset.state = "welcome";
  document.querySelector("#start-button").focus();
}

document.querySelector("#start-button").addEventListener("click", commencer);
revealButton.addEventListener("click", revelerReponse);
document.querySelector("#another-button").addEventListener("click", chargerBlague);
document.querySelector("#retry-button").addEventListener("click", chargerBlague);
document.querySelector("#quit-button").addEventListener("click", quitter);
document.querySelector("#error-quit-button").addEventListener("click", quitter);
