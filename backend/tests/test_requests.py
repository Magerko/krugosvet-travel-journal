"""Заявки на консультацию (анонимные и от залогиненных)."""

from datetime import date, timedelta


def test_request_anonymous(client):
    r = client.post("/api/requests/", json={
        "full_name": "Гость Тестов", "email": "guest@test.local",
        "phone": "+1 (555) 010-0000",
        "message": "Хочу узнать про экскурсию",
    })
    assert r.status_code == 201
    assert r.get_json()["request"]["status"] == "new"


def test_request_validation(client):
    r = client.post("/api/requests/", json={"full_name": "", "email": "bad", "phone": "abc"})
    assert r.status_code == 400
    d = r.get_json()
    for f in ("full_name", "email", "phone"):
        assert f in d["fields"]


def test_request_past_date_rejected(client):
    yesterday = (date.today() - timedelta(days=1)).isoformat()
    r = client.post("/api/requests/", json={
        "full_name": "Тест", "email": "t@t.test", "phone": "+1 (555) 010-0000",
        "desired_date": yesterday,
    })
    assert r.status_code == 400
    assert "desired_date" in r.get_json()["fields"]


def test_request_my_requires_login(client):
    assert client.get("/api/requests/my").status_code == 401


def test_request_my_returns_user_requests(auth_client):
    auth_client.post("/api/requests/", json={
        "full_name": "Иванов", "email": "ivanov@example.com", "phone": "+1 (555) 010-4567",
        "message": "Расскажите подробнее",
    })
    r = auth_client.get("/api/requests/my")
    assert r.status_code == 200
    items = r.get_json()["items"]
    assert len(items) >= 1
