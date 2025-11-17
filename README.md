## Proyecto: Chat en tiempo real (React + Flask + Socket.IO)

Este repositorio contiene una aplicación de chat en tiempo real con frontend en React y backend en Flask + Flask-SocketIO. El backend usa MongoDB Atlas para persistencia.

Contenido
- `cliente/` - aplicación frontend (Create React App).
- `backend/` - servidor Flask + Flask-SocketIO, subida de archivos, endpoints REST y conexión a MongoDB.
- `backend/.venv` - (opcional) virtualenv local usado para desarrollo.
- `backend/requirements.txt` - dependencias Python (generado con pip freeze).
- `backend/.env.example` - plantilla con variables de entorno.

Resumen rápido
- Frontend: http://localhost:3000
- Backend Socket/API: http://localhost:5001 (puerto por defecto)

Requisitos previos
- macOS, Linux o Windows con WSL
- Python 3.8+ (se usó Python 3.x)
- Node.js + npm
- Cuenta de MongoDB Atlas (opcional, se requiere para persistencia en la nube)

Instalación y configuración (desarrollo)

1) Clona el repo (si no lo has hecho):

```bash
git clone <tu-repo-url>
cd proyecto_chat
```

2) Backend — entorno Python

- Crear y activar un virtualenv (recomendado dentro de `backend`):

```bash
python3 -m venv backend/.venv
source backend/.venv/bin/activate
```

- Instalar dependencias:

```bash
pip install -r backend/requirements.txt
```

- Crear un fichero de entorno local basado en la plantilla y editarlo:

```bash
cp backend/.env.example backend/.env
# Edita backend/.env y rellena MONGO_URI y SECRET_KEY con tus valores
```

Nota: el repositorio incluye `backend/.env.example`. No cometas tu `.env`.

3) Frontend — Node.js

```bash
cd cliente
npm install
# para desarrollo
npm start
```

Ejecución

Backend (modo desarrollo simple):

```bash
# con el venv activo
python backend/app.py
```

O ejecutando con variables en línea (sin activar el venv):

```bash
MONGO_URI="<tu_uri>" SECRET_KEY="<tu_secreto>" ./backend/.venv/bin/python3 backend/app.py
```

Si quieres ejecutar el backend en segundo plano (nohup):

```bash
nohup ./backend/.venv/bin/python3 backend/app.py > backend/server.log 2>&1 &
echo "PID: $!"
```

Detener procesos que ocupen un puerto (ej. 5001):

```bash
lsof -iTCP:5001 -sTCP:LISTEN -n -P
kill <PID>
```

Puertos
- Frontend: 3000
- Backend: 5001 por defecto (revisa `backend/app.py` si lo cambias)

Conexión a MongoDB Atlas

- Crea una base de datos/usuario en MongoDB Atlas y añade la(s) IP(s) permitidas (Network Access > IP Whitelist). Para desarrollo puedes añadir tu IP pública o 0.0.0.0/0 temporalmente (no recomendado en producción).
- En `backend/.env` establece `MONGO_URI` con la cadena de conexión proporcionada por Atlas.

Seguridad y buenas prácticas

- Nunca comites claves ni URIs sensibles. Usa `.env` local y mantenlo en `.gitignore`.
- `backend/.env.example` está en el repo para documentar qué variables son necesarias.
- En producción, maneja secretos con un gestor (Vault, Secrets Manager, variables del servicio), y no uses los fallbacks incluidos en `app.py`.

Notas técnicas importantes

- `backend/app.py` está configurado para leer `MONGO_URI` y `SECRET_KEY` desde variables de entorno con valores por defecto para desarrollo. Revisa y cambia según tu entorno.
- El servidor Socket.IO usa `gevent` como async_mode. El reloader de Flask/Werkzeug puede causar errores con gevent; por esa razón el proyecto arranca `socketio.run(..., debug=False, use_reloader=False)` en el entrypoint para evitar el problema `AssertionError` relacionado con forks.

Problemas comunes y soluciones

- Error: ModuleNotFoundError: No module named 'gevent'
  - Asegúrate de activar el venv e instalar requirements: `source backend/.venv/bin/activate && pip install -r backend/requirements.txt`.

- Error: OSError: [Errno 48] Address already in use
  - Revisa qué proceso usa el puerto y mátalo: `lsof -iTCP:5001 -sTCP:LISTEN -n -P` y `kill <PID>`.

- Problema al activar el venv: `Permission denied` al ejecutar `backend/.venv/bin/activate`
  - Usa `source backend/.venv/bin/activate`, no ejecutes el script directamente.

Despliegue básico

Para desplegar en un servidor (ej. VPS), un flujo típico puede ser:

1. Clonar repo en el servidor
2. Crear virtualenv y pip install -r backend/requirements.txt
3. Configurar variables de entorno (systemd, docker, entorno del proveedor)
4. Ejecutar el servicio con un process manager (systemd, supervisor) o dentro de Docker

Notas sobre git

- Para subir a un remote (GitHub/GitLab):

```bash
git remote add origin <url-del-repo>
git push -u origin main
```

Soporte y siguientes pasos recomendados
- Añadir tests unitarios básicos para endpoints y lógica de negocio.
- Evaluar usar Docker para desarrollo y despliegue reproducible.
- Integrar CI para ejecutar linter/tests antes de push.

CI / Tests
----------------
He añadido pruebas unitarias para el backend (endpoints REST y eventos WebSocket) y un workflow de GitHub Actions
que ejecuta pytest en `backend/tests` al hacer push o abrir Pull Requests en `main`.

Cómo ejecutar los tests localmente:

```bash
# activar venv
source backend/.venv/bin/activate
# instalar pytest si no está (ya debería estar en requirements)
pip install pytest
# ejecutar todos los tests del backend
pytest backend/tests -q
```

Qué incluyen las pruebas
- Tests REST: creación de admin, login, creación/listado/eliminación de salas. Se usan colecciones en memoria (mock)
  para no depender de MongoDB Atlas.
- Tests WebSocket: conexión con `socketio.test_client`, evento `join_room` y `send_message` verificando que
  los mensajes se agregan a la sala en memoria.

GitHub Actions
----------------
Workflow creado: `.github/workflows/python-app.yml`.
Qué hace:
- En push/PR a `main` instala dependencias desde `backend/requirements.txt` y ejecuta `pytest backend/tests`.

Notas
- El workflow en CI no necesita un MongoDB real porque las pruebas usan mocks/colecciones en memoria. En caso de
  que añadas tests que sí dependan de MongoDB puedes configurar un servicio de MongoDB en el workflow.

Contacto
- Si quieres, puedo:
  - Añadir un `Procfile` / `systemd` unit example para ejecutar el backend en producción.
  - Configurar una pipeline CI mínima (GitHub Actions) para tests y linters.

Gracias — si quieres que haga alguno de los siguientes pasos (añadir `Procfile`, push al remote, crear Dockerfile, configurar systemd o GitHub Actions), dime cuál y lo implemento.
