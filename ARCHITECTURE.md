# Personal Health Dashboard - Architecture

## Overview

A local-first web application that parses Apple Health export data and presents interactive visualizations and insights. All data stays on your machine - nothing is sent to external servers.

## Tech Stack

### Backend
- **Python 3.11+** with **FastAPI** - lightweight, fast, excellent for data APIs
- **Pandas** - data parsing and analysis
- **SQLite** - local database for processed health data (fast queries, zero config)

### Frontend
- **React 18** with **TypeScript** - component-based UI
- **Vite** - fast dev server and bundler
- **Recharts** or **Chart.js** - interactive visualizations
- **TailwindCSS** - styling

### Data Pipeline
```
export.xml (Apple Health)
    → Python parser
    → SQLite database
    → FastAPI endpoints
    → React frontend
```

## Project Structure

```
personal-health-dashboard/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app entry
│   │   ├── parser.py            # Apple Health XML parser
│   │   ├── database.py          # SQLite setup and queries
│   │   ├── models.py            # Pydantic models
│   │   └── routers/
│   │       ├── health.py        # Health data endpoints
│   │       ├── insights.py      # Computed insights endpoints
│   │       └── upload.py        # Data import endpoint
│   ├── requirements.txt
│   └── tests/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── charts/
│   │   │   │   ├── StepsChart.tsx
│   │   │   │   ├── HeartRateChart.tsx
│   │   │   │   ├── SleepChart.tsx
│   │   │   │   └── WeightChart.tsx
│   │   │   └── insights/
│   │   │       ├── Trends.tsx
│   │   │       ├── Correlations.tsx
│   │   │       └── Summary.tsx
│   │   ├── hooks/
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── data/                        # gitignored, stores export.xml and SQLite db
├── ARCHITECTURE.md
└── README.md
```

## Data Model

### Core Tables

```sql
-- Raw health records
CREATE TABLE health_records (
    id INTEGER PRIMARY KEY,
    type TEXT NOT NULL,           -- e.g., "HKQuantityTypeIdentifierStepCount"
    value REAL,
    unit TEXT,
    start_date DATETIME,
    end_date DATETIME,
    source_name TEXT,
    device TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Workouts
CREATE TABLE workouts (
    id INTEGER PRIMARY KEY,
    workout_type TEXT,
    duration_minutes REAL,
    total_distance REAL,
    total_energy_burned REAL,
    start_date DATETIME,
    end_date DATETIME,
    source_name TEXT
);

-- Sleep analysis
CREATE TABLE sleep_records (
    id INTEGER PRIMARY KEY,
    sleep_type TEXT,              -- InBed, Asleep, Awake, etc.
    start_date DATETIME,
    end_date DATETIME,
    source_name TEXT
);

-- Daily aggregates (pre-computed for fast queries)
CREATE TABLE daily_summary (
    date DATE PRIMARY KEY,
    steps INTEGER,
    active_calories REAL,
    resting_heart_rate REAL,
    weight REAL,
    sleep_hours REAL,
    workout_minutes REAL
);
```

## Key Features

### 1. Data Import
- Drag-and-drop or file picker for `export.xml`
- Progress indicator for large files (can be 1GB+)
- Incremental import (only add new records)

### 2. Dashboard Views
- **Daily Summary** - today's metrics at a glance
- **Trends** - line charts over configurable time ranges
- **Calendar Heatmap** - activity visualization (GitHub-style)
- **Correlations** - discover relationships between metrics

### 3. Insights Engine
- **Averages & Trends** - rolling averages, trend direction
- **Personal Records** - best days for steps, workouts, etc.
- **Anomaly Detection** - unusual values highlighted
- **Goal Tracking** - customizable targets with progress
- **Correlations** - e.g., "You sleep better on days you walk 8k+ steps"

### 4. Supported Health Metrics
- Steps & distance
- Heart rate (resting, walking, workout)
- Sleep duration & quality
- Weight & body composition
- Workouts (type, duration, calories)
- Active & resting energy
- Flights climbed
- Stand hours
- Blood pressure (if available)
- Blood oxygen (if available)

## API Endpoints

```
GET  /api/health/summary?date=YYYY-MM-DD     # Daily summary
GET  /api/health/range?start=...&end=...     # Date range data
GET  /api/health/metrics/{metric_type}       # Specific metric history
GET  /api/insights/trends                    # Trend analysis
GET  /api/insights/correlations              # Metric correlations
GET  /api/insights/records                   # Personal bests
POST /api/upload                             # Import export.xml
GET  /api/status                             # Import status, last update
```

## Performance Considerations

1. **Large XML Parsing** - Use `iterparse` to stream XML, not load all into memory
2. **Pre-aggregation** - Compute daily summaries on import, not at query time
3. **Indexing** - Index on `type`, `start_date` for fast filtering
4. **Pagination** - All list endpoints support limit/offset
5. **Caching** - Cache expensive insight computations

## Security & Privacy

- **100% Local** - No external API calls, no telemetry
- **Data Directory** - All health data in gitignored `/data` folder
- **No Auth Required** - Runs on localhost only
- **Optional Encryption** - SQLite encryption extension available if needed

## Development Workflow

```bash
# Terminal 1 - Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

Access at `http://localhost:5173` (frontend) with API at `http://localhost:8000`

## Future Enhancements

- [ ] Export reports as PDF
- [ ] Compare time periods (this month vs last month)
- [ ] Custom metric tracking (mood, supplements, etc.)
- [ ] Integration with other data sources (Garmin, Fitbit export)
- [ ] Mobile-responsive design
- [ ] Dark mode
