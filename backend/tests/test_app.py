import json
import datetime
import pytest

import backend.app as app_module


class InMemoryCollection:
    def __init__(self):
        self._data = []

    def find_one(self, query):
        for d in self._data:
            match = True
            for k, v in query.items():
                if d.get(k) != v:
                    match = False
                    break
            if match:
                return d
        return None

    def insert_one(self, doc):
        # store a shallow copy
        self._data.append(dict(doc))
        class R: pass
        r = R()
        r.inserted_id = len(self._data)
        return r

    def update_one(self, filter_q, update):
        doc = self.find_one(filter_q)
        class R: pass
        r = R()
        if not doc:
            r.matched_count = 0
            r.modified_count = 0
            return r
        # support $push and $pull simplistic
        if '$push' in update:
            for k, v in update['$push'].items():
                doc.setdefault(k, []).append(v)
        if '$pull' in update:
            for k, v in update['$pull'].items():
                if k in doc and isinstance(doc[k], list):
                    doc[k] = [x for x in doc[k] if x != v]
        r.matched_count = 1
        r.modified_count = 1
        return r

    def delete_one(self, filter_q):
        doc = self.find_one(filter_q)
        class R: pass
        r = R()
        if doc:
            self._data.remove(doc)
            r.deleted_count = 1
        else:
            r.deleted_count = 0
        return r

    def find(self, filter_q=None, projection=None):
        # ignore filter for simplicity
        res = []
        for d in self._data:
            out = dict(d)
            if projection:
                for k in list(out.keys()):
                    if k in projection and projection[k] == 0:
                        del out[k]
            res.append(out)
        return res


@pytest.fixture(autouse=True)
def setup_inmemory_db(monkeypatch):
    # Replace collections with in-memory versions and mark client as present
    salas = InMemoryCollection()
    admins = InMemoryCollection()
    # seed an empty sala for join tests if needed
    monkeypatch.setattr(app_module, 'salas_collection', salas)
    monkeypatch.setattr(app_module, 'admin_collection', admins)
    monkeypatch.setattr(app_module, 'client', object())
    yield


def test_allowed_file():
    assert app_module.allowed_file('foto.png')
    assert app_module.allowed_file('doc.PDF')
    assert not app_module.allowed_file('archivo.exe')


def test_setup_admin_and_login():
    # create admin via endpoint
    test_client = app_module.app.test_client()
    res = test_client.get('/api/setup-admin')
    assert res.status_code in (200, 201)

    # attempt login with default creds
    payload = {'usuario': 'admin', 'password': 'admin123'}
    res2 = test_client.post('/api/admin-login', json=payload)
    assert res2.status_code == 200
    data = res2.get_json()
    assert 'token' in data


def test_crear_sala_requires_token_and_creates_room():
    test_client = app_module.app.test_client()
    # Create admin and login to get token
    test_client.get('/api/setup-admin')
    login = test_client.post('/api/admin-login', json={'usuario': 'admin', 'password': 'admin123'})
    token = login.get_json()['token']

    headers = {'Authorization': f'Bearer {token}'}
    res = test_client.post('/api/crear-sala', json={'tipo': 'Texto'}, headers=headers)
    assert res.status_code == 201
    body = res.get_json()
    assert 'id_sala' in body and 'pin' in body and body['tipo'] == 'Texto'


def test_admin_list_and_delete_sala():
    test_client = app_module.app.test_client()
    test_client.get('/api/setup-admin')
    login = test_client.post('/api/admin-login', json={'usuario': 'admin', 'password': 'admin123'})
    token = login.get_json()['token']
    headers = {'Authorization': f'Bearer {token}'}

    # create two salas
    res1 = test_client.post('/api/crear-sala', json={'tipo': 'Texto'}, headers=headers)
    id1 = res1.get_json()['id_sala']
    res2 = test_client.post('/api/crear-sala', json={'tipo': 'Multimedia'}, headers=headers)
    id2 = res2.get_json()['id_sala']

    # list salas
    list_res = test_client.get('/api/admin/salas', headers=headers)
    assert list_res.status_code == 200
    salas = list_res.get_json()
    assert any(s.get('id_sala') == id1 for s in salas)
    assert any(s.get('id_sala') == id2 for s in salas)

    # delete one sala
    del_res = test_client.delete(f'/api/admin/sala/{id1}', headers=headers)
    assert del_res.status_code == 200
    # get deleted sala should return 404
    get_res = test_client.get(f'/api/admin/sala/{id1}', headers=headers)
    assert get_res.status_code == 404
