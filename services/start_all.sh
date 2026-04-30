#!/bin/bash
# Levanta los 4 microservicios en background.
# Uso: bash services/start_all.sh
# Requiere que cada servicio tenga su virtualenv activado o las dependencias instaladas.

ROOT=$(dirname "$0")

echo "Iniciando auth_service        en puerto 8001..."
(cd "$ROOT/auth_service"          && uvicorn main:app --reload --port 8001) &

echo "Iniciando dashboard_service   en puerto 8002..."
(cd "$ROOT/dashboard_service"     && uvicorn main:app --reload --port 8002) &

echo "Iniciando search_service      en puerto 8003..."
(cd "$ROOT/search_service"        && uvicorn main:app --reload --port 8003) &

echo "Iniciando notifications_service en puerto 8004..."
(cd "$ROOT/notifications_service" && uvicorn main:app --reload --port 8004) &

echo ""
echo "Todos los servicios corriendo. Ctrl+C para detenerlos."
wait
