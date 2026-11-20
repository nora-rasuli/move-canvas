type BrowserStorage = "local" | "session";

function storageFor(kind: BrowserStorage) {
  if (typeof window === "undefined") return null;
  return kind === "local" ? window.localStorage : window.sessionStorage;
}

export function readBrowserStorage(kind: BrowserStorage, key: string) {
  try {
    return storageFor(kind)?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function writeBrowserStorage(kind: BrowserStorage, key: string, value: string) {
  try {
    storageFor(kind)?.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function removeBrowserStorage(kind: BrowserStorage, key: string) {
  try {
    storageFor(kind)?.removeItem(key);
  } catch {
    // Storage may be disabled; absence is already the desired state.
  }
}
