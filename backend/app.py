from gevent import monkey
monkey.patch_all()
from flask import Flask, request, jsonify, send_from_directory
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
from flask_bcrypt import Bcrypt
import pymongo
import jwt
import random
import string
import datetime
import os
import uuid
from werkzeug.utils import secure_filename

# --- 1. CONFIGURACIÓN INICIAL ---
app = Flask(__name__)
app.config['SECRET_KEY'] = 'tu-clave-secreta-muy-dificil!'

# --- Configuración de Subida de Archivos ---
UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf', 'txt'}
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and \
        filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# --- Configuración de MongoDB ---
MONGO_URI = "mongodb+srv://malugmana2_db_user:appServer1619@cluster0.h7gaa5e.mongodb.net/?appName=Cluster0"
try:
    client = pymongo.MongoClient(MONGO_URI)
    db = client.get_database("chat_distribuido")
    salas_collection = db.get_collection("salas")
    admin_collection = db.get_collection("admins")
    print("✅ ¡Conectado a MongoDB Atlas exitosamente!")
except Exception as e:
    print(f"❌ Error al conectar a MongoDB: {e}")
    client = None
    
bcrypt = Bcrypt(app)
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='gevent')
user_sessions = {}


# --- 2. ENDPOINTS DE API REST (Admin) ---

@app.route('/api/setup-admin', methods=['GET'])
def setup_admin():
    if not client: return jsonify({"error": "Base de datos no conectada"}), 500
    admin_existe = admin_collection.find_one({"usuario": "admin"})
    if not admin_existe:
        hash_pass = bcrypt.generate_password_hash("admin123").decode('utf-8')
        admin_collection.insert_one({"usuario": "admin", "password": hash_pass})
        return jsonify({"mensaje": "Admin 'admin' con pass 'admin123' creado"}), 201
    return jsonify({"mensaje": "El admin ya existe"}), 200

@app.route('/api/admin-login', methods=['POST'])
def admin_login():
    if not client: return jsonify({"error": "Base de datos no conectada"}), 500
    data = request.get_json()
    usuario = data.get('usuario')
    password = data.get('password')
    admin = admin_collection.find_one({"usuario": usuario})
    if admin and bcrypt.check_password_hash(admin['password'], password):
        token = jwt.encode({'usuario': admin['usuario'], 'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=8)}, app.config['SECRET_KEY'], algorithm="HS256")
        return jsonify({"mensaje": "Login exitoso", "token": token}), 200
    return jsonify({"error": "Credenciales inválidas"}), 401

@app.route('/api/crear-sala', methods=['POST'])
def crear_sala():
    if not client: return jsonify({"error": "Base de datos no conectada"}), 500
    token = request.headers.get('Authorization')
    if not token: return jsonify({"error": "Token de autorización requerido"}), 401
    try:
        token = token.split(" ")[1]
        jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
    except Exception as e:
        return jsonify({"error": "Token inválido o expirado", "detalle": str(e)}), 401
    data = request.get_json()
    tipo_sala = data.get('tipo')
    if tipo_sala not in ["Texto", "Multimedia"]:
        return jsonify({"error": "Tipo de sala debe ser 'Texto' o 'Multimedia'"}), 400
    id_sala = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    pin_sala = ''.join(random.choices(string.digits, k=4))
    nueva_sala = {"id_sala": id_sala, "pin": pin_sala, "tipo": tipo_sala, "usuarios_conectados": [], "mensajes": []}
    salas_collection.insert_one(nueva_sala)
    return jsonify({"mensaje": "Sala creada exitosamente", "id_sala": id_sala, "pin": pin_sala, "tipo": tipo_sala}), 201

# --- Endpoint para Subir Archivos ---
@app.route('/api/upload', methods=['POST'])
def upload_file():
    if not client: return jsonify({"error": "Base de datos no conectada"}), 500
    socket_id = request.form.get('socket_id')
    if not socket_id or socket_id not in user_sessions:
        return jsonify({"error": "No autorizado. Sesión de Socket no válida."}), 401
    sesion = user_sessions[socket_id]
    nickname = sesion['nickname']
    id_sala = sesion['id_sala']
    sala = salas_collection.find_one({"id_sala": id_sala})
    if not sala or sala.get('tipo') != 'Multimedia':
        return jsonify({"error": "No se permiten archivos en esta sala."}), 403
    if 'file' not in request.files: return jsonify({"error": "No se envió ningún archivo."}), 400
    file = request.files['file']
    if file.filename == '': return jsonify({"error": "Nombre de archivo vacío."}), 400
    if file and allowed_file(file.filename):
        original_filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4()}_{original_filename}"
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        try:
            file.save(file_path)
        except Exception as e:
            return jsonify({"error": f"Error al guardar. ¿Archivo demasiado grande? (Límite 10MB) {e}"}), 413
        file_url = f"/uploads/{unique_filename}"
        nuevo_mensaje = {"nickname": nickname, "tipo": "archivo", "contenido": f"subió el archivo: {original_filename}", "url": file_url, "nombre_archivo": original_filename, "timestamp": datetime.datetime.utcnow().isoformat()}
        salas_collection.update_one({"id_sala": id_sala}, {"$push": {"mensajes": nuevo_mensaje}})
        socketio.emit('new_message', nuevo_mensaje, room=id_sala)
        return jsonify({"mensaje": "Archivo subido exitosamente", "url": file_url}), 201
    else:
        return jsonify({"error": "Tipo de archivo no permitido."}), 400

# --- Endpoint para Servir/Descargar los Archivos ---
@app.route('/uploads/<filename>')
def serve_uploaded_file(filename):
    try:
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)
    except FileNotFoundError:
        return jsonify({"error": "Archivo no encontrado"}), 404

