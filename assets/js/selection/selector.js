import { filterEligibleJokes } from "../catalog/catalog.js";
import { JOKE_CATALOG } from "../catalog/jokes.js";
import { readStoredValue, writeStoredValue } from "../core/storage.js";
const HISTORY_STORAGE_KEY = "chutzi-delivery-history-v1";
const HISTORY_VERSION = 1;
const MAX_HISTORY_LENGTH = 48;
function createEmptyHistory(catalogVersion) {
    return {
        version: HISTORY_VERSION,
        catalogVersion,
        recentConceptIds: [],
        byLocale: { en: [], fr: [] }
    };
}
function isConceptIdList(value) {
    return Array.isArray(value) && value.every((item) => typeof item === "string" && item.length > 0);
}
function isDeliveryHistory(value) {
    if (!value || typeof value !== "object") {
        return false;
    }
    const candidate = value;
    const localeHistory = candidate.byLocale;
    return candidate.version === HISTORY_VERSION
        && typeof candidate.catalogVersion === "string"
        && isConceptIdList(candidate.recentConceptIds)
        && Boolean(localeHistory)
        && isConceptIdList(localeHistory?.en)
        && isConceptIdList(localeHistory?.fr);
}
export function getCooldownLength(poolSize) {
    if (poolSize <= 1) {
        return 0;
    }
    return Math.min(8, Math.max(1, Math.ceil(poolSize * 0.45)));
}
function pickWeighted(jokes, tagWeights, random) {
    const weights = jokes.map((joke) => {
        const averagePreference = joke.tags.reduce((sum, tag) => sum + (tagWeights[tag] ?? 0), 0) / joke.tags.length;
        return Math.max(0.7, Math.min(1.3, 1 + averagePreference * 0.15));
    });
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let cursor = random() * totalWeight;
    for (let index = 0; index < jokes.length; index += 1) {
        cursor -= weights[index];
        if (cursor <= 0) {
            return jokes[index];
        }
    }
    return jokes.at(-1);
}
function selectCandidate(pool, history, options, random) {
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
            return pickWeighted(candidates, options.tagWeights ?? {}, random);
        }
    }
    return pickWeighted(protectedPool, options.tagWeights ?? {}, random);
}
function updateHistory(history, joke) {
    const moveToFront = (entries) => [
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
function queueKey(options) {
    const weightSignature = Object.entries(options.tagWeights ?? {})
        .sort(([first], [second]) => first.localeCompare(second))
        .map(([tag, weight]) => `${tag}:${weight}`)
        .join(",");
    return `${options.locale}:${options.tone}:${weightSignature}`;
}
export function createJokeSelector({ store, catalog = JOKE_CATALOG, catalogVersion = "1", random = Math.random }) {
    const storedHistory = readStoredValue(store, HISTORY_STORAGE_KEY, isDeliveryHistory);
    let history = storedHistory?.catalogVersion === catalogVersion
        ? storedHistory
        : createEmptyHistory(catalogVersion);
    const queue = new Map();
    function getPool(options) {
        return filterEligibleJokes(catalog, options.locale, options.tone);
    }
    function createSelection(options, excludedConceptIds = []) {
        const pool = getPool(options);
        if (pool.length === 0) {
            throw new Error(`No eligible local joke for ${options.locale}/${options.tone}`);
        }
        const remaining = pool.filter((joke) => !excludedConceptIds.includes(joke.conceptId));
        return selectCandidate(remaining.length > 0 ? remaining : pool, history, options, random);
    }
    function refillQueue(options, deliveredJoke) {
        const key = queueKey(options);
        const nextJoke = createSelection(options, [deliveredJoke.conceptId]);
        queue.set(key, [nextJoke]);
    }
    function next(options) {
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
