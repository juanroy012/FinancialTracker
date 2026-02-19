def test_list_categories_empty(client):
    r = client.get("/categories/")
    assert r.status_code == 200
    assert r.json() == []


def test_create_category(client):
    r = client.post("/categories/", json={"name": "Food", "type": "expense"})
    assert r.status_code == 200
    data = r.json()
    assert data["name"] == "Food"
    assert data["type"] == "expense"
    assert "id" in data


def test_list_categories_after_create(client):
    client.post("/categories/", json={"name": "Salary", "type": "income"})
    r = client.get("/categories/")
    assert r.status_code == 200
    assert len(r.json()) == 1


def test_create_duplicate_category_returns_400(client):
    client.post("/categories/", json={"name": "Rent"})
    r = client.post("/categories/", json={"name": "Rent"})
    assert r.status_code == 400


def test_update_category(client):
    r = client.post("/categories/", json={"name": "Transport", "type": "expense"})
    cat_id = r.json()["id"]
    r = client.patch(f"/categories/{cat_id}", json={"name": "Travel", "type": "expense"})
    assert r.status_code == 200
    assert r.json()["name"] == "Travel"


def test_update_category_not_found(client):
    r = client.patch("/categories/999", json={"name": "X", "type": "expense"})
    assert r.status_code == 404


def test_delete_category(client):
    r = client.post("/categories/", json={"name": "Utilities"})
    cat_id = r.json()["id"]
    r = client.delete(f"/categories/{cat_id}")
    assert r.status_code == 204
    assert client.get("/categories/").json() == []


def test_delete_category_not_found(client):
    r = client.delete("/categories/999")
    assert r.status_code in (204, 404)
