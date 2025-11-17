"""
Pruebas adicionales para endpoints REST del backend.
Cubre validaciones, casos de error y endpoints de admin.
"""
import os
import sys
import pytest
import json

# Añadir el directorio backend al path para poder importar app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import app as app_module


@pytest.fixture
def client():
    """Crea un cliente de prueba Flask sin conexión a BD real."""
    app_module.app.config['TESTING'] = True
    with app_module.app.test_client() as test_client:
        yield test_client


def test_setup_admin_without_db(client, monkeypatch):
    """Test de /api/setup-admin cuando no hay BD conectada."""
    # Simular que client es None
    monkeypatch.setattr(app_module, 'client', None)
    resp = client.get('/api/setup-admin')
    assert resp.status_code == 500
    data = resp.get_json()
    assert 'error' in data
    assert 'Base de datos no conectada' in data['error']


def test_admin_login_without_db(client, monkeypatch):
    """Test de /api/admin-login cuando no hay BD conectada."""
    monkeypatch.setattr(app_module, 'client', None)
    resp = client.post('/api/admin-login',
                       data=json.dumps({'usuario': 'admin', 'password': 'admin123'}),
                       content_type='application/json')
    assert resp.status_code == 500
    data = resp.get_json()
    assert 'error' in data


def test_crear_sala_sin_token(client, monkeypatch):
    """Test de /api/crear-sala sin token de autorización."""
    monkeypatch.setattr(app_module, 'client', True)  # simular BD conectada
    resp = client.post('/api/crear-sala',
                       data=json.dumps({'tipo': 'Texto'}),
                       content_type='application/json')
    assert resp.status_code == 401
    data = resp.get_json()
    assert 'error' in data
    assert 'Token de autorización requerido' in data['error']


def test_crear_sala_tipo_invalido(client, monkeypatch):
    """Test de /api/crear-sala con tipo de sala inválido."""
    # Simular que no hay cliente de BD conectado
    monkeypatch.setattr(app_module, 'client', None)
    resp = client.post('/api/crear-sala',
                       data=json.dumps({'tipo': 'Invalido'}),
                       content_type='application/json',
                       headers={'Authorization': 'Bearer fake-token'})
    # Esperamos 500 porque client=None (BD no conectada)
    # En producción con BD real y token válido, sería 400 por tipo inválido
    assert resp.status_code == 500
    data = resp.get_json()
    assert 'error' in data


def test_upload_without_db(client, monkeypatch):
    """Test de /api/upload cuando no hay BD conectada."""
    monkeypatch.setattr(app_module, 'client', None)
    resp = client.post('/api/upload',
                       data={'socket_id': 'fake-socket'},
                       content_type='multipart/form-data')
    assert resp.status_code == 500
    data = resp.get_json()
    assert 'error' in data


def test_upload_sin_session_valida(client, monkeypatch):
    """Test de /api/upload con socket_id no autorizado."""
    monkeypatch.setattr(app_module, 'client', True)
    monkeypatch.setattr(app_module, 'user_sessions', {})
    resp = client.post('/api/upload',
                       data={'socket_id': 'socket-inexistente'},
                       content_type='multipart/form-data')
    assert resp.status_code == 401
    data = resp.get_json()
    assert 'No autorizado' in data['error']


def test_allowed_file_extensiones_validas():
    """Test de la función allowed_file con extensiones válidas."""
    assert app_module.allowed_file('test.png') is True
    assert app_module.allowed_file('test.jpg') is True
    assert app_module.allowed_file('test.jpeg') is True
    assert app_module.allowed_file('test.gif') is True
    assert app_module.allowed_file('test.pdf') is True
    assert app_module.allowed_file('test.txt') is True


def test_allowed_file_extensiones_invalidas():
    """Test de la función allowed_file con extensiones no permitidas."""
    assert app_module.allowed_file('test.exe') is False
    assert app_module.allowed_file('test.sh') is False
    assert app_module.allowed_file('test.bat') is False
    assert app_module.allowed_file('archivo_sin_extension') is False
    assert app_module.allowed_file('test.docx') is False


def test_allowed_file_case_insensitive():
    """Test de que allowed_file no es case-sensitive."""
    assert app_module.allowed_file('test.PNG') is True
    assert app_module.allowed_file('test.PDF') is True
    assert app_module.allowed_file('test.TxT') is True
