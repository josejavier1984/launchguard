import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[2]
DEFAULT_DB_PATH = BASE_DIR / "instance" / "launchguard.db"


class SnapshotStore:
    def __init__(self, db_path=DEFAULT_DB_PATH):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._initialize_database()

    def _connect(self):
        return sqlite3.connect(self.db_path)

    def _initialize_database(self):
        with self._connect() as connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS dns_snapshots (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    domain TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    records_json TEXT NOT NULL
                )
                """
            )

    def create_snapshot(self, domain, records):
        created_at = datetime.now(timezone.utc).isoformat()
        records_json = json.dumps(records)

        with self._connect() as connection:
            cursor = connection.execute(
                """
                INSERT INTO dns_snapshots (
                    domain,
                    created_at,
                    records_json
                )
                VALUES (?, ?, ?)
                """,
                (domain, created_at, records_json),
            )

            snapshot_id = cursor.lastrowid

        return {
            "id": snapshot_id,
            "domain": domain,
            "created_at": created_at,
            "records": records,
        }

    def get_snapshot(self, snapshot_id):
        with self._connect() as connection:
            row = connection.execute(
                """
                SELECT id, domain, created_at, records_json
                FROM dns_snapshots
                WHERE id = ?
                """,
                (snapshot_id,),
            ).fetchone()

        if row is None:
            return None

        return {
            "id": row[0],
            "domain": row[1],
            "created_at": row[2],
            "records": json.loads(row[3]),
        }