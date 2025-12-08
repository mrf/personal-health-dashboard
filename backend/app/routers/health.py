from fastapi import APIRouter, Query
from datetime import date, timedelta
from typing import Optional

from .. import database
from ..models import DailySummary, MetricData

router = APIRouter(prefix="/api/health", tags=["health"])


@router.get("/summary")
async def get_daily_summary(target_date: Optional[date] = Query(None)):
    """Get daily summary for a specific date (defaults to today)."""
    if target_date is None:
        target_date = date.today()

    summary = database.get_daily_summary(target_date)
    if summary:
        return summary
    return {
        "date": target_date.isoformat(),
        "steps": None,
        "active_calories": None,
        "resting_heart_rate": None,
        "weight": None,
        "sleep_hours": None,
        "workout_minutes": None,
        "distance_km": None,
        "flights_climbed": None,
    }


@router.get("/range")
async def get_summaries_range(
    start: date = Query(...),
    end: date = Query(...)
):
    """Get daily summaries for a date range."""
    summaries = database.get_summaries_in_range(start, end)
    return {"summaries": summaries, "count": len(summaries)}


@router.get("/metrics/{metric_type}")
async def get_metric_history(
    metric_type: str,
    start: Optional[date] = Query(None),
    end: Optional[date] = Query(None),
    days: int = Query(30)
):
    """Get history for a specific metric."""
    if end is None:
        end = date.today()
    if start is None:
        start = end - timedelta(days=days)

    data = database.get_metric_history(metric_type, start, end)
    return {"metric": metric_type, "data": data, "count": len(data)}


@router.get("/workouts")
async def get_workouts(
    start: Optional[date] = Query(None),
    end: Optional[date] = Query(None),
    days: int = Query(30)
):
    """Get workouts for a date range."""
    if end is None:
        end = date.today()
    if start is None:
        start = end - timedelta(days=days)

    workouts = database.get_all_workouts(start, end)
    return {"workouts": workouts, "count": len(workouts)}


@router.get("/date-range")
async def get_available_date_range():
    """Get the date range of available data."""
    min_date, max_date = database.get_date_range()
    return {"min_date": min_date, "max_date": max_date}


@router.get("/units")
async def get_units():
    """Get detected units for all metrics."""
    return database.get_all_units()


@router.get("/units/{metric}")
async def get_metric_unit(metric: str):
    """Get detected unit for a specific metric."""
    unit = database.get_unit(metric)
    return {"metric": metric, "unit": unit}


@router.post("/units/detect")
async def detect_units():
    """Detect and store units from existing health records."""
    units = database.detect_units_from_data()
    return {"message": "Units detected", "units": units}
