import os
import shutil
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, BackgroundTasks, HTTPException
from fastapi.responses import JSONResponse

from .. import database
from ..parser import parse_apple_health_export
from ..models import ImportStatus

router = APIRouter(prefix="/api", tags=["upload"])

DATA_DIR = Path(__file__).parent.parent.parent.parent / "data"

# SECURITY: Limit upload size to 3GB (Apple Health exports can be large)
MAX_UPLOAD_SIZE = 3 * 1024 * 1024 * 1024  # 3GB in bytes


def run_import(file_path: str):
    """Background task to run the import."""
    try:
        parse_apple_health_export(file_path)
    except Exception as e:
        database.update_import_status("error", 0, 0, str(e))


@router.post("/upload")
async def upload_health_export(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    """Upload and process Apple Health export.xml file."""
    # Check if already importing
    status = database.get_import_status()
    if status.get("status") == "parsing":
        raise HTTPException(status_code=409, detail="Import already in progress")

    # SECURITY: Validate filename - must end with .xml (case-insensitive)
    if not file.filename or not file.filename.lower().endswith(".xml"):
        raise HTTPException(status_code=400, detail="File must be an XML file")

    # SECURITY: Check content type if provided
    if file.content_type and file.content_type not in ["text/xml", "application/xml", "application/octet-stream"]:
        raise HTTPException(status_code=400, detail="Invalid content type for XML file")

    # Ensure data directory exists
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    # Save uploaded file with size limit check
    file_path = DATA_DIR / "export.xml"
    try:
        total_size = 0
        with open(file_path, "wb") as buffer:
            while chunk := file.file.read(8192):  # Read in 8KB chunks
                total_size += len(chunk)
                if total_size > MAX_UPLOAD_SIZE:
                    buffer.close()
                    file_path.unlink(missing_ok=True)  # Clean up partial file
                    raise HTTPException(status_code=413, detail="File too large (max 3GB)")
                buffer.write(chunk)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to save file")

    # Initialize database
    database.init_database()

    # Start background import
    background_tasks.add_task(run_import, str(file_path))

    return {"message": "Import started", "status": "parsing"}


@router.post("/upload/local")
async def import_local_file(background_tasks: BackgroundTasks):
    """Import export.xml from the data directory."""
    file_path = DATA_DIR / "export.xml"

    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail="No export.xml found in data directory. Please copy your Apple Health export there."
        )

    # Check if already importing
    status = database.get_import_status()
    if status.get("status") == "parsing":
        raise HTTPException(status_code=409, detail="Import already in progress")

    # Initialize database
    database.init_database()

    # Start background import
    background_tasks.add_task(run_import, str(file_path))

    return {"message": "Import started", "status": "parsing"}


@router.get("/status")
async def get_import_status():
    """Get current import status."""
    status = database.get_import_status()
    date_range = database.get_date_range()

    return {
        **status,
        "data_range": {
            "min_date": date_range[0],
            "max_date": date_range[1]
        }
    }


@router.delete("/data")
async def clear_all_data():
    """Clear all imported health data."""
    status = database.get_import_status()
    if status.get("status") == "parsing":
        raise HTTPException(status_code=409, detail="Cannot clear data during import")

    database.clear_database()
    return {"message": "All data cleared"}
