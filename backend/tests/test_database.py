import pytest
from datetime import date, datetime


class TestDatabase:
    """Tests for database operations."""

    def test_init_database(self, db):
        """Test database initialization creates tables."""
        conn = db.get_connection()
        cursor = conn.cursor()

        # Check tables exist
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = {row[0] for row in cursor.fetchall()}

        assert "health_records" in tables
        assert "workouts" in tables
        assert "sleep_records" in tables
        assert "daily_summary" in tables
        assert "import_status" in tables

        conn.close()

    def test_insert_health_records(self, db):
        """Test inserting health records."""
        records = [
            ("HKQuantityTypeIdentifierStepCount", 5000, "count", "2024-01-14T08:00:00", "2024-01-14T09:00:00", "iPhone", None),
            ("HKQuantityTypeIdentifierStepCount", 3000, "count", "2024-01-14T12:00:00", "2024-01-14T13:00:00", "iPhone", None),
        ]

        db.insert_health_records(records)

        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM health_records")
        count = cursor.fetchone()[0]
        conn.close()

        assert count == 2

    def test_insert_workouts(self, db):
        """Test inserting workout records."""
        workouts = [
            ("HKWorkoutActivityTypeRunning", 30, 5.0, 300, "2024-01-14T18:00:00", "2024-01-14T18:30:00", "Apple Watch"),
        ]

        db.insert_workouts(workouts)

        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM workouts")
        count = cursor.fetchone()[0]
        conn.close()

        assert count == 1

    def test_insert_sleep_records(self, db):
        """Test inserting sleep records."""
        records = [
            ("HKCategoryValueSleepAnalysisAsleepCore", "2024-01-14T23:00:00", "2024-01-15T02:00:00", "Apple Watch"),
            ("HKCategoryValueSleepAnalysisAsleepDeep", "2024-01-15T02:00:00", "2024-01-15T04:00:00", "Apple Watch"),
        ]

        db.insert_sleep_records(records)

        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM sleep_records")
        count = cursor.fetchone()[0]
        conn.close()

        assert count == 2

    def test_get_import_status(self, db):
        """Test getting import status."""
        status = db.get_import_status()

        assert status["status"] == "idle"
        assert status["progress"] == 0
        assert status["records_imported"] == 0

    def test_update_import_status(self, db):
        """Test updating import status."""
        db.update_import_status("parsing", 50, 1000)

        status = db.get_import_status()

        assert status["status"] == "parsing"
        assert status["progress"] == 50
        assert status["records_imported"] == 1000

    def test_clear_database(self, db):
        """Test clearing all data."""
        # Insert some data
        records = [
            ("HKQuantityTypeIdentifierStepCount", 5000, "count", "2024-01-14T08:00:00", "2024-01-14T09:00:00", "iPhone", None),
        ]
        db.insert_health_records(records)

        # Clear
        db.clear_database()

        # Verify empty
        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM health_records")
        count = cursor.fetchone()[0]
        conn.close()

        assert count == 0

    def test_get_records_count(self, db):
        """Test getting total records count."""
        records = [
            ("HKQuantityTypeIdentifierStepCount", 5000, "count", "2024-01-14T08:00:00", "2024-01-14T09:00:00", "iPhone", None),
            ("HKQuantityTypeIdentifierStepCount", 3000, "count", "2024-01-14T12:00:00", "2024-01-14T13:00:00", "iPhone", None),
            ("HKQuantityTypeIdentifierHeartRate", 72, "count/min", "2024-01-14T08:00:00", "2024-01-14T08:00:00", "Apple Watch", None),
        ]
        db.insert_health_records(records)

        count = db.get_records_count()

        assert count == 3


class TestDailySummary:
    """Tests for daily summary operations."""

    def test_compute_daily_summaries(self, db):
        """Test computing daily summaries from raw data."""
        # Insert step records for same day
        records = [
            ("HKQuantityTypeIdentifierStepCount", 5000, "count", "2024-01-14T08:00:00", "2024-01-14T09:00:00", "iPhone", None),
            ("HKQuantityTypeIdentifierStepCount", 3000, "count", "2024-01-14T12:00:00", "2024-01-14T13:00:00", "iPhone", None),
            ("HKQuantityTypeIdentifierActiveEnergyBurned", 450, "kcal", "2024-01-14T08:00:00", "2024-01-14T20:00:00", "Apple Watch", None),
        ]
        db.insert_health_records(records)

        db.compute_daily_summaries()

        summary = db.get_daily_summary(date(2024, 1, 14))

        assert summary is not None
        assert summary["steps"] == 8000  # 5000 + 3000
        assert summary["active_calories"] == 450

    def test_get_summaries_in_range(self, db):
        """Test getting summaries for a date range."""
        # Insert data for multiple days
        records = [
            ("HKQuantityTypeIdentifierStepCount", 5000, "count", "2024-01-14T08:00:00", "2024-01-14T09:00:00", "iPhone", None),
            ("HKQuantityTypeIdentifierStepCount", 6000, "count", "2024-01-15T08:00:00", "2024-01-15T09:00:00", "iPhone", None),
            ("HKQuantityTypeIdentifierStepCount", 7000, "count", "2024-01-16T08:00:00", "2024-01-16T09:00:00", "iPhone", None),
        ]
        db.insert_health_records(records)
        db.compute_daily_summaries()

        summaries = db.get_summaries_in_range(date(2024, 1, 14), date(2024, 1, 16))

        assert len(summaries) == 3
        assert summaries[0]["steps"] == 5000
        assert summaries[1]["steps"] == 6000
        assert summaries[2]["steps"] == 7000

    def test_get_metric_history(self, db):
        """Test getting history for a specific metric."""
        records = [
            ("HKQuantityTypeIdentifierStepCount", 5000, "count", "2024-01-14T08:00:00", "2024-01-14T09:00:00", "iPhone", None),
            ("HKQuantityTypeIdentifierStepCount", 6000, "count", "2024-01-15T08:00:00", "2024-01-15T09:00:00", "iPhone", None),
        ]
        db.insert_health_records(records)
        db.compute_daily_summaries()

        history = db.get_metric_history("steps", date(2024, 1, 14), date(2024, 1, 15))

        assert len(history) == 2
        assert history[0]["value"] == 5000
        assert history[1]["value"] == 6000
