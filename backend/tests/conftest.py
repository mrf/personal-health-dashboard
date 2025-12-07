import pytest
import tempfile
import os
import asyncio
from pathlib import Path
from httpx import ASGITransport, AsyncClient

# Set test database path before importing app
TEST_DATA_DIR = tempfile.mkdtemp()
os.environ["HEALTH_DATA_DIR"] = TEST_DATA_DIR

from app.main import app
from app import database


class SyncTestClient:
    """Synchronous wrapper for async httpx client with ASGI transport."""
    def __init__(self, app):
        self._transport = ASGITransport(app=app)
        self._base_url = "http://test"
        self._app = app

    def _run(self, coro):
        return asyncio.get_event_loop().run_until_complete(coro)

    async def _request(self, method, url, **kwargs):
        async with AsyncClient(transport=self._transport, base_url=self._base_url) as client:
            return await getattr(client, method)(url, **kwargs)

    def get(self, url, **kwargs):
        return self._run(self._request('get', url, **kwargs))

    def post(self, url, **kwargs):
        return self._run(self._request('post', url, **kwargs))

    def delete(self, url, **kwargs):
        return self._run(self._request('delete', url, **kwargs))


@pytest.fixture(scope="function")
def client():
    """Create a test client for the FastAPI app."""
    # Override database path for tests
    database.DATABASE_PATH = Path(TEST_DATA_DIR) / "test_health.db"
    database.init_database()

    test_client = SyncTestClient(app)
    yield test_client

    # Cleanup
    if database.DATABASE_PATH.exists():
        database.DATABASE_PATH.unlink()


@pytest.fixture(scope="function")
def db():
    """Create a fresh test database."""
    database.DATABASE_PATH = Path(TEST_DATA_DIR) / "test_health.db"
    database.init_database()
    yield database

    # Cleanup
    if database.DATABASE_PATH.exists():
        database.DATABASE_PATH.unlink()


@pytest.fixture
def sample_health_xml():
    """Create a minimal sample Apple Health export XML."""
    return '''<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE HealthData [
]>
<HealthData locale="en_US">
    <ExportDate value="2024-01-15 10:00:00 -0500"/>
    <Me HKCharacteristicTypeIdentifierDateOfBirth="1990-01-01"/>
    <Record type="HKQuantityTypeIdentifierStepCount" sourceName="iPhone" unit="count" value="5000" startDate="2024-01-14 08:00:00 -0500" endDate="2024-01-14 09:00:00 -0500"/>
    <Record type="HKQuantityTypeIdentifierStepCount" sourceName="iPhone" unit="count" value="3000" startDate="2024-01-14 12:00:00 -0500" endDate="2024-01-14 13:00:00 -0500"/>
    <Record type="HKQuantityTypeIdentifierHeartRate" sourceName="Apple Watch" unit="count/min" value="72" startDate="2024-01-14 08:00:00 -0500" endDate="2024-01-14 08:00:00 -0500"/>
    <Record type="HKQuantityTypeIdentifierRestingHeartRate" sourceName="Apple Watch" unit="count/min" value="65" startDate="2024-01-14 00:00:00 -0500" endDate="2024-01-14 00:00:00 -0500"/>
    <Record type="HKQuantityTypeIdentifierActiveEnergyBurned" sourceName="Apple Watch" unit="kcal" value="450" startDate="2024-01-14 08:00:00 -0500" endDate="2024-01-14 20:00:00 -0500"/>
    <Record type="HKQuantityTypeIdentifierDistanceWalkingRunning" sourceName="iPhone" unit="km" value="4.5" startDate="2024-01-14 08:00:00 -0500" endDate="2024-01-14 20:00:00 -0500"/>
    <Record type="HKQuantityTypeIdentifierBodyMass" sourceName="Withings" unit="kg" value="75.5" startDate="2024-01-14 07:00:00 -0500" endDate="2024-01-14 07:00:00 -0500"/>
    <Record type="HKCategoryTypeIdentifierSleepAnalysis" sourceName="Apple Watch" value="HKCategoryValueSleepAnalysisAsleepCore" startDate="2024-01-14 23:00:00 -0500" endDate="2024-01-15 02:00:00 -0500"/>
    <Record type="HKCategoryTypeIdentifierSleepAnalysis" sourceName="Apple Watch" value="HKCategoryValueSleepAnalysisAsleepDeep" startDate="2024-01-15 02:00:00 -0500" endDate="2024-01-15 04:00:00 -0500"/>
    <Record type="HKCategoryTypeIdentifierSleepAnalysis" sourceName="Apple Watch" value="HKCategoryValueSleepAnalysisAsleepREM" startDate="2024-01-15 04:00:00 -0500" endDate="2024-01-15 06:00:00 -0500"/>
    <Workout workoutActivityType="HKWorkoutActivityTypeRunning" duration="30" totalDistance="5" totalEnergyBurned="300" startDate="2024-01-14 18:00:00 -0500" endDate="2024-01-14 18:30:00 -0500" sourceName="Apple Watch"/>
</HealthData>'''


@pytest.fixture
def sample_xml_file(sample_health_xml, tmp_path):
    """Create a temporary XML file with sample data."""
    xml_path = tmp_path / "export.xml"
    xml_path.write_text(sample_health_xml)
    return xml_path
