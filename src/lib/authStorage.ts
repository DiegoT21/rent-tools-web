export const REMEMBER_ME_KEY = "auth-remember-me";
export const AUTH_STORAGE_KEY = "auth-storage";

export function isRememberMeEnabled(): boolean {
  return localStorage.getItem(REMEMBER_ME_KEY) !== "false";
}

export function setRememberMePreference(remember: boolean): void {
  localStorage.setItem(REMEMBER_ME_KEY, remember ? "true" : "false");
  if (remember) {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

export function getAuthStorage(): Storage {
  return isRememberMeEnabled() ? localStorage : sessionStorage;
}

export function clearAuthStorage(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
}

/** Lee de ambos storages (migración) y escribe solo en el activo. */
export const authPersistStorage = {
  getItem: (name: string): string | null => {
    const primary = getAuthStorage().getItem(name);
    if (primary) return primary;
    const fallback = getAuthStorage() === localStorage ? sessionStorage : localStorage;
    return fallback.getItem(name);
  },
  setItem: (name: string, value: string): void => {
    const storage = getAuthStorage();
    storage.setItem(name, value);
    const other = storage === localStorage ? sessionStorage : localStorage;
    other.removeItem(name);
  },
  removeItem: (name: string): void => {
    localStorage.removeItem(name);
    sessionStorage.removeItem(name);
  },
};
