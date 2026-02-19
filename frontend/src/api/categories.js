async function getCategories() {
    const res = await fetch("http://127.0.0.1:8000/categories/");
    if (!res.ok) throw new Error("Failed to fetch categories");
    return await res.json()
}

async function addCategory(category) {
    const res = await fetch(`http://127.0.0.1:8000/categories/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ "name": category["name"], "type": category["type"] ?? "expense", "icon": category["icon"] ?? "", "color": category["color"] ?? "amber" })
    });
    if (!res.ok) throw new Error("Failed to add category");
    return res.json();
}

async function deleteCategory(id) {
    const res = await fetch(`http://127.0.0.1:8000/categories/${id}`, {
        method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete category");
    return `Category ${id} successfully deleted`;
}

async function editCategory(id, category) {
    const res = await fetch(`http://127.0.0.1:8000/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", },
        body: JSON.stringify({ "name": category["name"], "type": category["type"] ?? "expense", "icon": category["icon"] ?? "", "color": category["color"] ?? "amber" }),
    });
    if (!res.ok) throw new Error("Failed to edit category");
    return res.json();
}

export { getCategories, addCategory, deleteCategory, editCategory }

