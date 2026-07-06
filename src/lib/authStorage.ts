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
