import { useCallback, useEffect, useState } from "react";
import {
  rentalRequestService,
  type RentalRequestListItem,
} from "@/services/rentalRequestService";

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
      setItems(normalized.slice(0, 6));
      setPendingCount(Number(result.pagination?.total ?? normalized.length));
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

    window.addEventListener("rental-requests-updated", onUpdated);
    const interval = window.setInterval(refresh, 60_000);

    return () => {
      window.removeEventListener("rental-requests-updated", onUpdated);
      window.clearInterval(interval);
    };
  }, [refresh]);

  return { pendingCount, items, loading, refresh };
}

export function notifyRentalRequestsUpdated() {
  window.dispatchEvent(new Event("rental-requests-updated"));
}
