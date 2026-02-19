_BANK = {"type": "bank", "name": "BDO", "balance": 100000}
_WALLET = {"type": "ewallet", "name": "GCash", "balance": 5000}


def test_list_accounts_empty(client):
    r = client.get("/accounts/")
    assert r.status_code == 200
    assert r.json() == []


def test_create_bank_account(client):
    r = client.post("/accounts/", json=_BANK)
    assert r.status_code == 200
    data = r.json()
    assert data["name"] == "BDO"
    assert data["type"] == "bank"
    assert data["balance"] == 100000


def test_create_wallet_account(client):
    r = client.post("/accounts/", json=_WALLET)
    assert r.status_code == 200
    assert r.json()["type"] == "ewallet"


def test_list_accounts_after_create(client):
    client.post("/accounts/", json=_BANK)
    client.post("/accounts/", json=_WALLET)
    r = client.get("/accounts/")
    assert len(r.json()) == 2


def test_get_account_by_name(client):
    client.post("/accounts/", json=_BANK)
    r = client.get("/accounts/BDO")
    assert r.status_code == 200
    assert r.json()[0]["name"] == "BDO"


def test_delete_account(client):
    r = client.post("/accounts/", json=_BANK)
    acc_id = r.json()["id"]
    r = client.delete(f"/accounts/{acc_id}")
    assert r.status_code == 204
    assert client.get("/accounts/").json() == []


def test_delete_account_not_found(client):
    r = client.delete("/accounts/999")
    assert r.status_code == 404


def test_update_account(client):
    r = client.post("/accounts/", json=_BANK)
    acc_id = r.json()["id"]
    r = client.patch(f"/accounts/{acc_id}", json={**_BANK, "name": "Metrobank", "balance": 200000})
    assert r.status_code == 200
    data = r.json()
    assert data["name"] == "Metrobank"
    assert data["balance"] == 200000


def test_update_account_not_found(client):
    r = client.patch("/accounts/999", json=_BANK)
    assert r.status_code == 404
