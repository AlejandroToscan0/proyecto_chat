# Proyecto Chat Distribuido

Sistema de chat en tiempo real con comunicación WebSocket, autenticación de administradores, gestión de salas y compartición de archivos.

## Características principales

- Chat en tiempo real con WebSocket (Socket.IO)
- Sistema de autenticación para administradores (JWT)
- Compartición de archivos (imágenes, PDF, documentos)
- Gestión de salas de chat con PIN de acceso
- Lista de usuarios conectados en tiempo real
- Panel de administración para gestionar salas
- Historial de mensajes persistente (MongoDB)

## Estructura del proyecto

```
proyecto_chat/
├── backend/                    # Servidor Flask + Socket.IO
│   ├── app.py                 # Servidor principal
│   ├── requirements.txt       # Dependencias Python
│   ├── uploads/              # Archivos subidos por usuarios
│   └── tests/                # Pruebas unitarias (pytest)
│       ├── test_app.py
│       └── test_endpoints.py
│
└── cliente/                   # Aplicación React
    ├── package.json          # Configuración y dependencias npm
    ├── public/              # Recursos estáticos
    └── src/                 # Código fuente
        ├── components/      # Componentes React
        │   ├── HomePage.js
        │   ├── ChatRoom.js
        │   ├── AdminLogin.js
        │   └── AdminDashboard.js
        └── __tests__/       # Pruebas unitarias (Jest + RTL)
            ├── HomePage.test.js
            ├── HomePage.advanced.test.js
            ├── ChatRoom.test.js
            ├── ChatRoom.advanced.test.js
            └── Admin.test.js
```

## Requisitos previos

- **Python 3.8+**
- **Node.js 16+** y npm
- **MongoDB Atlas** (o instancia local de MongoDB)

## Instalación y configuración

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd proyecto_chat
```

### 2. Configurar el Backend

#### Crear entorno virtual

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
```

#### Instalar dependencias

```bash
pip install -r requirements.txt
```

#### Configurar MongoDB

El proyecto requiere una conexión a MongoDB. Por seguridad, la URI se debe configurar como variable de entorno:

```bash
# Linux/macOS
export MONGO_URI="mongodb+srv://<usuario>:<password>@cluster0.ejemplo.mongodb.net/?retryWrites=true&w=majority"

# Windows (PowerShell)
$env:MONGO_URI="mongodb+srv://<usuario>:<password>@cluster0.ejemplo.mongodb.net/?retryWrites=true&w=majority"
```

**Nota:** Si no se configura `MONGO_URI`, el servidor arrancará sin conexión a la base de datos. Algunas funcionalidades estarán limitadas.

#### Ejecutar el servidor

```bash
python app.py
```

El servidor estará disponible en `http://localhost:5001`

### 3. Configurar el Cliente

#### Instalar dependencias

```bash
cd cliente
npm install
```

#### Ejecutar en modo desarrollo

```bash
npm start
```

La aplicación React se abrirá en `http://localhost:3000`

## Pruebas

El proyecto cuenta con una cobertura completa de pruebas unitarias tanto en backend como en frontend.

### Backend (pytest)

```bash
cd backend
source venv/bin/activate  # Activar entorno virtual
pytest tests/ -v
```

**Cobertura de pruebas (11 tests):**

- ✅ Validación de extensiones de archivos permitidas
- ✅ Endpoints REST sin conexión a base de datos
- ✅ Validación y verificación de tokens JWT
- ✅ Manejo de errores en upload de archivos
- ✅ Tests case-insensitive para extensiones
- ✅ Endpoints de administración (salas, historial)

**Archivos de prueba:**
- `tests/test_app.py` - Pruebas de funciones auxiliares y configuración
- `tests/test_endpoints.py` - Pruebas de endpoints REST y validaciones

### Frontend (Jest + React Testing Library)

```bash
cd cliente
npm test
```

**Cobertura de pruebas (26 tests):**

- ✅ **HomePage** (8 tests): Validaciones de PIN, nickname, flujo de unirse a sala, manejo de errores
- ✅ **ChatRoom** (12 tests): Renderizado de mensajes (texto, imágenes, archivos), envío de mensajes, lista de usuarios, eventos de socket
- ✅ **Admin** (5 tests): Login de administrador, dashboard, gestión de salas, visualización de historial
- ✅ **App** (1 test): Renderizado básico de la aplicación

