# Proyecto C- 📝 Historial de mensajes persistente (MongoDB)

## Arquitectura del Sistema

### Arquitectura General

El sistema sigue una arquitectura **cliente-servidor** con comunicación bidireccional en tiempo real:

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENTE (React)                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   HomePage   │  │   ChatRoom   │  │    Admin     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│         │                  │                  │                 │
│         └──────────────────┼──────────────────┘                 │
│                            │                                     │
│                    ┌───────▼────────┐                          │
│                    │  Socket.IO     │                          │
│                    │  Client        │                          │
│                    └───────┬────────┘                          │
└────────────────────────────┼──────────────────────────────────┘
                             │
                    WebSocket│HTTP/REST
                             │
┌────────────────────────────▼──────────────────────────────────┐
│                  SERVIDOR (Flask + SocketIO)                   │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                    Flask Application                      │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │ │
│  │  │  REST API  │  │  WebSocket │  │   Upload   │         │ │
│  │  │ Endpoints  │  │  Handlers  │  │  Manager   │         │ │
│  │  └────────────┘  └────────────┘  └────────────┘         │ │
│  └─────────────┬────────────┬────────────┬──────────────────┘ │
│                │            │            │                     │
│         ┌──────▼──────┐ ┌──▼───┐  ┌────▼─────┐              │
│         │  JWT Auth   │ │CORS  │  │ Bcrypt   │              │
│         └─────────────┘ └──────┘  └──────────┘              │
└────────────────────────┬──────────────────────────────────────┘
                         │
                         │
                ┌────────▼─────────┐
                │  MongoDB Atlas   │
                │                  │
                │  ┌────────────┐  │
                │  │   salas    │  │
                │  └────────────┘  │
                │  ┌────────────┐  │
                │  │   admins   │  │
                │  └────────────┘  │
                └──────────────────┘
```

### Componentes Principales

#### 1. Frontend (React)

**Componentes:**
- **HomePage**: Punto de entrada, validación de PIN y nickname
- **ChatRoom**: Sala de chat principal con mensajería en tiempo real
- **AdminLogin**: Autenticación de administradores
- **AdminDashboard**: Panel de control para gestión de salas

**Tecnologías:**
- React 18.2.0
- Socket.IO Client 4.5.4
- Axios (HTTP requests)
- React Testing Library

#### 2. Backend (Flask + Socket.IO)

**Capas:**

1. **Capa de Presentación**
   - Endpoints REST para administración
   - WebSocket handlers para comunicación en tiempo real
   - Middleware de autenticación JWT

2. **Capa de Negocio**
   - Gestión de salas de chat
   - Validación de usuarios y permisos
   - Procesamiento de archivos
   - Administración de sesiones

3. **Capa de Datos**
   - Conexión a MongoDB Atlas
   - Gestión de colecciones (salas, admins)
   - Persistencia de mensajes e historial

**Tecnologías:**
- Flask 3.1.2
- Flask-SocketIO 5.5.1
- Gevent (servidor asíncrono)
- PyMongo 4.15.4
- JWT para autenticación
- Bcrypt para encriptación

#### 3. Base de Datos (MongoDB)

**Colecciones:**

```javascript
// Colección: salas
{
  "_id": ObjectId("..."),
  "id_sala": "ABC123",
  "pin": "1234",
  "tipo": "Multimedia",
  "usuarios_conectados": ["user1", "user2"],
  "mensajes": [
    {
      "nickname": "user1",
      "tipo": "texto|archivo",
      "contenido": "...",
      "url": "...",  // solo para archivos
      "timestamp": "2025-11-17T10:30:00Z"
    }
  ]
}

// Colección: admins
{
  "_id": ObjectId("..."),
  "usuario": "admin",
  "password": "$2b$12$..." // hash bcrypt
}
```

### Flujo de Comunicación

#### 1. Conexión de Usuario

```
Cliente                    Servidor                    MongoDB
  │                          │                           │
  │──join_room(pin,nick)────>│                           │
  │                          │──find(pin)───────────────>│
  │                          │<─sala encontrada──────────│
  │                          │──update(añadir usuario)──>│
  │<─chat_history────────────│                           │
  │<─user_list───────────────│                           │
  │<─new_message(bienvenida)─│                           │
