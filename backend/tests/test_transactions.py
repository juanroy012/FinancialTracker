_TX = {"type": "expense", "amount_cents": 5000, "date": "2024-01-15", "note": "lunch"}
_TX_INCOME = {"type": "income", "amount_cents": 100000, "date": "2024-01-01", "note": "paycheck"}


def test_list_transactions_empty(client):
    r = client.get("/transactions/")
    assert r.status_code == 200
    assert r.json() == []


def test_create_transaction(client):
    r = client.post("/transactions/", json=_TX)
    assert r.status_code == 200
    data = r.json()
    assert data["amount_cents"] == 5000
    assert data["type"] == "expense"
    assert data["note"] == "lunch"


def test_list_transactions_after_create(client):
    client.post("/transactions/", json=_TX)
    r = client.get("/transactions/")
    assert len(r.json()) == 1


def test_get_transaction_by_note(client):
    client.post("/transactions/", json=_TX)
    r = client.get("/transactions/lunch")
    assert r.status_code == 200
    assert r.json()[0]["note"] == "lunch"


def test_get_transaction_by_note_not_found(client):
    r = client.get("/transactions/nonexistent")
    assert r.status_code == 404


def test_delete_transaction(client):
    r = client.post("/transactions/", json=_TX)
    tx_id = r.json()["id"]
    r = client.delete(f"/transactions/{tx_id}")
    assert r.status_code == 204
    assert client.get("/transactions/").json() == []


def test_delete_transaction_not_found(client):
    r = client.delete("/transactions/999")
    assert r.status_code == 404


def test_update_transaction(client):
    r = client.post("/transactions/", json=_TX)
    tx_id = r.json()["id"]
    updated = {**_TX, "amount_cents": 9900, "note": "dinner"}
    r = client.patch(f"/transactions/{tx_id}", json=updated)
    assert r.status_code == 200
    assert r.json()["amount_cents"] == 9900
    assert r.json()["note"] == "dinner"


def test_update_transaction_not_found(client):
    r = client.patch("/transactions/999", json=_TX)
    assert r.status_code == 404


def test_transaction_adjusts_account_balance_expense(client):
    acc = client.post("/accounts/", json={"type": "bank", "name": "Main", "balance": 50000}).json()
    tx = {**_TX, "account_id": acc["id"], "amount_cents": 1000}
    client.post("/transactions/", json=tx)
    acc_r = client.get(f"/accounts/{acc['name']}").json()
    assert acc_r[0]["balance"] == 49000


def test_transaction_adjusts_account_balance_income(client):
    acc = client.post("/accounts/", json={"type": "bank", "name": "Savings", "balance": 0}).json()
    tx = {**_TX_INCOME, "account_id": acc["id"], "amount_cents": 20000}
    client.post("/transactions/", json=tx)
    acc_r = client.get(f"/accounts/{acc['name']}").json()
    assert acc_r[0]["balance"] == 20000
