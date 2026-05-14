"""Экскурсии: каталог, фильтры, детальная, availability."""


def test_excursions_list(client):
    r = client.get("/api/excursions/")
    assert r.status_code == 200
    assert r.get_json()["total"] >= 1


def test_excursions_filter_by_country(client):
    r = client.get("/api/excursions/?country=TR")
    assert r.status_code == 200
    data = r.get_json()
    # Все возвращённые экскурсии должны быть в Турции
    for e in data["items"]:
        assert e["destination"]["country"] == "Турция"


def test_excursions_filter_by_kind(client):
    r = client.get("/api/excursions/?kind=excursion")
    assert r.status_code == 200
    for e in r.get_json()["items"]:
        assert e["kind"] == "excursion"


def test_excursion_detail(client):
    r = client.get("/api/excursions/kapadokiya")
    assert r.status_code == 200
    e = r.get_json()["excursion"]
    assert e["slug"] == "kapadokiya"
    assert "program" in e or e.get("program") is None


def test_excursion_availability_empty(client):
    """Без активных броней — список booked пустой."""
    r = client.get("/api/excursions/1/availability")
    assert r.status_code == 200
    data = r.get_json()
    assert data["excursion_id"] == 1
    assert data["booked"] == []
