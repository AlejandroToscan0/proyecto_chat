# Proyecto Chat (Backend + Cliente)

Este repositorio contiene la parte backend (Flask + SocketIO) y el cliente (React).

## Estructura principal

- `backend/` — Servidor en Flask con Socket.IO
  - `app.py` — Servidor principal
  - `uploads/` — Archivos subidos por usuarios
  - `tests/` — Pruebas unitarias (pytest)
  - `requirements.txt` — Dependencias para el backend

- `cliente/` — Aplicación React
  - `src/` — Código fuente React
  - `src/__tests__/` — Pruebas unitarias (Jest + React Testing Library)
  - `package.json` — scripts y dependencias

## Requisitos

- Python 3.8+
- Node.js 16+ y npm

## Instalación y ejecución
### Backend (Flask)

1. Crear y activar un entorno virtual (recomendado):

```bash
python3 -m venv .venv
source .venv/bin/activate
```

2. Instalar dependencias:

```bash
pip install -r backend/requirements.txt
```

3. Ejecutar el servidor:

```bash
python backend/app.py
```

El servidor arranca por defecto en `http://localhost:5001` según la configuración del archivo.

Variables de entorno
--------------------

Este proyecto espera que la URI de MongoDB esté disponible en la variable de entorno `MONGO_URI`. Por seguridad no se deben dejar credenciales en el código fuente.

Ejemplo (macOS / Linux):

```bash
# exporta tu URI real antes de arrancar
export MONGO_URI="mongodb+srv://<usuario>:<password>@cluster0.ejemplo.mongodb.net/?retryWrites=true&w=majority"

# luego arranca con el python del venv
source backend/.venv/bin/activate
python backend/app.py
```

Si `MONGO_URI` no está definida el servidor se iniciará pero `client` quedará en `None` y algunas rutas que requieren DB devolverán errores 500. Para pruebas locales sin BD definida esto permite ejecutar el servidor sin acceso a MongoDB.

### Cliente (React)

1. Instalar dependencias:

```bash
cd cliente
npm install
```

2. Ejecutar la app en modo desarrollo:

```bash
npm start
```

La app de React arranca normalmente en `http://localhost:3000`.

## Ejecutar pruebas

### Backend

Desde la raíz del proyecto ejecutar:

```bash
# activar el entorno virtual
source backend/.venv/bin/activate

# ejecutar pruebas
pytest backend/tests/ -v
```

Las pruebas del backend (11 tests) cubren:
- Validación de archivos permitidos (`allowed_file`)
- Endpoints REST sin conexión a BD
- Validaciones de tokens y autorización
- Manejo de errores en upload de archivos
- Tests case-insensitive para extensiones

### Cliente

Desde `cliente/` ejecutar:

```bash
cd cliente
npm test
```

Las pruebas del cliente (26 tests) cubren:
- **HomePage**: Validaciones de PIN, nickname, flujo de unirse a sala
- **ChatRoom**: Renderizado de mensajes (texto, imágenes, archivos), envío de mensajes, lista de usuarios
- **Admin**: Componentes AdminLogin y AdminDashboard
- **App**: Renderizado básico de la aplicación

Todos los tests utilizan mocks para evitar dependencias externas (socket, axios, BD).

---
