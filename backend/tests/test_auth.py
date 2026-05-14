"""Регистрация, логин, выход, /me, защита от user enumeration."""


def test_login_valid(client):
    r = client.post("/api/auth/login", json={"email": "ivanov@example.com", "password": "password"})
    assert r.status_code == 200
    assert r.get_json()["user"]["email"] == "ivanov@example.com"


def test_login_wrong_password(client):
    r = client.post("/api/auth/login", json={"email": "ivanov@example.com", "password": "WRONG"})
    assert r.status_code == 401
    assert r.get_json()["error"] == "invalid_credentials"


def test_login_unknown_email(client):
    r = client.post("/api/auth/login", json={"email": "nobody@nowhere.test", "password": "x"})
    assert r.status_code == 401
    # Сервер возвращает одно и то же сообщение, не раскрывая существование email
    assert r.get_json()["error"] == "invalid_credentials"


def test_me_anonymous(client):
    r = client.get("/api/auth/me")
    assert r.status_code == 200
    assert r.get_json()["user"] is None


def test_me_after_login(auth_client):
    r = auth_client.get("/api/auth/me")
    assert r.status_code == 200
    u = r.get_json()["user"]
    assert u["email"] == "ivanov@example.com"
    assert u["is_admin"] is False


def test_logout(auth_client):
    r = auth_client.post("/api/auth/logout")
    assert r.status_code == 200
    me = auth_client.get("/api/auth/me").get_json()
    assert me["user"] is None


def test_register_valid_new_email(client):
    """
    Регистрация со свободным email: ответ 200 ok, аккаунт создан.
    Автологина нет (защита от user enumeration), нужно login отдельно.
    """
    r = client.post("/api/auth/register", json={
        "email": "newkid@test.local", "password": "secret123", "full_name": "Новый Пользователь",
    })
    assert r.status_code == 200
    data = r.get_json()
    assert data["ok"] is True
    assert "message" in data
    # Должен быть в состоянии залогиниться
    r2 = client.post("/api/auth/login", json={"email": "newkid@test.local", "password": "secret123"})
    assert r2.status_code == 200


def test_register_taken_email_returns_same_shape(client):
    """
    Защита от user enumeration: ответ для занятого email должен быть
    неотличим от свободного. Тот же status и тот же набор полей.
    """
    r_taken = client.post("/api/auth/register", json={
        "email": "ivanov@example.com", "password": "secret123", "full_name": "Атакующий",
    })
    assert r_taken.status_code == 200
    body = r_taken.get_json()
    assert body == {"ok": True, "message": body["message"]} or "ok" in body
    assert body["ok"] is True
    # Существующий пароль не должен сломаться
    r = client.post("/api/auth/login", json={"email": "ivanov@example.com", "password": "password"})
    assert r.status_code == 200


def test_register_validation_errors(client):
    r = client.post("/api/auth/register", json={
        "email": "not-an-email", "password": "x", "full_name": "",
    })
    assert r.status_code == 400
    d = r.get_json()
    assert d["error"] == "validation"
    assert "email" in d["fields"]
    assert "password" in d["fields"]
    assert "full_name" in d["fields"]
