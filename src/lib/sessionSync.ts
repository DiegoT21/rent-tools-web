import { useAuthStore } from '../store/authStore';

const CHANNEL_NAME = 'renttools-auth-sync';
const REFRESH_LOCK_KEY = 'renttools-refresh-lock';
const LOCK_TTL_MS = 30_000;

export function isJwtExpired(token: string, skewSeconds = 60): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (typeof payload.exp !== 'number') return true;
    return payload.exp * 1000 < Date.now() + skewSeconds * 1000;
  } catch {
    return true;
  }
}

export function broadcastTokenUpdate(accessToken: string) {
  try {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage({ type: 'token', accessToken });
    channel.close();
  } catch {
    /* BroadcastChannel not available */
  }
}

export function subscribeTokenUpdates(onToken: (token: string) => void) {
  try {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = (event) => {
      if (event.data?.type === 'token' && event.data.accessToken) {
        onToken(event.data.accessToken);
      }
    };
    return () => channel.close();
  } catch {
    return () => undefined;
  }
}

/** Solo una pestaña refresca el token a la vez. */
export async function withRefreshLock<T>(fn: () => Promise<T>): Promise<T | null> {
  const now = Date.now();
  const raw = localStorage.getItem(REFRESH_LOCK_KEY);
  if (raw) {
    try {
      const { until } = JSON.parse(raw) as { until: number };
      if (until > now) return null;
    } catch {
      /* ignore */
    }
  }

  localStorage.setItem(REFRESH_LOCK_KEY, JSON.stringify({ until: now + LOCK_TTL_MS }));
  try {
    return await fn();
  } finally {
    localStorage.removeItem(REFRESH_LOCK_KEY);
  }
}

export function waitForAuthHydration(): Promise<void> {
  return new Promise((resolve) => {
    if (useAuthStore.persist.hasHydrated()) {
      resolve();
      return;
    }
    useAuthStore.persist.onFinishHydration(() => resolve());
  });
}
