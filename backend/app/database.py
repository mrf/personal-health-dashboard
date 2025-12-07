import sqlite3
from pathlib import Path
from datetime import date, datetime
from typing import Optional
import os

DATABASE_PATH = Path(__file__).parent.parent.parent / "data" / "health.db"


def get_connection() -> sqlite3.Connection:
    """Get a database connection with row factory."""
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DATABASE_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_database():
    """Initialize database tables."""
    conn = get_connection()
    cursor = conn.cursor()

    # Health records table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS health_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,
            value REAL,
            unit TEXT,
            start_date DATETIME,
            end_date DATETIME,
            source_name TEXT,
            device TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Workouts table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS workouts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            workout_type TEXT,
            duration_minutes REAL,
            total_distance REAL,
            total_energy_burned REAL,
            start_date DATETIME,
            end_date DATETIME,
            source_name TEXT
        )
    """)

    # Sleep records table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sleep_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sleep_type TEXT,
            start_date DATETIME,
            end_date DATETIME,
            source_name TEXT
        )
    """)

    # Daily summary table (pre-aggregated for fast queries)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS daily_summary (
            date DATE PRIMARY KEY,
            steps INTEGER,
            active_calories REAL,
            resting_heart_rate REAL,
            weight REAL,
            sleep_hours REAL,
            workout_minutes REAL,
            distance_km REAL,
            flights_climbed INTEGER
        )
    """)

    # Import status table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS import_status (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            status TEXT DEFAULT 'idle',
            progress REAL DEFAULT 0,
            records_imported INTEGER DEFAULT 0,
            last_import DATETIME,
            error_message TEXT
        )
    """)

    # Initialize import status if not exists
    cursor.execute("""
        INSERT OR IGNORE INTO import_status (id, status, progress, records_imported)
        VALUES (1, 'idle', 0, 0)
    """)

    # Create indexes for faster queries
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_health_type ON health_records(type)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_health_start_date ON health_records(start_date)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_health_type_date ON health_records(type, start_date)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_workouts_start_date ON workouts(start_date)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_sleep_start_date ON sleep_records(start_date)")

    conn.commit()
    conn.close()


def clear_database():
    """Clear all health data from database."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM health_records")
    cursor.execute("DELETE FROM workouts")
    cursor.execute("DELETE FROM sleep_records")
    cursor.execute("DELETE FROM daily_summary")
    cursor.execute("UPDATE import_status SET status='idle', progress=0, records_imported=0")
    conn.commit()
    conn.close()


def get_import_status() -> dict:
    """Get current import status."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM import_status WHERE id = 1")
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return {"status": "idle", "progress": 0, "records_imported": 0, "last_import": None, "error_message": None}


def update_import_status(status: str, progress: float = 0, records_imported: int = 0, error_message: str = None):
    """Update import status."""
    conn = get_connection()
    cursor = conn.cursor()
    if status == "complete":
        cursor.execute("""
            UPDATE import_status
            SET status=?, progress=?, records_imported=?, last_import=?, error_message=?
            WHERE id=1
        """, (status, progress, records_imported, datetime.now().isoformat(), error_message))
    else:
        cursor.execute("""
            UPDATE import_status
            SET status=?, progress=?, records_imported=?, error_message=?
            WHERE id=1
        """, (status, progress, records_imported, error_message))
    conn.commit()
    conn.close()


def insert_health_records(records: list):
    """Batch insert health records."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.executemany("""
        INSERT INTO health_records (type, value, unit, start_date, end_date, source_name, device)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, records)
    conn.commit()
    conn.close()


def insert_workouts(workouts: list):
    """Batch insert workout records."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.executemany("""
        INSERT INTO workouts (workout_type, duration_minutes, total_distance, total_energy_burned, start_date, end_date, source_name)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, workouts)
    conn.commit()
    conn.close()


