from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import health, insights, upload
from . import database

app = FastAPI(
    title="Personal Health Dashboard",
    description="Local API for Apple Health data visualization",
    version="1.0.0"
)

# CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router)
app.include_router(insights.router)
app.include_router(upload.router)


@app.on_event("startup")
async def startup():
    """Initialize database on startup."""
    database.init_database()


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "ok", "service": "Personal Health Dashboard API"}


@app.get("/api/overview")
async def get_overview():
    """Get a quick overview of the data."""
    status = database.get_import_status()
    date_range = database.get_date_range()
    records_count = database.get_records_count()

    return {
        "import_status": status.get("status", "idle"),
        "last_import": status.get("last_import"),
        "records_count": records_count,
        "date_range": {
            "min": date_range[0],
            "max": date_range[1]
        }
    }
