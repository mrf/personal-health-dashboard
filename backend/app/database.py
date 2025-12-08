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

    # Units table - stores detected units from import
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS units (
            metric TEXT PRIMARY KEY,
            unit TEXT NOT NULL
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
    """Clear all health data from database.

    Uses DROP TABLE instead of DELETE for performance with large datasets.
    """
    conn = get_connection()
    cursor = conn.cursor()

    # Drop and recreate tables - much faster than DELETE for millions of rows
    cursor.execute("DROP TABLE IF EXISTS health_records")
    cursor.execute("DROP TABLE IF EXISTS workouts")
    cursor.execute("DROP TABLE IF EXISTS sleep_records")
    cursor.execute("DROP TABLE IF EXISTS daily_summary")

    # Reset import status
    cursor.execute("UPDATE import_status SET status='idle', progress=0, records_imported=0")
    conn.commit()
    conn.close()

    # Recreate the tables
    init_database()


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


def set_unit(metric: str, unit: str):
    """Store the unit for a metric."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT OR REPLACE INTO units (metric, unit) VALUES (?, ?)",
        (metric, unit)
    )
    conn.commit()
    conn.close()


def get_unit(metric: str) -> str | None:
    """Get the stored unit for a metric."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT unit FROM units WHERE metric = ?", (metric,))
    row = cursor.fetchone()
    conn.close()
    return row[0] if row else None


def get_all_units() -> dict:
    """Get all stored units."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT metric, unit FROM units")
    rows = cursor.fetchall()
    conn.close()
    return {row[0]: row[1] for row in rows}


def detect_units_from_data():
    """Detect and store units from existing health_records data."""
    conn = get_connection()
    cursor = conn.cursor()

    metric_name_map = {
        "HKQuantityTypeIdentifierBodyMass": "weight",
        "HKQuantityTypeIdentifierStepCount": "steps",
        "HKQuantityTypeIdentifierDistanceWalkingRunning": "distance",
        "HKQuantityTypeIdentifierActiveEnergyBurned": "calories",
        "HKQuantityTypeIdentifierHeartRate": "heart_rate",
        "HKQuantityTypeIdentifierRestingHeartRate": "resting_heart_rate",
        "HKQuantityTypeIdentifierHeight": "height",
        "HKQuantityTypeIdentifierFlightsClimbed": "flights",
    }

    # Get first non-null unit for each type
    cursor.execute("""
        SELECT type, unit FROM health_records
        WHERE unit IS NOT NULL
        GROUP BY type
    """)
    rows = cursor.fetchall()

    for row in rows:
        hk_type, unit = row[0], row[1]
        metric_name = metric_name_map.get(hk_type, hk_type)
        cursor.execute(
            "INSERT OR REPLACE INTO units (metric, unit) VALUES (?, ?)",
            (metric_name, unit)
        )

    conn.commit()
    conn.close()
    return get_all_units()


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
    """Compute daily summaries from raw health records using efficient batch queries."""
    conn = get_connection()
    cursor = conn.cursor()

    # Clear existing summaries
    cursor.execute("DELETE FROM daily_summary")

    # Aggregate all health metrics in a single query with GROUP BY
    # This is much faster than per-day queries for large datasets
    cursor.execute("""
        INSERT INTO daily_summary (date, steps, active_calories, resting_heart_rate, distance_km, flights_climbed)
        SELECT
            DATE(start_date) as date,
            SUM(CASE WHEN type = 'HKQuantityTypeIdentifierStepCount' THEN value END) as steps,
            SUM(CASE WHEN type = 'HKQuantityTypeIdentifierActiveEnergyBurned' THEN value END) as active_calories,
            AVG(CASE WHEN type = 'HKQuantityTypeIdentifierRestingHeartRate' THEN value END) as resting_heart_rate,
            CASE
                WHEN SUM(CASE WHEN type = 'HKQuantityTypeIdentifierDistanceWalkingRunning' THEN value END) > 1000
                THEN SUM(CASE WHEN type = 'HKQuantityTypeIdentifierDistanceWalkingRunning' THEN value END) / 1000.0
                ELSE SUM(CASE WHEN type = 'HKQuantityTypeIdentifierDistanceWalkingRunning' THEN value END)
            END as distance_km,
            SUM(CASE WHEN type = 'HKQuantityTypeIdentifierFlightsClimbed' THEN value END) as flights_climbed
        FROM health_records
        WHERE DATE(start_date) IS NOT NULL
        GROUP BY DATE(start_date)
    """)

    # Update with weight (most recent per day) - use a subquery to get latest per day
    cursor.execute("""
        UPDATE daily_summary
        SET weight = (
            SELECT value FROM health_records hr
            WHERE hr.type = 'HKQuantityTypeIdentifierBodyMass'
            AND DATE(hr.start_date) = daily_summary.date
            ORDER BY hr.start_date DESC
            LIMIT 1
        )
        WHERE EXISTS (
            SELECT 1 FROM health_records hr
            WHERE hr.type = 'HKQuantityTypeIdentifierBodyMass'
            AND DATE(hr.start_date) = daily_summary.date
        )
    """)

    # Update with workout minutes
    cursor.execute("""
        UPDATE daily_summary
        SET workout_minutes = (
            SELECT SUM(duration_minutes) FROM workouts
            WHERE DATE(workouts.start_date) = daily_summary.date
        )
        WHERE EXISTS (
            SELECT 1 FROM workouts
            WHERE DATE(workouts.start_date) = daily_summary.date
        )
    """)

    # Update with sleep hours
    cursor.execute("""
        UPDATE daily_summary
        SET sleep_hours = (
            SELECT SUM((JULIANDAY(end_date) - JULIANDAY(start_date)) * 24)
            FROM sleep_records
            WHERE sleep_type IN (
                'HKCategoryValueSleepAnalysisAsleepCore',
                'HKCategoryValueSleepAnalysisAsleepDeep',
                'HKCategoryValueSleepAnalysisAsleepREM',
                'HKCategoryValueSleepAnalysisAsleep'
            )
            AND DATE(sleep_records.start_date) = daily_summary.date
        )
        WHERE EXISTS (
            SELECT 1 FROM sleep_records
            WHERE sleep_type IN (
                'HKCategoryValueSleepAnalysisAsleepCore',
                'HKCategoryValueSleepAnalysisAsleepDeep',
                'HKCategoryValueSleepAnalysisAsleepREM',
                'HKCategoryValueSleepAnalysisAsleep'
            )
            AND DATE(sleep_records.start_date) = daily_summary.date
        )
    """)

    # Insert any dates that only have workout or sleep data (no health_records)
    cursor.execute("""
        INSERT OR IGNORE INTO daily_summary (date, workout_minutes)
        SELECT DATE(start_date), SUM(duration_minutes)
        FROM workouts
        WHERE DATE(start_date) NOT IN (SELECT date FROM daily_summary)
        GROUP BY DATE(start_date)
    """)

    cursor.execute("""
        INSERT OR IGNORE INTO daily_summary (date, sleep_hours)
        SELECT DATE(start_date), SUM((JULIANDAY(end_date) - JULIANDAY(start_date)) * 24)
        FROM sleep_records
        WHERE sleep_type IN (
            'HKCategoryValueSleepAnalysisAsleepCore',
            'HKCategoryValueSleepAnalysisAsleepDeep',
            'HKCategoryValueSleepAnalysisAsleepREM',
            'HKCategoryValueSleepAnalysisAsleep'
        )
        AND DATE(start_date) NOT IN (SELECT date FROM daily_summary)
        GROUP BY DATE(start_date)
    """)

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