**Archivos de prueba:**
- `src/__tests__/HomePage.test.js` - Pruebas básicas del componente HomePage
- `src/__tests__/HomePage.advanced.test.js` - Pruebas avanzadas con validaciones
- `src/__tests__/ChatRoom.test.js` - Pruebas básicas del componente ChatRoom
- `src/__tests__/ChatRoom.advanced.test.js` - Pruebas avanzadas con eventos de socket
- `src/__tests__/Admin.test.js` - Pruebas de componentes de administración

**Nota:** Todas las pruebas utilizan mocks para evitar dependencias externas (Socket.IO, axios, MongoDB).

## API Endpoints

### Autenticación de Admin

- `POST /admin/login` - Autenticación de administrador
  - Body: `{ "username": "admin", "password": "admin123" }`
  - Response: `{ "token": "JWT_TOKEN" }`

### Gestión de Salas (requiere token de admin)

- `GET /admin/salas` - Listar todas las salas
  - Headers: `{ "Authorization": "Bearer <token>" }`
  
- `GET /admin/salas/<pin>/historial` - Ver historial de mensajes de una sala
  - Headers: `{ "Authorization": "Bearer <token>" }`
  
- `DELETE /admin/salas/<pin>` - Eliminar una sala
  - Headers: `{ "Authorization": "Bearer <token>" }`

### Archivos

- `POST /upload` - Subir un archivo
  - Form-data: `file` (archivo), `roomPin` (PIN de la sala)
  - Extensiones permitidas: png, jpg, jpeg, gif, pdf, txt
  - Tamaño máximo: 10 MB
  
- `GET /uploads/<filename>` - Descargar/visualizar un archivo

## Eventos WebSocket

### Cliente → Servidor

- `join_room` - Unirse a una sala de chat
  - Data: `{ "room": "PIN", "nickname": "Usuario" }`

- `send_message` - Enviar un mensaje de texto
  - Data: `{ "room": "PIN", "message": "Texto del mensaje" }`

- `send_image` - Enviar una imagen
  - Data: `{ "room": "PIN", "imageUrl": "URL de la imagen" }`

- `send_file` - Enviar un archivo
  - Data: `{ "room": "PIN", "fileUrl": "URL del archivo", "fileName": "nombre.ext" }`

- `leave_room` - Salir de una sala
  - Data: `{ "room": "PIN" }`

### Servidor → Cliente

- `message` - Recibir un mensaje de texto
  - Data: `{ "user": "Usuario", "message": "Texto", "timestamp": "..." }`

- `image` - Recibir una imagen
  - Data: `{ "user": "Usuario", "imageUrl": "URL", "timestamp": "..." }`

- `file` - Recibir un archivo
  - Data: `{ "user": "Usuario", "fileUrl": "URL", "fileName": "nombre.ext", "timestamp": "..." }`

- `user_list` - Lista actualizada de usuarios en la sala
  - Data: `{ "users": ["Usuario1", "Usuario2", ...] }`

- `user_joined` - Notificación de nuevo usuario
  - Data: `{ "message": "Usuario se ha unido a la sala" }`

- `user_left` - Notificación de usuario que salió
  - Data: `{ "message": "Usuario ha salido de la sala" }`

## Tecnologías utilizadas

### Backend
- **Flask** - Framework web
- **Flask-SocketIO** - Comunicación WebSocket
- **Flask-CORS** - Manejo de CORS
- **Flask-Bcrypt** - Encriptación de contraseñas
- **PyMongo** - Cliente de MongoDB
- **PyJWT** - Tokens de autenticación
- **Gevent** - Servidor asíncrono
- **Pytest** - Framework de pruebas

### Frontend
- **React** - Librería de interfaz de usuario
- **Socket.IO Client** - Cliente WebSocket
- **Axios** - Cliente HTTP
- **Jest** - Framework de pruebas
- **React Testing Library** - Pruebas de componentes React

## Estructura de datos (MongoDB)

### Colección: salas

```javascript
{
  "_id": ObjectId("..."),
  "pin": "1234",
  "usuarios": ["Usuario1", "Usuario2"],
  "historial": [
    {
      "user": "Usuario1",
      "message": "Hola a todos",
      "timestamp": "2025-11-17T10:30:00Z"
    },
    {
      "user": "Usuario2",
      "imageUrl": "http://localhost:5001/uploads/imagen.jpg",
      "timestamp": "2025-11-17T10:31:00Z"
    }
  ]
}
```

### Colección: admins

```javascript
{
  "_id": ObjectId("..."),
  "username": "admin",
  "password_hash": "$2b$12$..."
}
```

## Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/NuevaCaracteristica`)
3. Commit tus cambios (`git commit -m 'Agregar nueva característica'`)
4. Push a la rama (`git push origin feature/NuevaCaracteristica`)
5. Abre un Pull Request

## Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.
