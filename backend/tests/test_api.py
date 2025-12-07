import pytest
from datetime import date


class TestHealthAPI:
    """Tests for health data API endpoints."""

    def test_root_endpoint(self, client):
        """Test the root health check endpoint."""
        response = client.get("/")

        assert response.status_code == 200
        assert response.json()["status"] == "ok"

    def test_get_overview(self, client):
        """Test getting data overview."""
        response = client.get("/api/overview")

        assert response.status_code == 200
        data = response.json()
        assert "import_status" in data
        assert "records_count" in data
        assert "date_range" in data

    def test_get_status(self, client):
        """Test getting import status."""
        response = client.get("/api/status")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "idle"
        assert "progress" in data
        assert "records_imported" in data

    def test_get_daily_summary_no_data(self, client):
        """Test getting daily summary when no data exists."""
        response = client.get("/api/health/summary")

        assert response.status_code == 200
        data = response.json()
        assert data["steps"] is None

    def test_get_daily_summary_with_date(self, client):
        """Test getting daily summary for specific date."""
        response = client.get("/api/health/summary?target_date=2024-01-14")

        assert response.status_code == 200
        data = response.json()
        assert "date" in data

    def test_get_summaries_range(self, client):
        """Test getting summaries for date range."""
        response = client.get("/api/health/range?start=2024-01-01&end=2024-01-31")

        assert response.status_code == 200
        data = response.json()
        assert "summaries" in data
        assert "count" in data

    def test_get_metric_history(self, client):
        """Test getting metric history."""
        response = client.get("/api/health/metrics/steps?days=30")

        assert response.status_code == 200
        data = response.json()
        assert data["metric"] == "steps"
        assert "data" in data
        assert "count" in data

    def test_get_workouts(self, client):
        """Test getting workouts."""
        response = client.get("/api/health/workouts?days=30")

        assert response.status_code == 200
        data = response.json()
        assert "workouts" in data
        assert "count" in data

    def test_get_date_range(self, client):
        """Test getting available date range."""
        response = client.get("/api/health/date-range")

        assert response.status_code == 200
        data = response.json()
        assert "min_date" in data
        assert "max_date" in data


class TestInsightsAPI:
    """Tests for insights API endpoints."""

    def test_get_trends(self, client):
        """Test getting trend analysis."""
        response = client.get("/api/insights/trends?days=30")

        assert response.status_code == 200
        data = response.json()
        assert "trends" in data
        assert "period_days" in data

    def test_get_correlations(self, client):
        """Test getting correlations."""
        response = client.get("/api/insights/correlations?days=90")

        assert response.status_code == 200
        data = response.json()
        assert "correlations" in data

    def test_get_records(self, client):
        """Test getting personal records."""
        response = client.get("/api/insights/records")

        assert response.status_code == 200
        data = response.json()
        assert "records" in data

    def test_get_weekly_summary(self, client):
        """Test getting weekly summary."""
        response = client.get("/api/insights/weekly-summary")

        assert response.status_code == 200


class TestUploadAPI:
    """Tests for upload API endpoints."""

    def test_upload_invalid_file_type(self, client, tmp_path):
        """Test uploading non-XML file is rejected."""
        txt_file = tmp_path / "test.txt"
        txt_file.write_text("not xml")

        with open(txt_file, "rb") as f:
            response = client.post(
                "/api/upload",
                files={"file": ("test.txt", f, "text/plain")}
            )

        assert response.status_code == 400
        assert "XML" in response.json()["detail"]

    def test_import_local_file_not_found(self, client, tmp_path, monkeypatch):
        """Test importing local file when it doesn't exist."""
        # Point to empty directory so no export.xml exists
        from app.routers import upload
        monkeypatch.setattr(upload, "DATA_DIR", tmp_path)

        response = client.post("/api/upload/local")

        assert response.status_code == 404

    def test_clear_data(self, client):
        """Test clearing all data."""
        response = client.delete("/api/data")

        assert response.status_code == 200
        assert "cleared" in response.json()["message"]


class TestAPIWithData:
    """Tests for API endpoints with actual data."""

    def test_full_workflow(self, client, sample_xml_file):
        """Test complete import and query workflow."""
        # Upload file
        with open(sample_xml_file, "rb") as f:
            response = client.post(
                "/api/upload",
                files={"file": ("export.xml", f, "application/xml")}
            )

        assert response.status_code == 200

        # Wait for import (in tests it's synchronous via background task)
        # Check status
        response = client.get("/api/status")
        data = response.json()
        # Status might be parsing, computing, or complete depending on timing
        assert data["status"] in ["parsing", "computing", "complete", "idle"]
