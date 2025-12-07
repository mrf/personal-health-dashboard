from fastapi import APIRouter, Query
from datetime import date, timedelta
from typing import Optional
import statistics

from .. import database
from ..models import TrendInsight, CorrelationInsight, PersonalRecord

router = APIRouter(prefix="/api/insights", tags=["insights"])


def calculate_correlation(x: list, y: list) -> float:
    """Calculate Pearson correlation coefficient."""
    if len(x) != len(y) or len(x) < 3:
        return 0.0

    n = len(x)
    mean_x = sum(x) / n
    mean_y = sum(y) / n

    numerator = sum((x[i] - mean_x) * (y[i] - mean_y) for i in range(n))
    denominator_x = sum((xi - mean_x) ** 2 for xi in x) ** 0.5
    denominator_y = sum((yi - mean_y) ** 2 for yi in y) ** 0.5

    if denominator_x == 0 or denominator_y == 0:
        return 0.0

    return numerator / (denominator_x * denominator_y)


@router.get("/trends")
async def get_trends(days: int = Query(30)):
    """Get trend analysis for key metrics."""
    end_date = date.today()
    mid_date = end_date - timedelta(days=days)
    start_date = mid_date - timedelta(days=days)

    metrics = ["steps", "calories", "sleep", "heart_rate", "workouts"]
    trends = []

    for metric in metrics:
        # Get current period
        current_data = database.get_metric_history(metric, mid_date, end_date)
        # Get previous period
        previous_data = database.get_metric_history(metric, start_date, mid_date)

        current_values = [d["value"] for d in current_data if d["value"] is not None]
        previous_values = [d["value"] for d in previous_data if d["value"] is not None]

        if not current_values or not previous_values:
            continue

        current_avg = statistics.mean(current_values)
        previous_avg = statistics.mean(previous_values)

        if previous_avg > 0:
            change_percent = ((current_avg - previous_avg) / previous_avg) * 100
        else:
            change_percent = 0

        if change_percent > 5:
            trend = "up"
        elif change_percent < -5:
            trend = "down"
        else:
            trend = "stable"

        trends.append({
            "metric": metric,
            "current_avg": round(current_avg, 2),
            "previous_avg": round(previous_avg, 2),
            "change_percent": round(change_percent, 1),
            "trend": trend
        })

    return {"trends": trends, "period_days": days}


@router.get("/correlations")
async def get_correlations(days: int = Query(90)):
    """Find correlations between metrics."""
    end_date = date.today()
    start_date = end_date - timedelta(days=days)

    summaries = database.get_summaries_in_range(start_date, end_date)

    if len(summaries) < 7:
        return {"correlations": [], "message": "Not enough data for correlation analysis"}

    # Build aligned metric arrays
    metrics_data = {
        "steps": [],
        "calories": [],
        "sleep": [],
        "heart_rate": [],
        "workouts": [],
        "weight": []
    }

    metric_keys = {
        "steps": "steps",
        "calories": "active_calories",
        "sleep": "sleep_hours",
        "heart_rate": "resting_heart_rate",
        "workouts": "workout_minutes",
        "weight": "weight"
    }

    for s in summaries:
        for metric, key in metric_keys.items():
            metrics_data[metric].append(s.get(key))

    correlations = []
    pairs = [
        ("steps", "sleep", "More steps may improve sleep quality"),
        ("steps", "calories", "Steps and calorie burn are related"),
        ("sleep", "heart_rate", "Better sleep may lower resting heart rate"),
        ("workouts", "sleep", "Exercise may improve sleep"),
        ("workouts", "calories", "Workouts burn more calories"),
        ("steps", "weight", "Activity level and weight correlation"),
    ]

    for m1, m2, description in pairs:
        # Filter out None values while keeping alignment
        valid_pairs = [
            (metrics_data[m1][i], metrics_data[m2][i])
            for i in range(len(summaries))
            if metrics_data[m1][i] is not None and metrics_data[m2][i] is not None
        ]

        if len(valid_pairs) >= 7:
            x = [p[0] for p in valid_pairs]
            y = [p[1] for p in valid_pairs]
            corr = calculate_correlation(x, y)

            if abs(corr) > 0.2:  # Only show meaningful correlations
                correlations.append({
                    "metric1": m1,
                    "metric2": m2,
                    "correlation": round(corr, 3),
                    "description": description,
                    "strength": "strong" if abs(corr) > 0.6 else "moderate" if abs(corr) > 0.4 else "weak"
                })

    # Sort by absolute correlation strength
    correlations.sort(key=lambda x: abs(x["correlation"]), reverse=True)

    return {"correlations": correlations}


