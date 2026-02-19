const BASE = `${import.meta.env.VITE_API_BASE ?? ''}/transactions`

async function getTransactions() {
    const res = await fetch(`${BASE}/`);
    if (!res.ok) throw new Error("Failed to fetch transactions");
    return await res.json();
}

async function getTransaction(id) {
    const res = await fetch(`${BASE}/${id}`, {
        method: "GET"
    });
    if (!res.ok) throw new Error("Failed to fetch transaction");
    return await res.json();
}

async function addTransaction(transaction) {
    const res = await fetch(`${BASE}/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            "type": transaction["type"],
            "amount_cents": transaction["amount_cents"],
            "date": transaction["date"],
            "note": transaction["note"],
            "category_id": transaction["category_id"],
            "account_id": transaction["account_id"],
        })
    });
    if (!res.ok) throw new Error("Failed to add transaction");
    return res.json();
}

async function deleteTransaction(id) {
    const res = await fetch(`${BASE}/${id}`, {
        method: "DELETE"
    });
    if (!res.ok) throw new Error("Failed to delete transaction");
    return `Transaction ${id} successfully deleted`;
}

async function editTransaction(id, transaction) {
    const res = await fetch(`${BASE}/${id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            "type": transaction["type"],
            "amount_cents": transaction["amount_cents"],
            "date": transaction["date"],
            "note": transaction["note"],
            "category_id": transaction["category_id"],
            "account_id": transaction["account_id"],
        })
    });
    if (!res.ok) throw new Error("Failed to update transaction");
    return res.json();
}


export { getTransactions, getTransaction, addTransaction, deleteTransaction, editTransaction }