def insert_sleep_records(records: list):
    """Batch insert sleep records."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.executemany("""
        INSERT INTO sleep_records (sleep_type, start_date, end_date, source_name)
        VALUES (?, ?, ?, ?)
    """, records)
    conn.commit()
    conn.close()


def compute_daily_summaries():
    """Compute daily summaries from raw health records."""
    conn = get_connection()
    cursor = conn.cursor()

    # Clear existing summaries
    cursor.execute("DELETE FROM daily_summary")

    # Get all unique dates
    cursor.execute("""
        SELECT DISTINCT DATE(start_date) as date FROM health_records
        UNION
        SELECT DISTINCT DATE(start_date) as date FROM workouts
        UNION
        SELECT DISTINCT DATE(start_date) as date FROM sleep_records
        ORDER BY date
    """)
    dates = [row[0] for row in cursor.fetchall()]

    for d in dates:
        if not d:
            continue

        # Steps
        cursor.execute("""
            SELECT SUM(value) FROM health_records
            WHERE type = 'HKQuantityTypeIdentifierStepCount'
            AND DATE(start_date) = ?
        """, (d,))
        steps = cursor.fetchone()[0]

        # Active calories
        cursor.execute("""
            SELECT SUM(value) FROM health_records
            WHERE type = 'HKQuantityTypeIdentifierActiveEnergyBurned'
            AND DATE(start_date) = ?
        """, (d,))
        active_calories = cursor.fetchone()[0]

        # Resting heart rate (average)
        cursor.execute("""
            SELECT AVG(value) FROM health_records
            WHERE type = 'HKQuantityTypeIdentifierRestingHeartRate'
            AND DATE(start_date) = ?
        """, (d,))
        resting_hr = cursor.fetchone()[0]

        # Weight (most recent of the day)
        cursor.execute("""
            SELECT value FROM health_records
            WHERE type = 'HKQuantityTypeIdentifierBodyMass'
            AND DATE(start_date) = ?
            ORDER BY start_date DESC LIMIT 1
        """, (d,))
        weight_row = cursor.fetchone()
        weight = weight_row[0] if weight_row else None

        # Distance
        cursor.execute("""
            SELECT SUM(value) FROM health_records
            WHERE type = 'HKQuantityTypeIdentifierDistanceWalkingRunning'
            AND DATE(start_date) = ?
        """, (d,))
        distance = cursor.fetchone()[0]
        # Convert to km if in meters
        if distance:
            distance = distance / 1000 if distance > 1000 else distance

        # Flights climbed
        cursor.execute("""
            SELECT SUM(value) FROM health_records
            WHERE type = 'HKQuantityTypeIdentifierFlightsClimbed'
            AND DATE(start_date) = ?
        """, (d,))
        flights = cursor.fetchone()[0]

        # Workout minutes
        cursor.execute("""
            SELECT SUM(duration_minutes) FROM workouts
            WHERE DATE(start_date) = ?
        """, (d,))
        workout_mins = cursor.fetchone()[0]

        # Sleep hours (sum of asleep time)
        cursor.execute("""
            SELECT SUM((JULIANDAY(end_date) - JULIANDAY(start_date)) * 24)
            FROM sleep_records
            WHERE sleep_type IN ('HKCategoryValueSleepAnalysisAsleepCore',
                                 'HKCategoryValueSleepAnalysisAsleepDeep',
                                 'HKCategoryValueSleepAnalysisAsleepREM',
                                 'HKCategoryValueSleepAnalysisAsleep')
            AND DATE(start_date) = ?
        """, (d,))
        sleep_hours = cursor.fetchone()[0]

        # Insert summary
        cursor.execute("""
            INSERT OR REPLACE INTO daily_summary
            (date, steps, active_calories, resting_heart_rate, weight, sleep_hours, workout_minutes, distance_km, flights_climbed)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (d, steps, active_calories, resting_hr, weight, sleep_hours, workout_mins, distance, flights))

    conn.commit()
    conn.close()


def get_daily_summary(target_date: date) -> Optional[dict]:
    """Get daily summary for a specific date."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM daily_summary WHERE date = ?", (target_date.isoformat(),))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def get_summaries_in_range(start_date: date, end_date: date) -> list:
    """Get daily summaries for a date range."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM daily_summary
        WHERE date >= ? AND date <= ?
        ORDER BY date
    """, (start_date.isoformat(), end_date.isoformat()))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def get_metric_history(metric_type: str, start_date: date, end_date: date) -> list:
    """Get history of a specific metric."""
    # SECURITY: Whitelist valid column names to prevent SQL injection
    # Only allow known metric types - reject anything else
    metric_map = {
        "steps": "steps",
        "calories": "active_calories",
        "heart_rate": "resting_heart_rate",
        "weight": "weight",
        "sleep": "sleep_hours",
        "workouts": "workout_minutes",
        "distance": "distance_km",
        "flights": "flights_climbed"
    }

    # Reject unknown metric types instead of using user input directly
    if metric_type not in metric_map:
        return []

    column = metric_map[metric_type]

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(f"""
        SELECT date, {column} as value FROM daily_summary
        WHERE date >= ? AND date <= ? AND {column} IS NOT NULL
        ORDER BY date
    """, (start_date.isoformat(), end_date.isoformat()))
    rows = cursor.fetchall()
    conn.close()
    return [{"date": row["date"], "value": row["value"]} for row in rows]


def get_all_workouts(start_date: date, end_date: date) -> list:
    """Get all workouts in a date range."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM workouts
        WHERE DATE(start_date) >= ? AND DATE(start_date) <= ?
        ORDER BY start_date DESC
    """, (start_date.isoformat(), end_date.isoformat()))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def get_records_count() -> int:
    """Get total count of health records."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM health_records")
    count = cursor.fetchone()[0]
    conn.close()
    return count


def get_date_range() -> tuple:
    """Get the date range of available data."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT MIN(date), MAX(date) FROM daily_summary")
    row = cursor.fetchone()
    conn.close()
    return (row[0], row[1]) if row else (None, None)
