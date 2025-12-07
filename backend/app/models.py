from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional


class HealthRecord(BaseModel):
    id: int
    type: str
    value: Optional[float]
    unit: Optional[str]
    start_date: datetime
    end_date: datetime
    source_name: Optional[str]


class Workout(BaseModel):
    id: int
    workout_type: str
    duration_minutes: Optional[float]
    total_distance: Optional[float]
    total_energy_burned: Optional[float]
    start_date: datetime
    end_date: datetime
    source_name: Optional[str]


class SleepRecord(BaseModel):
    id: int
    sleep_type: str
    start_date: datetime
    end_date: datetime
    source_name: Optional[str]


class DailySummary(BaseModel):
    date: date
    steps: Optional[int]
    active_calories: Optional[float]
    resting_heart_rate: Optional[float]
    weight: Optional[float]
    sleep_hours: Optional[float]
    workout_minutes: Optional[float]
    distance_km: Optional[float]
    flights_climbed: Optional[int]


class DateRangeRequest(BaseModel):
    start_date: date
    end_date: date


class MetricData(BaseModel):
    date: date
    value: float


class TrendInsight(BaseModel):
    metric: str
    current_avg: float
    previous_avg: float
    change_percent: float
    trend: str  # "up", "down", "stable"


class CorrelationInsight(BaseModel):
    metric1: str
    metric2: str
    correlation: float
    description: str


class PersonalRecord(BaseModel):
    metric: str
    value: float
    date: date
    unit: str


class ImportStatus(BaseModel):
    status: str  # "idle", "parsing", "complete", "error"
    progress: float  # 0-100
    records_imported: int
    last_import: Optional[datetime]
    error_message: Optional[str]
