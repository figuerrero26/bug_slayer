import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const IDLE_MS = 20 * 60 * 1_000; // 20 minutos

const EVENTS: (keyof WindowEventMap)[] = [
  "mousemove",
  "keydown",
  "scroll",
  "touchstart",
];

export function useIdleLogout() {
  const navigate = useNavigate();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function logout() {
      sessionStorage.removeItem("session");
      localStorage.removeItem("token");
      window.dispatchEvent(new Event("ua-session-change"));
      navigate("/login?expired=1", { replace: true });
    }

    function reset() {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(logout, IDLE_MS);
    }

    reset();
    EVENTS.forEach((ev) => window.addEventListener(ev, reset, { passive: true }));

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      EVENTS.forEach((ev) => window.removeEventListener(ev, reset));
    };
  }, [navigate]);
}
