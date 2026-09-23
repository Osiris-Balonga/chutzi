import type { HumourTone, JokeTag, Locale, VettedJoke } from "../core/types.js";

type JokeSeed = readonly [
  conceptId: string,
  tone: HumourTone,
  tags: readonly JokeTag[],
  french: readonly [setup: string, delivery: string],
  english: readonly [setup: string, delivery: string]
];

const REVIEW = { status: "approved", policyVersion: 1, reviewedAt: "2026-09-23" } as const;

const seeds: readonly JokeSeed[] = [
  ["calendar-date", "safe", ["wordplay", "everyday"], ["Pourquoi le calendrier est-il toujours invité à dîner ?", "Parce qu'il a plein de dates."], ["Why is the calendar always invited to dinner?", "Because it has lots of dates."]],
  ["computer-windows", "safe", ["wordplay", "geek"], ["Pourquoi l'ordinateur a-t-il froid ?", "Parce qu'il a laissé ses fenêtres ouvertes."], ["Why was the computer cold?", "Because it left its Windows open."]],
  ["book-cover", "safe", ["wordplay", "everyday"], ["Pourquoi le livre avait-il froid ?", "Parce qu'il n'avait pas de couverture."], ["Why was the book cold?", "Because it had no cover."]],
  ["pencil-point", "safe", ["wordplay", "everyday"], ["Pourquoi le crayon était-il si sûr de lui ?", "Parce qu'il avait toujours un bon point."], ["Why was the pencil so confident?", "Because it always had a good point."]],
  ["bread-dough", "safe", ["wordplay", "everyday"], ["Pourquoi le boulanger sourit-il tout le temps ?", "Parce qu'il a la pâte."], ["Why did the baker smile all the time?", "Because he was rolling in dough."]],
  ["tea-time", "safe", ["wordplay", "everyday"], ["Que dit une tasse de thé à une autre tasse de thé ?", "On se voit à l'heure du thé."], ["What did one cup of tea say to the other?", "See you at tea time."]],
  ["sushi-roll", "playful", ["wordplay", "everyday"], ["Pourquoi le sushi raconte-t-il de bonnes blagues ?", "Parce qu'il a toujours un bon rouleau."], ["Why does sushi tell good jokes?", "Because it is always on a roll."]],
  ["clock-tick", "playful", ["wordplay", "everyday"], ["Pourquoi l'horloge a-t-elle été punie ?", "Parce qu'elle faisait trop de tic-tac."], ["Why was the clock in trouble?", "Because it kept making too much tick-tock."]],
  ["tomato-blush", "playful", ["absurd", "everyday"], ["Pourquoi la tomate est-elle devenue rouge ?", "Parce qu'elle a vu la salade se faire habiller."], ["Why did the tomato blush?", "Because it saw the salad dressing."]],
  ["cookie-doctor", "playful", ["absurd", "everyday"], ["Pourquoi le biscuit est-il allé chez le médecin ?", "Parce qu'il se sentait tout émietté."], ["Why did the cookie go to the doctor?", "Because it felt crummy."]],
  ["moon-homework", "playful", ["absurd", "geek"], ["Pourquoi la lune ne termine-t-elle jamais ses devoirs ?", "Parce qu'elle préfère les faire en phases."], ["Why does the moon never finish homework?", "Because it works in phases."]],
  ["robot-snack", "playful", ["geek", "absurd"], ["Quel est le goûter préféré d'un robot ?", "Des puces au chocolat."], ["What is a robot's favourite snack?", "Chocolate chips."]],
  ["ghost-elevator", "mischievous", ["gentle-spooky", "absurd"], ["Pourquoi le fantôme prend-il l'ascenseur ?", "Parce qu'il adore monter en l'air."], ["Why does the ghost take the elevator?", "Because it loves going up in the air."]],
  ["monster-homework", "mischievous", ["gentle-spooky", "everyday"], ["Pourquoi le petit monstre n'aime-t-il pas les devoirs ?", "Parce qu'ils lui donnent des frissons de calcul."], ["Why does the little monster dislike homework?", "Because math gives it number shivers."]],
  ["bat-library", "mischievous", ["gentle-spooky", "wordplay"], ["Pourquoi la chauve-souris chuchote-t-elle à la bibliothèque ?", "Parce qu'elle ne veut pas réveiller les histoires."], ["Why does the bat whisper in the library?", "Because it does not want to wake the stories."]],
  ["pumpkin-singer", "mischievous", ["gentle-spooky", "absurd"], ["Pourquoi la citrouille est-elle montée sur scène ?", "Parce qu'elle voulait faire son grand potiron."], ["Why did the pumpkin go on stage?", "Because it wanted a big squash hit."]],
  ["spider-web", "mischievous", ["gentle-spooky", "wordplay"], ["Pourquoi l'araignée adore-t-elle Internet ?", "Parce qu'elle s'y sent déjà chez elle."], ["Why does the spider love the internet?", "Because it already feels at home on the web."]],
  ["witch-broom", "mischievous", ["gentle-spooky", "absurd"], ["Pourquoi la sorcière range-t-elle toujours son balai ?", "Parce qu'elle aime quand ça vole propre."], ["Why does the witch always tidy her broom?", "Because she likes things flying neat."]]
];

function createJoke(
  conceptId: string,
  locale: Locale,
  tone: HumourTone,
  tags: readonly JokeTag[],
  content: readonly [string, string]
): VettedJoke {
  return {
    id: `${conceptId}-${locale}`,
    conceptId,
    locale,
    tone,
    tags,
    setup: content[0],
    delivery: content[1],
    safety: REVIEW
  };
}

export const JOKE_CATALOG: readonly VettedJoke[] = seeds.flatMap(([conceptId, tone, tags, french, english]) => [
  createJoke(conceptId, "fr", tone, tags, french),
  createJoke(conceptId, "en", tone, tags, english)
]);
