export function readStoredValue(store, key, isValid) {
    try {
        const rawValue = store.getItem(key);
        if (rawValue === null) {
            return undefined;
        }
        const parsedValue = JSON.parse(rawValue);
        return isValid(parsedValue) ? parsedValue : undefined;
    }
    catch {
        return undefined;
    }
}
export function writeStoredValue(store, key, value) {
    try {
        store.setItem(key, JSON.stringify(value));
        return true;
    }
    catch {
        return false;
    }
}
export function removeStoredValue(store, key) {
    try {
        store.removeItem(key);
        return true;
    }
    catch {
        return false;
    }
}
