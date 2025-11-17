import os
import sys
import tempfile

import pytest

# Añadir el directorio backend al path para poder importar app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import app as app_module


def test_allowed_file():
    # archivos permitidos
    assert app_module.allowed_file("imagen.png")
    assert app_module.allowed_file("documento.pdf")
    # archivo no permitido
    assert not app_module.allowed_file("archivo.exe")


def test_serve_nonexistent_file():
    client = app_module.app.test_client()
    resp = client.get('/uploads/this-file-should-not-exist-12345.xyz')
    # El endpoint devuelve 404 si el archivo no se encuentra
    assert resp.status_code == 404
    # El endpoint puede devolver JSON o HTML dependiendo de la configuración
    # Verificamos que la respuesta indica error
    assert resp.status_code == 404
