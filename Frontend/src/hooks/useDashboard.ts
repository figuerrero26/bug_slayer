import { useState, useEffect } from "react";
import type { User } from "../interfaces/user";
import type { DashboardData } from "../interfaces/dashboard";
import { DASHBOARD_URL } from "../services/api";

export function useDashboard(userId: number | null, email: string) {
  const [user, setUser]           = useState<User | null>(null);
  const [confCount, setConfCount] = useState(0);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }

    const ctrl = new AbortController();

    fetch(`${DASHBOARD_URL}/dashboard/${userId}`, { signal: ctrl.signal })
      .then((res) => {
        if (!res.ok) throw new Error("Error al cargar el dashboard");
        return res.json() as Promise<DashboardData>;
      })
      .then((data) => {
        setUser({
          id:          data.user_id,
          name:        data.full_name,
          email,
          phone:       data.phone,
          city:        data.country_city,
          country:     data.country_city,
          birthdate:   data.birth_date
            ? new Date(data.birth_date).toLocaleDateString("es-CO")
            : "—",
          birthdateRaw: data.birth_date ? data.birth_date.substring(0, 10) : "",
          registeredAt: data.registered_at
            ? new Date(data.registered_at).toLocaleString("es-CO", {
                day: "2-digit", month: "short", year: "numeric",
                hour: "2-digit", minute: "2-digit", hour12: true,
              })
            : "—",
        });
        setConfCount(data.conferences.length);
      })
      .catch((err) => { if (err.name !== "AbortError") console.error("[useDashboard]", err); })
      .finally(() => setLoading(false));

    return () => ctrl.abort();
  }, [userId]);

  const handleUserSaved = (updated: Partial<User>) =>
    setUser((prev) => (prev ? { ...prev, ...updated } : prev));

  return { user, confCount, loading, handleUserSaved };
}
