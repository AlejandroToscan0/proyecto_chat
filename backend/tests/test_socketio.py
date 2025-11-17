import time
import pytest

import backend.app as app_module


def seed_sala(collection, tipo='Texto'):
    sala = {"id_sala": "ROOM1", "pin": "1234", "tipo": tipo, "usuarios_conectados": [], "mensajes": []}
    collection.insert_one(sala)
    return sala


def test_socketio_join_and_send(monkeypatch):
    # Prepare in-memory collections like other tests
    from backend.tests.test_app import InMemoryCollection
    salas = InMemoryCollection()
    admins = InMemoryCollection()
    monkeypatch.setattr(app_module, 'salas_collection', salas)
    monkeypatch.setattr(app_module, 'admin_collection', admins)
    monkeypatch.setattr(app_module, 'client', object())

    # seed a sala Multimedia and a Texto
    seed_sala(salas, tipo='Texto')

    # Create a socketio test client
    flask_test_client = app_module.app.test_client()
    socket_client = app_module.socketio.test_client(app_module.app, flask_test_client=flask_test_client)
    assert socket_client.is_connected()

    # join existing sala using pin
    socket_client.emit('join_room', {'pin': '1234', 'nickname': 'tester'})
    # give a tiny delay for server processing
    time.sleep(0.1)

    received = socket_client.get_received()
    # We expect at least chat_history event and new_message broadcast
    event_names = [r['name'] for r in received]
    assert 'chat_history' in event_names

    # send a message
    socket_client.emit('send_message', {'contenido': 'hola mundo'})
    time.sleep(0.1)

    # check that message was appended to the sala in our in-memory collection
    sala = salas.find_one({'id_sala': 'ROOM1'})
    assert sala is not None
    assert any(m.get('contenido') == 'hola mundo' for m in sala.get('mensajes', []))

    socket_client.disconnect()
