"""Бронирование экскурсий: создание, оплата, отмена, IDOR."""

from datetime import date, timedelta


def _tomorrow():
    return (date.today() + timedelta(days=1)).isoformat()


def _yesterday():
    return (date.today() - timedelta(days=1)).isoformat()


def test_booking_requires_login(client):
    r = client.post("/api/bookings/", json={
        "excursion_id": 1, "tourists": 1, "departure_date": _tomorrow(),
        "contact_phone": "+1 (555) 010-0000", "contact_email": "x@x.test",
    })
    assert r.status_code == 401


def test_booking_create_ok(auth_client):
    r = auth_client.post("/api/bookings/", json={
        "excursion_id": 1, "tourists": 2, "departure_date": _tomorrow(),
        "contact_phone": "+1 (555) 010-0000", "contact_email": "ivanov@example.com",
    })
    assert r.status_code == 201
    b = r.get_json()["booking"]
    assert b["tourists"] == 2
    assert b["status"] == "pending"
    assert b["total_price"] == 440          # 220 × 2, без скидки (нет предыдущих paid)


def test_booking_past_date_rejected(auth_client):
    r = auth_client.post("/api/bookings/", json={
        "excursion_id": 1, "tourists": 1, "departure_date": _yesterday(),
        "contact_phone": "+1 (555) 010-0000", "contact_email": "ivanov@example.com",
    })
    assert r.status_code == 400
    assert "departure_date" in r.get_json()["fields"]


def test_booking_price_on_request_excursion(auth_client):
    """Экскурсия с price_from=None — нельзя бронировать (только заявка)."""
    r = auth_client.post("/api/bookings/", json={
        "excursion_id": 3, "tourists": 1, "departure_date": _tomorrow(),
        "contact_phone": "+1 (555) 010-0000", "contact_email": "ivanov@example.com",
    })
    assert r.status_code == 400
    assert r.get_json()["error"] == "price_on_request"


def test_booking_my_empty_for_fresh_user(auth_client):
    r = auth_client.get("/api/bookings/my")
    assert r.status_code == 200
    data = r.get_json()
    assert data["upcoming"] == []
    assert data["history"] == []


def test_booking_pay_only_owner(auth_client, app):
    """IDOR: чужую бронь оплатить нельзя."""
    # Создаём бронь под ivanov
    created = auth_client.post("/api/bookings/", json={
        "excursion_id": 1, "tourists": 1, "departure_date": _tomorrow(),
        "contact_phone": "+1 (555) 010-0000", "contact_email": "ivanov@example.com",
    }).get_json()["booking"]
    bid = created["id"]

    # Логинимся как anna и пытаемся оплатить чужую
    anna = app.test_client()
    anna.post("/api/auth/login", json={"email": "anna@example.com", "password": "password"})
    r = anna.post(f"/api/bookings/{bid}/pay")
    assert r.status_code == 403


def test_booking_cancel(auth_client):
    created = auth_client.post("/api/bookings/", json={
        "excursion_id": 1, "tourists": 1, "departure_date": _tomorrow(),
        "contact_phone": "+1 (555) 010-0000", "contact_email": "ivanov@example.com",
    }).get_json()["booking"]
    bid = created["id"]

    r = auth_client.post(f"/api/bookings/{bid}/cancel")
    assert r.status_code == 200
    assert r.get_json()["booking"]["status"] == "cancelled"


def test_booking_detail_idor(auth_client, app):
    """Чужую бронь нельзя даже посмотреть."""
    created = auth_client.post("/api/bookings/", json={
        "excursion_id": 1, "tourists": 1, "departure_date": _tomorrow(),
        "contact_phone": "+1 (555) 010-0000", "contact_email": "ivanov@example.com",
    }).get_json()["booking"]

    anna = app.test_client()
    anna.post("/api/auth/login", json={"email": "anna@example.com", "password": "password"})
    r = anna.get(f"/api/bookings/{created['id']}")
    assert r.status_code == 403


def test_booking_admin_can_view_any(admin_client, auth_client):
    """Админ имеет право смотреть любые брони."""
    created = auth_client.post("/api/bookings/", json={
        "excursion_id": 1, "tourists": 1, "departure_date": _tomorrow(),
        "contact_phone": "+1 (555) 010-0000", "contact_email": "ivanov@example.com",
    }).get_json()["booking"]
    r = admin_client.get(f"/api/bookings/{created['id']}")
    assert r.status_code == 200
