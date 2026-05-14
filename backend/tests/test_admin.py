"""Админ-эндпоинты: stats, CRUD статей, защита от обычного юзера."""


def test_stats_requires_admin(client, auth_client):
    # Аноним
    assert client.get("/api/admin/stats").status_code == 401
    # Обычный юзер
    assert auth_client.get("/api/admin/stats").status_code == 403


def test_admin_stats_shape(admin_client):
    r = admin_client.get("/api/admin/stats")
    assert r.status_code == 200
    d = r.get_json()
    for k in ("articles", "articles_published", "excursions", "destinations",
              "users", "requests_total", "comments_total", "comments_pending",
              "bookings_total", "bookings_pending"):
        assert k in d, f"в /api/admin/stats нет поля {k}"


def test_admin_articles_crud(admin_client):
    """Создать → отредактировать → удалить статью."""
    # Create
    r = admin_client.post("/api/admin/articles", json={
        "slug": "auto-test-article",
        "title": "Автотест",
        "summary": "тест",
        "body": "тело",
        "reading_time": 3,
        "is_published": True,
    })
    assert r.status_code == 201, r.get_json()
    new = r.get_json()["article"]
    aid = new["id"]

    # Update
    r = admin_client.put(f"/api/admin/articles/{aid}", json={"title": "Автотест (upd)", "is_featured": True})
    assert r.status_code == 200
    assert r.get_json()["article"]["title"] == "Автотест (upd)"

    # Delete
    r = admin_client.delete(f"/api/admin/articles/{aid}")
    assert r.status_code == 200

    # Удалена
    r = admin_client.get(f"/api/articles/auto-test-article")
    assert r.status_code == 404


def test_admin_articles_slug_conflict(admin_client):
    r = admin_client.post("/api/admin/articles", json={"slug": "vizy-2026", "title": "duplicate"})
    assert r.status_code == 409
    assert r.get_json()["error"] == "slug_taken"


def test_admin_bookings_list(admin_client):
    r = admin_client.get("/api/admin/bookings")
    assert r.status_code == 200
    assert "items" in r.get_json()


def test_admin_audit_log(admin_client):
    # Создание статьи добавит запись в audit_log → потом проверим, что в /audit что-то есть
    admin_client.post("/api/admin/articles", json={"slug": "audit-check", "title": "audit"})
    r = admin_client.get("/api/admin/audit")
    assert r.status_code == 200
    items = r.get_json()["items"]
    # ищем нашу свежую запись
    found = any(it["message"].startswith('"audit"') or '"audit"' in (it["message"] or "")
                for it in items)
    assert found
