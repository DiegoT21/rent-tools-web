import { useCallback, useEffect, useState } from "react";
import {
  rentalRequestService,
  type RentalRequestListItem,
} from "@/services/rentalRequestService";

const RENTAL_NOTIFICATIONS_SEEN_KEY = "rental-requests-seen-at";

export function markRentalRequestsSeen() {
  window.localStorage.setItem(RENTAL_NOTIFICATIONS_SEEN_KEY, String(Date.now()));
  window.dispatchEvent(new Event("rental-requests-seen"));
}

function getRentalNotificationsSeenAt() {
  const value = window.localStorage.getItem(RENTAL_NOTIFICATIONS_SEEN_KEY);
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getRequestExpiryTime(item: RentalRequestListItem) {
  const expiresAt = item.expiresAt ? new Date(item.expiresAt).getTime() : 0;
  if (expiresAt) return expiresAt;
  const createdAt = item.createdAt ? new Date(item.createdAt).getTime() : 0;
  return createdAt ? createdAt + 24 * 60 * 60 * 1000 : 0;
}

function isStillActive(item: RentalRequestListItem) {
  const expiryTime = getRequestExpiryTime(item);
  return expiryTime ? expiryTime > Date.now() : true;
}

export function useRentalNotifications(enabled: boolean) {
  const [pendingCount, setPendingCount] = useState(0);
  const [items, setItems] = useState<RentalRequestListItem[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setPendingCount(0);
      setItems([]);
      return;
    }

    setLoading(true);
    try {
      const result = await rentalRequestService.getReceived(1, "pending");
      const normalized = (result.data ?? []).map((item) =>
        rentalRequestService.normalizeForUi(item)
      );
      const active = normalized.filter(isStillActive);
      const seenAt = getRentalNotificationsSeenAt();
      const unseenCount = seenAt
        ? active.filter((item) => {
            const expiryTime = getRequestExpiryTime(item);
            return expiryTime > seenAt;
          }).length
        : active.length;
      setItems(active.slice(0, 6));
      setPendingCount(unseenCount);
    } catch {
      setPendingCount(0);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    refresh();

    const onUpdated = () => {
      void refresh();
    };
    const onSeen = () => {
      void refresh();
    };

    window.addEventListener("rental-requests-updated", onUpdated);
    window.addEventListener("rental-requests-seen", onSeen);
    const interval = window.setInterval(refresh, 60_000);

    return () => {
      window.removeEventListener("rental-requests-updated", onUpdated);
      window.removeEventListener("rental-requests-seen", onSeen);
      window.clearInterval(interval);
    };
  }, [refresh]);

  return { pendingCount, items, loading, refresh };
}

export function notifyRentalRequestsUpdated() {
  window.dispatchEvent(new Event("rental-requests-updated"));
}
