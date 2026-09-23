export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type ValueGuard<T> = (value: unknown) => value is T;

export function readStoredValue<T>(
  store: KeyValueStore,
  key: string,
  isValid: ValueGuard<T>
): T | undefined {
  const rawValue = store.getItem(key);

  if (rawValue === null) {
    return undefined;
  }

  try {
    const parsedValue: unknown = JSON.parse(rawValue);
    return isValid(parsedValue) ? parsedValue : undefined;
  } catch {
    return undefined;
  }
}

export function writeStoredValue<T>(store: KeyValueStore, key: string, value: T): void {
  store.setItem(key, JSON.stringify(value));
}

export function removeStoredValue(store: KeyValueStore, key: string): void {
  store.removeItem(key);
}
