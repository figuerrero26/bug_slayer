// URLs de los microservicios — cambiar las IPs al desplegar en producción
export const AUTH_URL          = "http://localhost:8001";
export const DASHBOARD_URL     = "http://localhost:8002";
export const SEARCH_URL        = "http://localhost:8003";
export const NOTIFICATIONS_URL = "http://localhost:8004";

// Retrocompatibilidad con componentes que aún usen API_URL
export const API_URL = AUTH_URL;
export default API_URL;