```

#### 2. Envío de Mensaje

```
Cliente                    Servidor                    MongoDB
  │                          │                           │
  │──send_message(texto)────>│                           │
  │                          │──update(push mensaje)────>│
  │                          │──emit(broadcast)─────────>│
  │<─new_message─────────────│                           │
  │                          │                           │
```

#### 3. Subida de Archivo

```
Cliente                    Servidor                    MongoDB
  │                          │                           │
  │──POST /upload(file)─────>│                           │
  │                          │──validar extensión        │
  │                          │──guardar en /uploads      │
  │                          │──update(push mensaje)────>│
  │                          │──emit(new_message)───────>│
  │<─file_url────────────────│                           │
```

### Seguridad

1. **Autenticación JWT**: Tokens con expiración de 8 horas para administradores
2. **Bcrypt**: Hashing de contraseñas con factor de costo 12
3. **CORS**: Configurado para permitir solo orígenes específicos
4. **Validación de Archivos**: 
   - Extensiones permitidas: png, jpg, jpeg, gif, pdf, txt
   - Tamaño máximo: 10 MB
5. **Sanitización**: Uso de `secure_filename` para nombres de archivo

## Estructura del proyecto Distribuido

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

#### Explicación Detallada de Pruebas Backend

**`tests/test_app.py`** (2 tests):

1. **`test_allowed_file`**
   - **Propósito**: Verificar que la función `allowed_file()` valida correctamente las extensiones permitidas
   - **Qué prueba**: 
     - ✅ Acepta archivos con extensiones válidas: `.png`, `.pdf`
     - ❌ Rechaza archivos con extensiones prohibidas: `.exe`
   - **Importancia**: Previene la subida de archivos maliciosos al servidor

2. **`test_serve_nonexistent_file`**
   - **Propósito**: Validar manejo de errores al solicitar archivos inexistentes
   - **Qué prueba**: 
     - El endpoint `/uploads/<filename>` retorna 404 para archivos que no existen
   - **Importancia**: Asegura respuestas HTTP apropiadas y previene exposición de errores del servidor

**`tests/test_endpoints.py`** (9 tests):

1. **`test_setup_admin_without_db`**
   - **Propósito**: Verificar comportamiento del endpoint de configuración sin base de datos
   - **Qué prueba**: 
     - `/api/setup-admin` retorna error 500 cuando MongoDB no está conectado
     - Mensaje de error apropiado: "Base de datos no conectada"
   - **Importancia**: Validar degradación controlada del sistema sin BD

2. **`test_admin_login_without_db`**
   - **Propósito**: Probar autenticación de admin sin acceso a la base de datos
   - **Qué prueba**: 
     - `/api/admin-login` retorna 500 cuando no hay conexión a MongoDB
     - Payload con credenciales no causa crash del servidor
   - **Importancia**: Garantizar que fallos de BD no comprometen estabilidad

3. **`test_crear_sala_sin_token`**
   - **Propósito**: Validar protección de endpoints administrativos
   - **Qué prueba**: 
     - `/api/crear-sala` retorna 401 (Unauthorized) sin header de Authorization
     - Mensaje de error: "Token de autorización requerido"
   - **Importancia**: Seguridad - solo admins autenticados pueden crear salas

4. **`test_crear_sala_tipo_invalido`**
   - **Propósito**: Verificar validación de parámetros en creación de salas
   - **Qué prueba**: 
     - Envío de tipo de sala no válido ("Invalido") es rechazado
     - Sistema no crea salas con configuraciones incorrectas
   - **Importancia**: Integridad de datos - solo tipos válidos (Texto, Multimedia)

5. **`test_upload_without_db`**
   - **Propósito**: Probar endpoint de subida de archivos sin base de datos
   - **Qué prueba**: 
     - `/api/upload` retorna 500 cuando MongoDB no está disponible
   - **Importancia**: Evitar pérdida de archivos si no se pueden registrar en BD

6. **`test_upload_sin_session_valida`**
   - **Propósito**: Validar seguridad del upload de archivos
   - **Qué prueba**: 
     - Upload requiere un `socket_id` válido registrado en `user_sessions`
     - Retorna 401 con mensaje "No autorizado" para sesiones inexistentes
   - **Importancia**: Solo usuarios conectados pueden subir archivos

7. **`test_allowed_file_extensiones_validas`**
   - **Propósito**: Verificación exhaustiva de extensiones permitidas
   - **Qué prueba**: 
     - `.png`, `.jpg`, `.jpeg`, `.gif`, `.pdf`, `.txt` son aceptados
   - **Importancia**: Lista blanca de extensiones seguras

8. **`test_allowed_file_extensiones_invalidas`**
   - **Propósito**: Verificar rechazo de archivos potencialmente peligrosos
   - **Qué prueba**: 
     - `.exe`, `.sh`, `.bat`, `.docx` son rechazados
     - Archivos sin extensión son rechazados
   - **Importancia**: Bloqueo de ejecutables y scripts maliciosos

9. **`test_allowed_file_case_insensitive`**
   - **Propósito**: Validar que mayúsculas/minúsculas no afectan validación
   - **Qué prueba**: 
     - `test.PNG`, `test.PDF`, `test.TxT` son aceptados igual que minúsculas
   - **Importancia**: Experiencia de usuario - no depender de case del sistema operativo

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

#### Explicación Detallada de Pruebas Frontend

**`src/__tests__/HomePage.test.js`** (2 tests básicos):

1. **`renderiza input de PIN y botón admin`**
   - **Propósito**: Verificar que elementos esenciales de la UI se renderizan
   - **Qué prueba**: 
     - Input con placeholder "PIN de la Sala" está presente
     - Botón "Iniciar Sesión (Admin)" está visible
   - **Importancia**: Garantizar que la interfaz principal está accesible

2. **`muestra error cuando el PIN no tiene 4 dígitos`**
   - **Propósito**: Validar retroalimentación de error al usuario
   - **Qué prueba**: 
     - Ingresar PIN inválido (ej: "123") y enviar form
     - Mensaje "El PIN debe tener exactamente 4 números." aparece
   - **Importancia**: UX - usuario sabe por qué su entrada fue rechazada

**`src/__tests__/HomePage.advanced.test.js`** (6 tests avanzados):

1. **`permite solo números en el campo PIN`**
   - **Propósito**: Verificar validación de entrada en tiempo real
   - **Qué prueba**: 
     - Intentar ingresar letras ("abcd") → campo permanece vacío
     - Ingresar números ("1234") → aceptado correctamente
   - **Importancia**: Prevenir entradas inválidas antes de envío

2. **`limita el PIN a 4 dígitos máximo`**
   - **Propósito**: Validar restricción de longitud del PIN
   - **Qué prueba**: 
     - Input tiene atributo `maxLength="4"`
     - No se pueden ingresar más de 4 caracteres
   - **Importancia**: Consistencia con formato de PIN del sistema

3. **`muestra paso de nickname después de PIN válido`**
   - **Propósito**: Verificar flujo de navegación multistep
   - **Qué prueba**: 
     - Después de enviar PIN válido ("1234")
     - Input de Nickname aparece en pantalla
   - **Importancia**: Flujo de usuario intuitivo paso a paso

4. **`muestra error si nickname está vacío`**
   - **Propósito**: Validar que nickname es obligatorio
   - **Qué prueba**: 
     - Completar paso 1 (PIN válido)
     - Intentar enviar nickname vacío
     - Mensaje de error "Debes ingresar un nickname" aparece
   - **Importancia**: Evitar usuarios anónimos en el chat

5. **`emite join_room con PIN y nickname correctos`**
   - **Propósito**: Verificar integración con Socket.IO
   - **Qué prueba**: 
     - Completar ambos pasos (PIN "9999", nickname "TestUser")
     - `socket.emit` fue llamado con evento `join_room` y datos correctos
   - **Importancia**: Asegurar comunicación correcta con backend

6. **Tests adicionales no mostrados pero presentes**:
   - Validación de longitud máxima de nickname
   - Manejo de respuestas del servidor (sala no encontrada)

**`src/__tests__/ChatRoom.test.js`** (2 tests básicos):

1. **`muestra mensajes y preview de imagen cuando es imagen`**
   - **Propósito**: Verificar renderizado correcto de historial de mensajes
   - **Qué prueba**: 
     - Mensaje de texto ("Hola") se muestra
     - Archivo de imagen (`pic.png`) se renderiza como `<img>` con alt correcto
   - **Importancia**: Historial completo visible al entrar a la sala

2. **`enviar mensaje dispara socket.emit`**
   - **Propósito**: Validar envío de mensajes de texto
   - **Qué prueba**: 
     - Escribir "hola mundo" en input
     - Enviar form
     - `socket.emit('send_message', { contenido: 'hola mundo' })` fue llamado
   - **Importancia**: Mensajes se transmiten correctamente al servidor

**`src/__tests__/ChatRoom.advanced.test.js`** (12 tests avanzados):

**Grupo: Renderizado de mensajes**

1. **`muestra mensajes del sistema correctamente`**
   - **Propósito**: Verificar formato de mensajes automáticos
   - **Qué prueba**: 
     - Mensajes con nickname "Sistema" se renderizan
     - Texto como "Alice se ha unido a la sala." aparece
   - **Importancia**: Notificaciones de eventos visibles para usuarios

2. **`muestra el PIN y tipo de sala en el header`**
   - **Propósito**: Validar información contextual de la sala
   - **Qué prueba**: 
     - PIN ("5678") se muestra en header
     - Tipo de sala ("Multimedia") se muestra en header
   - **Importancia**: Usuario siempre sabe en qué sala está

3. **`renderiza archivo PDF como enlace (no imagen)`**
   - **Propósito**: Verificar diferenciación de tipos de archivo
   - **Qué prueba**: 
     - Archivo PDF se renderiza como `<a>` (enlace descargable)
     - NO se renderiza como `<img>`
     - Nombre "documento.pdf" visible y clickeable
   - **Importancia**: UX apropiada para archivos no visualizables

4. **`distingue entre mensajes propios y de otros`**
   - **Propósito**: Validar estilos diferenciados de mensajes
   - **Qué prueba**: 
     - Mensajes del usuario actual (Alice) y otros (Bob) se renderizan
     - Ambos visibles pero potencialmente con estilos diferentes
   - **Importancia**: Claridad visual de quién habla (como WhatsApp)

**Grupo: Interacciones**

5. **`limpia el input después de enviar mensaje`**
   - **Propósito**: Verificar limpieza automática del campo de texto
   - **Qué prueba**: 
     - Escribir mensaje "Mensaje de prueba"
     - Enviar
     - Input vuelve a estar vacío
   - **Importancia**: UX - listo para siguiente mensaje inmediatamente

6. **`no envía mensajes vacíos`**
   - **Propósito**: Evitar spam de mensajes sin contenido
   - **Qué prueba**: 
     - Intentar enviar mensaje vacío o solo espacios
     - `socket.emit` NO es llamado
   - **Importancia**: Reducir tráfico innecesario y mejorar UX

7. **Tests adicionales de eventos Socket.IO**:
   - Recepción de nuevos mensajes en tiempo real
   - Actualización de lista de usuarios conectados
   - Manejo de desconexiones
   - Upload de archivos con feedback visual

**`src/__tests__/Admin.test.js`** (5 tests):

**Grupo: AdminLogin**

1. **`renderiza campos de usuario y contraseña`**
   - **Propósito**: Verificar formulario de login completo
   - **Qué prueba**: 
     - Input "Usuario" está presente
     - Input "Contraseña" está presente
     - Botón "Acceder" está visible
   - **Importancia**: Interfaz de autenticación funcional

2. **`muestra botón de volver`**
   - **Propósito**: Validar navegación de regreso
   - **Qué prueba**: 
     - Botón "Volver" está presente
   - **Importancia**: Usuario puede regresar sin autenticarse

**Grupo: AdminDashboard**

3. **`renderiza título del dashboard`**
   - **Propósito**: Verificar carga correcta del panel admin
   - **Qué prueba**: 
     - Título "Panel de Administración" está visible
   - **Importancia**: Confirmación visual de acceso administrativo

4. **`muestra botones de crear sala y cerrar sesión`**
   - **Propósito**: Validar acciones principales del admin
   - **Qué prueba**: 
     - Botón "Crear Sala" presente
     - Botón "Cerrar Sesión" presente
   - **Importancia**: Funcionalidades core del dashboard accesibles

5. **Tests adicionales**:
   - Listado de salas activas
   - Visualización de historial de salas
   - Eliminación de salas
   - Manejo de tokens JWT expirados

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
