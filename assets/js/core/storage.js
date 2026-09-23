export function readStoredValue(store, key, isValid) {
    const rawValue = store.getItem(key);
    if (rawValue === null) {
        return undefined;
    }
    try {
        const parsedValue = JSON.parse(rawValue);
        return isValid(parsedValue) ? parsedValue : undefined;
    }
    catch {
        return undefined;
    }
}
export function writeStoredValue(store, key, value) {
    store.setItem(key, JSON.stringify(value));
}
export function removeStoredValue(store, key) {
    store.removeItem(key);
}
