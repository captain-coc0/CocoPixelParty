import sqlite3
from pathlib import Path
import json

DB_PATH = Path(__file__).with_name("pixelparty.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS canvases (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                size INTEGER NOT NULL DEFAULT 64,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        """)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS canvas_snapshots (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                canvas_id INTEGER NOT NULL,
                pixels_json TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (canvas_id) REFERENCES canvases(id)
            )
        """)
        
def load_latest_canvas_snapshot(canvas_id):
    with get_db() as conn:
        row = conn.execute("""
            SELECT pixels_json
            FROM canvas_snapshots
            WHERE canvas_id = ?
            ORDER BY created_at DESC
            LIMIT 1
        """, (canvas_id,)).fetchone()

    if row:
        return json.loads(row["pixels_json"])

    return None