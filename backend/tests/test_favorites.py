"""Полиморфное избранное (article/excursion/destination)."""


def test_toggle_requires_login(client):
    assert client.post("/api/favorites/toggle", json={"target_type": "article", "target_id": 1}).status_code == 401


def test_toggle_adds_and_removes(auth_client):
    # Сначала добавляем
    r1 = auth_client.post("/api/favorites/toggle", json={"target_type": "article", "target_id": 1})
    assert r1.status_code == 200
    assert r1.get_json()["in_favorites"] is True

    # Второй вызов — убирает
    r2 = auth_client.post("/api/favorites/toggle", json={"target_type": "article", "target_id": 1})
    assert r2.get_json()["in_favorites"] is False


def test_toggle_bad_input(auth_client):
    r = auth_client.post("/api/favorites/toggle", json={"target_type": "nope", "target_id": 1})
    assert r.status_code == 400


def test_my_groups_by_type(auth_client):
    auth_client.post("/api/favorites/toggle", json={"target_type": "article", "target_id": 1})
    auth_client.post("/api/favorites/toggle", json={"target_type": "excursion", "target_id": 1})
    auth_client.post("/api/favorites/toggle", json={"target_type": "destination", "target_id": 1})
    r = auth_client.get("/api/favorites/my")
    assert r.status_code == 200
    data = r.get_json()
    assert {"articles", "excursions", "destinations"} <= set(data.keys())
    assert len(data["articles"]) == 1
    assert len(data["excursions"]) == 1
    assert len(data["destinations"]) == 1
