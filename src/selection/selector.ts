import { filterEligibleJokes } from "../catalog/catalog.js";
import { JOKE_CATALOG } from "../catalog/jokes.js";
import { readStoredValue, writeStoredValue, type KeyValueStore } from "../core/storage.js";
import type { HumourTone, Locale, VettedJoke } from "../core/types.js";

const HISTORY_STORAGE_KEY = "chutzi-delivery-history-v1";
const HISTORY_VERSION = 1;
const MAX_HISTORY_LENGTH = 48;

interface DeliveryHistory {
  readonly version: 1;
  readonly catalogVersion: string;
  readonly recentConceptIds: readonly string[];
  readonly byLocale: Record<Locale, readonly string[]>;
}

export interface SelectionOptions {
  readonly locale: Locale;
  readonly tone: HumourTone;
}

export interface JokeSelectorOptions {
  readonly store: KeyValueStore;
  readonly catalog?: readonly VettedJoke[];
  readonly catalogVersion?: string;
  readonly random?: () => number;
}

function createEmptyHistory(catalogVersion: string): DeliveryHistory {
  return {
    version: HISTORY_VERSION,
    catalogVersion,
    recentConceptIds: [],
    byLocale: { en: [], fr: [] }
  };
}

function isConceptIdList(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string" && item.length > 0);
}

function isDeliveryHistory(value: unknown): value is DeliveryHistory {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<DeliveryHistory>;
  const localeHistory = candidate.byLocale;
  return candidate.version === HISTORY_VERSION
    && typeof candidate.catalogVersion === "string"
    && isConceptIdList(candidate.recentConceptIds)
    && Boolean(localeHistory)
    && isConceptIdList(localeHistory?.en)
    && isConceptIdList(localeHistory?.fr);
}

export function getCooldownLength(poolSize: number): number {
  if (poolSize <= 1) {
    return 0;
  }

  return Math.min(8, Math.max(1, Math.ceil(poolSize * 0.45)));
}

function pickRandom(jokes: readonly VettedJoke[], random: () => number): VettedJoke {
  return jokes[Math.min(jokes.length - 1, Math.floor(random() * jokes.length))];
}

function selectCandidate(
  pool: readonly VettedJoke[],
  history: DeliveryHistory,
  random: () => number
): VettedJoke {
  const cooldown = getCooldownLength(pool.length);
  const recent = history.recentConceptIds.slice(0, cooldown);
  const lastConceptId = history.recentConceptIds[0];
  const alternatives = lastConceptId
    ? pool.filter((joke) => joke.conceptId !== lastConceptId)
    : pool;
  const protectedPool = alternatives.length > 0 ? alternatives : pool;

  for (let blockedCount = recent.length; blockedCount >= 0; blockedCount -= 1) {
    const blockedConcepts = new Set(recent.slice(0, blockedCount));
    const candidates = protectedPool.filter((joke) => !blockedConcepts.has(joke.conceptId));
    if (candidates.length > 0) {
      return pickRandom(candidates, random);
    }
  }

  return pickRandom(protectedPool, random);
}

function updateHistory(history: DeliveryHistory, joke: VettedJoke): DeliveryHistory {
  const moveToFront = (entries: readonly string[]) => [
    joke.conceptId,
    ...entries.filter((conceptId) => conceptId !== joke.conceptId)
  ].slice(0, MAX_HISTORY_LENGTH);

  return {
    ...history,
    recentConceptIds: moveToFront(history.recentConceptIds),
    byLocale: {
      ...history.byLocale,
      [joke.locale]: moveToFront(history.byLocale[joke.locale])
    }
  };
}

function queueKey(options: SelectionOptions): string {
  return `${options.locale}:${options.tone}`;
}

export function createJokeSelector({
  store,
  catalog = JOKE_CATALOG,
  catalogVersion = "1",
  random = Math.random
}: JokeSelectorOptions) {
  const storedHistory = readStoredValue(store, HISTORY_STORAGE_KEY, isDeliveryHistory);
  let history = storedHistory?.catalogVersion === catalogVersion
    ? storedHistory
    : createEmptyHistory(catalogVersion);
  const queue = new Map<string, VettedJoke[]>();

  function getPool(options: SelectionOptions): readonly VettedJoke[] {
    return filterEligibleJokes(catalog, options.locale, options.tone);
  }

  function createSelection(options: SelectionOptions, excludedConceptIds: readonly string[] = []): VettedJoke {
    const pool = getPool(options);
    if (pool.length === 0) {
      throw new Error(`No eligible local joke for ${options.locale}/${options.tone}`);
    }

    const remaining = pool.filter((joke) => !excludedConceptIds.includes(joke.conceptId));
    return selectCandidate(remaining.length > 0 ? remaining : pool, history, random);
  }

  function refillQueue(options: SelectionOptions, deliveredJoke: VettedJoke): void {
    const key = queueKey(options);
    const nextJoke = createSelection(options, [deliveredJoke.conceptId]);
    queue.set(key, [nextJoke]);
  }

  function next(options: SelectionOptions): VettedJoke {
    const key = queueKey(options);
    const queued = queue.get(key)?.shift();
    const joke = queued ?? createSelection(options);
    history = updateHistory(history, joke);
    writeStoredValue(store, HISTORY_STORAGE_KEY, history);
    refillQueue(options, joke);
    return joke;
  }

  return {
    clearQueue: () => queue.clear(),
    getHistory: () => history,
    next
  };
}
