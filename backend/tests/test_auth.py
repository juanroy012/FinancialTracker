def test_guest_login_returns_token(client):
    r = client.post("/auth/guest")
    assert r.status_code == 200

    data = r.json()
    assert data["token_type"] == "bearer"
    assert isinstance(data["access_token"], str)
    assert data["access_token"]


def test_guest_token_can_access_protected_routes(client):
    guest = client.post("/auth/guest")
    token = guest.json()["access_token"]

    r = client.get("/accounts/", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200


def test_guest_login_is_repeatable(client):
    first = client.post("/auth/guest")
    second = client.post("/auth/guest")

    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["access_token"]
    assert second.json()["access_token"]
