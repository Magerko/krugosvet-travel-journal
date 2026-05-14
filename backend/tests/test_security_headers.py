"""Базовые security-заголовки на любых ответах."""


def test_security_headers_on_index(client):
    r = client.get("/api/health")
    for h in ("X-Content-Type-Options", "X-Frame-Options",
              "Referrer-Policy", "Permissions-Policy",
              "Content-Security-Policy"):
        assert h in r.headers, f"нет заголовка {h}"


def test_x_frame_options_is_deny(client):
    r = client.get("/api/health")
    assert r.headers["X-Frame-Options"] == "DENY"


def test_csp_includes_picsum(client):
    """CSP должен разрешать картинки с picsum (мы оттуда берём обложки)."""
    r = client.get("/api/health")
    assert "picsum.photos" in r.headers["Content-Security-Policy"]
