import React from 'react';
import { Loader2 } from 'lucide-react';
import axios from 'axios';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import {
  broadcastTokenUpdate,
  isJwtExpired,
  subscribeTokenUpdates,
  waitForAuthHydration,
} from '@/lib/sessionSync';

export function SessionBootstrap({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      await waitForAuthHydration();
      const token = useAuthStore.getState().accessToken;

      if (!token || isJwtExpired(token)) {
        try {
          const response = await api.post('/auth/refresh');
          const newToken = response.data?.data?.accessToken;
          if (newToken) {
            useAuthStore.getState().setAccessToken(newToken);
            broadcastTokenUpdate(newToken);
          }
        } catch (err) {
          if (axios.isAxiosError(err) && err.response?.status === 401) {
            useAuthStore.getState().clearSession();
          }
        }
      }

      if (!cancelled) setReady(true);
    })();

    const unsub = subscribeTokenUpdates((accessToken) => {
      useAuthStore.getState().setAccessToken(accessToken);
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f4f6]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