@router.get("/records")
async def get_personal_records():
    """Get personal best records."""
    min_date, max_date = database.get_date_range()
    if not min_date or not max_date:
        return {"records": []}

    summaries = database.get_summaries_in_range(
        date.fromisoformat(min_date),
        date.fromisoformat(max_date)
    )

    if not summaries:
        return {"records": []}

    records = []

    # Steps record
    steps_data = [(s["date"], s["steps"]) for s in summaries if s.get("steps")]
    if steps_data:
        best = max(steps_data, key=lambda x: x[1])
        records.append({
            "metric": "steps",
            "value": best[1],
            "date": best[0],
            "unit": "steps"
        })

    # Calories record
    cal_data = [(s["date"], s["active_calories"]) for s in summaries if s.get("active_calories")]
    if cal_data:
        best = max(cal_data, key=lambda x: x[1])
        records.append({
            "metric": "active_calories",
            "value": round(best[1], 1),
            "date": best[0],
            "unit": "kcal"
        })

    # Sleep record (best night)
    sleep_data = [(s["date"], s["sleep_hours"]) for s in summaries if s.get("sleep_hours") and s["sleep_hours"] > 0]
    if sleep_data:
        best = max(sleep_data, key=lambda x: x[1])
        records.append({
            "metric": "sleep",
            "value": round(best[1], 1),
            "date": best[0],
            "unit": "hours"
        })

    # Workout minutes record
    workout_data = [(s["date"], s["workout_minutes"]) for s in summaries if s.get("workout_minutes")]
    if workout_data:
        best = max(workout_data, key=lambda x: x[1])
        records.append({
            "metric": "workout_minutes",
            "value": round(best[1], 1),
            "date": best[0],
            "unit": "minutes"
        })

    # Distance record
    dist_data = [(s["date"], s["distance_km"]) for s in summaries if s.get("distance_km")]
    if dist_data:
        best = max(dist_data, key=lambda x: x[1])
        records.append({
            "metric": "distance",
            "value": round(best[1], 2),
            "date": best[0],
            "unit": "km"
        })

    # Flights record
    flights_data = [(s["date"], s["flights_climbed"]) for s in summaries if s.get("flights_climbed")]
    if flights_data:
        best = max(flights_data, key=lambda x: x[1])
        records.append({
            "metric": "flights_climbed",
            "value": best[1],
            "date": best[0],
            "unit": "flights"
        })

    return {"records": records}


@router.get("/weekly-summary")
async def get_weekly_summary():
    """Get summary statistics for the past week."""
    end_date = date.today()
    start_date = end_date - timedelta(days=7)

    summaries = database.get_summaries_in_range(start_date, end_date)

    if not summaries:
        return {"message": "No data available"}

    def safe_avg(values):
        filtered = [v for v in values if v is not None]
        return round(statistics.mean(filtered), 1) if filtered else None

    def safe_sum(values):
        filtered = [v for v in values if v is not None]
        return round(sum(filtered), 1) if filtered else None

    return {
        "period": {"start": start_date.isoformat(), "end": end_date.isoformat()},
        "averages": {
            "steps": safe_avg([s.get("steps") for s in summaries]),
            "active_calories": safe_avg([s.get("active_calories") for s in summaries]),
            "sleep_hours": safe_avg([s.get("sleep_hours") for s in summaries]),
            "resting_heart_rate": safe_avg([s.get("resting_heart_rate") for s in summaries]),
        },
        "totals": {
            "steps": safe_sum([s.get("steps") for s in summaries]),
            "active_calories": safe_sum([s.get("active_calories") for s in summaries]),
            "workout_minutes": safe_sum([s.get("workout_minutes") for s in summaries]),
            "flights_climbed": safe_sum([s.get("flights_climbed") for s in summaries]),
        },
        "days_with_data": len(summaries)
    }
