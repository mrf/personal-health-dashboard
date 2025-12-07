import pytest
from app.parser import parse_date, parse_apple_health_export


class TestParser:
    """Tests for Apple Health XML parser."""

    def test_parse_date_with_timezone(self):
        """Test parsing date with timezone."""
        date_str = "2024-01-14 08:00:00 -0500"
        result = parse_date(date_str)

        assert result.year == 2024
        assert result.month == 1
        assert result.day == 14
        assert result.hour == 8

    def test_parse_date_without_timezone(self):
        """Test parsing date without timezone."""
        date_str = "2024-01-14 08:00:00"
        result = parse_date(date_str)

        assert result.year == 2024
        assert result.month == 1
        assert result.day == 14

    def test_parse_apple_health_export(self, sample_xml_file, db):
        """Test parsing a complete Apple Health export file."""
        result = parse_apple_health_export(str(sample_xml_file))

        assert result["status"] == "success"
        assert result["records_imported"] > 0

    def test_parse_creates_health_records(self, sample_xml_file, db):
        """Test that parsing creates health records in database."""
        parse_apple_health_export(str(sample_xml_file))

        count = db.get_records_count()
        assert count > 0

    def test_parse_creates_workouts(self, sample_xml_file, db):
        """Test that parsing creates workout records."""
        parse_apple_health_export(str(sample_xml_file))

        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM workouts")
        count = cursor.fetchone()[0]
        conn.close()

        assert count == 1

    def test_parse_creates_sleep_records(self, sample_xml_file, db):
        """Test that parsing creates sleep records."""
        parse_apple_health_export(str(sample_xml_file))

        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM sleep_records")
        count = cursor.fetchone()[0]
        conn.close()

        assert count == 3  # 3 sleep stages in sample

    def test_parse_computes_daily_summaries(self, sample_xml_file, db):
        """Test that parsing computes daily summaries."""
        parse_apple_health_export(str(sample_xml_file))

        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM daily_summary")
        count = cursor.fetchone()[0]
        conn.close()

        assert count > 0

    def test_parse_updates_import_status(self, sample_xml_file, db):
        """Test that parsing updates import status to complete."""
        parse_apple_health_export(str(sample_xml_file))

        status = db.get_import_status()

        assert status["status"] == "complete"
        assert status["progress"] == 100

    def test_parse_empty_file(self, tmp_path, db):
        """Test parsing an empty/minimal XML file."""
        xml_content = '''<?xml version="1.0" encoding="UTF-8"?>
<HealthData locale="en_US">
</HealthData>'''

        xml_path = tmp_path / "empty.xml"
        xml_path.write_text(xml_content)

        result = parse_apple_health_export(str(xml_path))

        assert result["status"] == "success"
        assert result["records_imported"] == 0
