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

# --- Asegurar que `certifi` está instalado en el venv (instalación automática si falta)
# Esto ayuda a evitar errores SSL al conectar a MongoDB Atlas en macOS/entornos sin CA bundle actualizado.
if [ -x .venv/bin/python ]; then
  if ! .venv/bin/python -c "import certifi" >/dev/null 2>&1; then
    echo "certifi no encontrado en el venv. Instalando certifi..."
    if [ -x .venv/bin/pip ]; then
      .venv/bin/pip install --upgrade certifi
    else
      .venv/bin/python -m pip install --upgrade certifi
    fi
  fi

  # Intentar establecer SSL_CERT_FILE usando certifi (si está instalado ahora)
  CERT_PATH=$(.venv/bin/python -c "import certifi; print(certifi.where())" 2>/dev/null || true)
  if [ -n "$CERT_PATH" ]; then
    export SSL_CERT_FILE="$CERT_PATH"
    echo "Exportado SSL_CERT_FILE=$SSL_CERT_FILE"
  fi
fi

# Ejecutar servidor
if [ -x .venv/bin/python ]; then
  .venv/bin/python app.py
else
  python3 app.py
fi