# --- ¡NUEVO! ENDPOINT 1: LISTAR TODAS LAS SALAS ---
@app.route('/api/admin/salas', methods=['GET'])
def get_all_salas():
    if not client: return jsonify({"error": "Base de datos no conectada"}), 500
    # 1. Validar Token de Admin
    token = request.headers.get('Authorization')
    if not token: return jsonify({"error": "Token de autorización requerido"}), 401
    try:
        token = token.split(" ")[1]
        jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
    except Exception as e:
        return jsonify({"error": "Token inválido o expirado"}), 401
    # 2. Consultar la base de datos
    try:
        # Excluimos el campo "mensajes" para que la respuesta sea ligera
        projection = {"mensajes": 0, "_id": 0}
        salas = list(salas_collection.find({}, projection))
        return jsonify(salas), 200
    except Exception as e:
        return jsonify({"error": f"Error al consultar la base de datos: {e}"}), 500

# --- ¡NUEVO! ENDPOINT 2: VER HISTORIAL DE UNA SALA ---
@app.route('/api/admin/sala/<id_sala>', methods=['GET'])
def get_sala_history(id_sala):
    if not client: return jsonify({"error": "Base de datos no conectada"}), 500
    # 1. Validar Token de Admin
    token = request.headers.get('Authorization')
    if not token: return jsonify({"error": "Token de autorización requerido"}), 401
    try:
        token = token.split(" ")[1]
        jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
    except Exception as e:
        return jsonify({"error": "Token inválido o expirado"}), 401
    # 2. Consultar la base de datos
    try:
        projection = {"_id": 0}
        sala = salas_collection.find_one({"id_sala": id_sala}, projection)
        if sala:
            return jsonify(sala), 200
        else:
            return jsonify({"error": "Sala no encontrada"}), 404
    except Exception as e:
        return jsonify({"error": f"Error al consultar la base de datos: {e}"}), 500

# ---  ENDPOINT 3: ELIMINAR UNA SALA ---
@app.route('/api/admin/sala/<id_sala>', methods=['DELETE'])
def delete_sala(id_sala):
    if not client: return jsonify({"error": "Base de datos no conectada"}), 500
    # 1. Validar Token de Admin
    token = request.headers.get('Authorization')
    if not token: return jsonify({"error": "Token de autorización requerido"}), 401
    try:
        token = token.split(" ")[1]
        jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
    except Exception as e:
        return jsonify({"error": "Token inválido o expirado"}), 401
    # 2. Eliminar de la base de datos
    try:
        result = salas_collection.delete_one({"id_sala": id_sala})
        if result.deleted_count > 0:
            # Opcional: Notificar a usuarios si estuvieran en la sala
            # socketio.emit('sala_eliminada', {"mensaje": "La sala ha sido cerrada por un admin"}, room=id_sala)
            return jsonify({"mensaje": f"Sala {id_sala} eliminada exitosamente"}), 200
        else:
            return jsonify({"error": "Sala no encontrada"}), 404
    except Exception as e:
        return jsonify({"error": f"Error al eliminar de la base de datos: {e}"}), 500


