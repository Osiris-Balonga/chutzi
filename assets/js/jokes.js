import { EXCLUDED_TERMS, JOKE_API_URL } from "./config.js";

let lastJokeId = null;

function normalizeText(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function isFamilyFriendly(joke) {
  const text = normalizeText(`${joke.setup} ${joke.delivery}`);
  const hasFlag = Object.values(joke.flags || {}).some(Boolean);

  return joke.type === "twopart"
    && joke.safe !== false
    && !hasFlag
    && !EXCLUDED_TERMS.some((term) => text.includes(term));
}

function chooseJoke(data) {
  const jokes = Array.isArray(data.jokes) ? data.jokes : [data];
  const candidates = jokes.filter(isFamilyFriendly);
  const unseenCandidates = candidates.filter((joke) => joke.id !== lastJokeId);
  const selection = unseenCandidates.length > 0 ? unseenCandidates : candidates;

  if (selection.length === 0) {
    throw new Error("Aucune blague tout public disponible");
  }

  return selection[Math.floor(Math.random() * selection.length)];
}

export async function fetchJoke() {
  const response = await fetch(JOKE_API_URL);

  if (!response.ok) {
    throw new Error(`Erreur HTTP ${response.status}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(data.message || "Réponse inattendue de l'API");
  }

  const joke = chooseJoke(data);
  lastJokeId = joke.id;
  return joke;
}

export function resetJokeHistory() {
  lastJokeId = null;
}
