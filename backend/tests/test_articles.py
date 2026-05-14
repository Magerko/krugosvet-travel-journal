"""Статьи: список, детальная, комментарии."""


def test_articles_list(client):
    r = client.get("/api/articles/")
    assert r.status_code == 200
    data = r.get_json()
    assert "items" in data
    assert data["total"] >= 1


def test_articles_featured(client):
    r = client.get("/api/articles/featured")
    assert r.status_code == 200
    items = r.get_json()["items"]
    assert all(a["is_featured"] for a in items)


def test_articles_categories(client):
    r = client.get("/api/articles/categories")
    assert r.status_code == 200
    cats = r.get_json()["items"]
    assert any(c["slug"] == "industry" for c in cats)


def test_articles_detail_existing(client):
    r = client.get("/api/articles/vizy-2026")
    assert r.status_code == 200
    a = r.get_json()["article"]
    assert a["slug"] == "vizy-2026"
    assert "body" in a            # full=True для детальной


def test_articles_detail_missing(client):
    r = client.get("/api/articles/no-such-article")
    assert r.status_code == 404


def test_comment_requires_login(client):
    r = client.post("/api/articles/1/comments", json={"body": "Привет"})
    assert r.status_code == 401


def test_comment_create(auth_client):
    r = auth_client.post("/api/articles/1/comments", json={"body": "Полезная статья"})
    assert r.status_code == 201
    c = r.get_json()["comment"]
    assert c["body"] == "Полезная статья"
    # И теперь он виден в детальной
    detail = auth_client.get("/api/articles/vizy-2026").get_json()
    bodies = [c["body"] for c in detail["comments"]]
    assert "Полезная статья" in bodies


def test_comment_empty_rejected(auth_client):
    r = auth_client.post("/api/articles/1/comments", json={"body": "   "})
    assert r.status_code == 400


def test_comment_sanitizes_control_chars(auth_client):
    """clean_text() должен вырезать управляющие байты."""
    dirty = "Hello\x00\x07World"
    r = auth_client.post("/api/articles/1/comments", json={"body": dirty})
    assert r.status_code == 201
    saved = r.get_json()["comment"]["body"]
    assert "\x00" not in saved
    assert "\x07" not in saved
    assert "HelloWorld" == saved
