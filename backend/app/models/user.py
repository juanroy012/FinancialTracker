import sqlite3

def get_user_by_username(username: str, conn: sqlite3.Connection):
    row = conn.execute(
        "SELECT id, username, hashed_password FROM users WHERE username = ?",
        (username,),
    ).fetchone()
    return row

def create_user(username: str, hashed_password: str, conn: sqlite3.Connection ):
    cursor = conn.execute(
        "INSERT INTO users (username, hashed_password) VALUES (?,?)",
        (username, hashed_password),
    )
    conn.commit()
    return {"id": cursor.lastrowid, "username": username}