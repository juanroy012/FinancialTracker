"""
Category model: all DB operations for categories.
Use parameterized queries only.
"""
import sqlite3

from ..schemas.category import CategoryRead, CategoryCreate


def get_all_categories(conn: sqlite3.Connection) -> list[CategoryRead]:
    """Return all categories from the database as a list of row dicts."""
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM categories")
    rows = cursor.fetchall()
    return [CategoryRead(id=row["id"], name=row["name"], type=row["type"], icon=row["icon"], color=row["color"]) for row in rows]
        

def get_category_by_id(category_id: int, conn: sqlite3.Connection) -> CategoryRead | None:
    """Return a single category by id, or None if not found."""
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM categories WHERE id = ?", (category_id,))
    row = cursor.fetchone()
    if row is None:
        return None
    return CategoryRead(id=row["id"], name=row["name"], type=row["type"], icon=row["icon"], color=row["color"])


def create_category(category: CategoryCreate, conn: sqlite3.Connection) -> CategoryRead:
    """Insert a new category. Id is auto-generated."""
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO categories (name, type, icon, color) VALUES (?, ?, ?, ?)",
        (category.name, category.type, category.icon, category.color)
    )
    conn.commit()
    category_id = cursor.lastrowid
    return CategoryRead(id=category_id, name=category.name, type=category.type, icon=category.icon, color=category.color)


def delete_category(category_id: int, conn: sqlite3.Connection) -> bool:
    """Delete a category by id."""
    cursor = conn.cursor()
    cursor.execute("DELETE FROM categories WHERE id = ?", (category_id,))
    conn.commit()
    return cursor.rowcount > 0


def update_category(
    category_id: int,
    update: CategoryCreate,
    conn: sqlite3.Connection
    ) -> CategoryRead | None:
    """Update an existing category by id."""
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM categories WHERE id = ?", (category_id,))
    row = cursor.fetchone()
    if row is None:
        return None
    cursor.execute(
        "UPDATE categories SET name = ?, type = ?, icon = ?, color = ? WHERE id = ?",
        (update.name, update.type, update.icon, update.color, category_id)
    )
    conn.commit()
    return CategoryRead(id=category_id, name=update.name, type=update.type, icon=update.icon, color=update.color)
