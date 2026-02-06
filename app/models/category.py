"""
Category model: all DB operations for categories.
Use parameterized queries only.
"""
import sqlite3

from app.schemas.category import CategoryRead, CategoryCreate


def get_all_categories(conn: sqlite3.Connection) -> list[CategoryRead]:
    """Return all categories from the database as a list of row dicts."""
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM categories")
    rows = cursor.fetchall()
    '''
    categories = []
    for row in rows:
        categories.append(CategoryRead(id=row["id"], name=row["name"]))
    return categories
    '''
    return [CategoryRead(id=row["id"], name=row["name"]) for row in rows]
        

def get_category_by_id(category_id: int, conn: sqlite3.Connection) -> CategoryRead | None:
    """Return a single category by id, or None if not found."""
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM categories WHERE id = ?", (category_id,))
    row = cursor.fetchone()
    if row is None:
        return None
    return CategoryRead(id=row["id"], name=row["name"])


def create_category(category: CategoryCreate, conn: sqlite3.Connection) -> CategoryRead:
    """Insert a new category. Id is auto-generated."""
    cursor = conn.cursor()
    cursor.execute("INSERT INTO categories (name) VALUES (?)", (category.name,))
    conn.commit()
    category_id = cursor.lastrowid
    return CategoryRead(id=category_id, name=category.name)


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
    cursor.execute("UPDATE categories SET name = ? WHERE id = ?", (update.name, category_id))
    conn.commit()
    return CategoryRead(id=category_id, name=update.name)
