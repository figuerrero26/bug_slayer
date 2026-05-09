import type { UserSession } from "../interfaces/user";

export function getSession(): UserSession | null {
  try {
    const raw = sessionStorage.getItem("session");
    return raw ? (JSON.parse(raw) as UserSession) : null;
  } catch {
    return null;
  }
}