# EVENTOS DE WEBSOCKET (Chat) ---

@socketio.on('connect')
def handle_connect():
    print(f'Cliente conectado con sid: {request.sid}')

@socketio.on('join_room')
def handle_join_room(data):
    if not client: 
        emit('join_error', {"error": "Servicio no disponible (BD)."})
        return
    pin = data.get('pin')
    nickname = data.get('nickname')
    sid = request.sid
    sala = salas_collection.find_one({"pin": pin})
    if not sala:
        emit('join_error', {"error": "PIN de sala incorrecto."})
        return
    id_sala = sala['id_sala']
    if nickname in sala['usuarios_conectados']:
        emit('join_error', {"error": "Ese nickname ya está en uso en esta sala."})
        return
    if sid in user_sessions:
        emit('join_error', {"error": "Ya estás conectado a una sala."})
        return
    join_room(id_sala)
    salas_collection.update_one({"id_sala": id_sala}, {"$push": {"usuarios_conectados": nickname}})
    user_sessions[sid] = {"nickname": nickname, "id_sala": id_sala}
    
    # --- Lógica de "Unirse" ) ---
    sala_actualizada = salas_collection.find_one({"id_sala": id_sala})
    usuarios_conectados = sala_actualizada.get('usuarios_conectados', [])
    socketio.emit('update_user_list', usuarios_conectados, room=id_sala)
    historial_mensajes = sala.get('mensajes', [])
    tipo_sala = sala.get('tipo', 'Texto')
    emit('chat_history', {"history": historial_mensajes, "roomType": tipo_sala, "users": usuarios_conectados})
    socketio.emit('new_message', {"nickname": "Sistema", "tipo": "texto", "contenido": f"{nickname} se ha unido a la sala."}, room=id_sala)
    print(f"Éxito: {nickname} ({sid}) se unió a la sala {id_sala}")

@socketio.on('send_message')
def handle_send_message(data):
    if not client: return
    sid = request.sid
    if sid not in user_sessions: return
    sesion = user_sessions[sid]
    nickname = sesion['nickname']
    id_sala = sesion['id_sala']
    contenido = data.get('contenido')
    if not contenido: return
    nuevo_mensaje = {"nickname": nickname, "tipo": "texto", "contenido": contenido, "timestamp": datetime.datetime.utcnow().isoformat()}
    salas_collection.update_one({"id_sala": id_sala}, {"$push": {"mensajes": nuevo_mensaje}})
    socketio.emit('new_message', nuevo_mensaje, room=id_sala)

@socketio.on('disconnect')
def handle_disconnect():
    sid = request.sid
    print(f'Cliente desconectado: {sid}')
    if sid in user_sessions:
        sesion = user_sessions[sid]
        nickname = sesion['nickname']
        id_sala = sesion['id_sala']
        leave_room(id_sala)
        del user_sessions[sid]
        if client:
            salas_collection.update_one({"id_sala": id_sala}, {"$pull": {"usuarios_conectados": nickname}})
            sala_actualizada = salas_collection.find_one({"id_sala": id_sala})
            if sala_actualizada:
                usuarios_conectados = sala_actualizada.get('usuarios_conectados', [])
                socketio.emit('update_user_list', usuarios_conectados, room=id_sala)
                socketio.emit('new_message', {"nickname": "Sistema", "tipo": "texto", "contenido": f"{nickname} ha abandonado la sala."}, room=id_sala)
        print(f"Éxito: {nickname} ({sid}) abandonó la sala {id_sala}")

# --- 4. PUNTO DE ENTRADA ---
if __name__ == '__main__':
    print("Iniciando servidor en http://localhost:5001")
    try:
        socketio.run(app, host='0.0.0.0', port=5001, debug=True)
    except Exception as e:
        print(f"\nModo Debug falló ({e}). Reiniciando en modo de producción (debug=False).\n")
        socketio.run(app, host='0.0.0.0', port=5001, debug=False)