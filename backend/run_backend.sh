#!/usr/bin/env bash
set -euo pipefail

# Script sencillo para arrancar el backend desde el virtualenv del proyecto.
# - Copia .env.example a .env y edítalo si quieres persistir variables.
# - Este script exporta variables definidas en .env (líneas no comentadas).
# - Activa .venv si existe y ejecuta app.py.

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

# Cargar .env si existe (ignora líneas que empiezan con #)
if [ -f .env ]; then
  # shellcheck disable=SC2046
  export $(grep -v '^#' .env | xargs || true)
fi

# Activar virtualenv si está presente
if [ -f .venv/bin/activate ]; then
  # shellcheck disable=SC1091
  source .venv/bin/activate
fi

# Ejecutar servidor
if [ -x .venv/bin/python ]; then
  .venv/bin/python app.py
else
  python3 app.py
fi
