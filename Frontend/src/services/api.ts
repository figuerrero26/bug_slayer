const isLocal = false; // cambiar a true para desarrollo local

const TEAM = {
  AUTH:      "/api/auth",
  DASH:      "/api/dashboard",
  SEARCH:    "/api/search",
  NOTIF:     "/api/notifications",
  ASSISTANT: "/api/assistant",
};

const LOCAL = {
  AUTH:      "http://localhost:8001",
  DASH:      "http://localhost:8002",
  SEARCH:    "http://localhost:8003",
  NOTIF:     "http://localhost:8004",
  ASSISTANT: "http://localhost:8006",
};

const CFG = isLocal ? LOCAL : TEAM;

export const AUTH_URL          = CFG.AUTH;
export const DASHBOARD_URL     = CFG.DASH;
export const SEARCH_URL        = CFG.SEARCH;
export const NOTIFICATIONS_URL = CFG.NOTIF;
export const ASSISTANT_URL     = CFG.ASSISTANT;

export const API_URL = AUTH_URL;
export default API_URL;
