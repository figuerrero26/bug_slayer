import { useState, useEffect } from "react";
import { NOTIFICATIONS_URL } from "../services/api";

export function useNotifications(userId: number | null) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;
    const ctrl = new AbortController();
    fetch(`${NOTIFICATIONS_URL}/notifications/unread/${userId}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => setUnreadCount(d.unread_count ?? 0))
      .catch(() => {});
    return () => ctrl.abort();
  }, [userId]);

  return { unreadCount, setUnreadCount };
}
