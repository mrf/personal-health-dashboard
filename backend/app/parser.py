"""
Apple Health XML Parser

Parses the export.xml file from Apple Health using streaming to handle large files.
"""

import os
from lxml import etree
from datetime import datetime
from typing import Generator, Tuple
from pathlib import Path

from . import database


# Secure XML parser - disable external entities to prevent XXE attacks
XML_PARSER = etree.XMLParser(
    resolve_entities=False,
    no_network=True,
    dtd_validation=False,
    load_dtd=False,
)


# Health record types we care about
QUANTITY_TYPES = {
    "HKQuantityTypeIdentifierStepCount",
    "HKQuantityTypeIdentifierDistanceWalkingRunning",
    "HKQuantityTypeIdentifierActiveEnergyBurned",
    "HKQuantityTypeIdentifierBasalEnergyBurned",
    "HKQuantityTypeIdentifierFlightsClimbed",
    "HKQuantityTypeIdentifierHeartRate",
    "HKQuantityTypeIdentifierRestingHeartRate",
    "HKQuantityTypeIdentifierWalkingHeartRateAverage",
    "HKQuantityTypeIdentifierBodyMass",
    "HKQuantityTypeIdentifierBodyMassIndex",
    "HKQuantityTypeIdentifierBodyFatPercentage",
    "HKQuantityTypeIdentifierHeight",
    "HKQuantityTypeIdentifierBloodPressureSystolic",
    "HKQuantityTypeIdentifierBloodPressureDiastolic",
    "HKQuantityTypeIdentifierOxygenSaturation",
    "HKQuantityTypeIdentifierRespiratoryRate",
    "HKQuantityTypeIdentifierAppleStandTime",
    "HKQuantityTypeIdentifierAppleExerciseTime",
}

SLEEP_TYPES = {
    "HKCategoryTypeIdentifierSleepAnalysis",
}


def parse_date(date_str: str) -> datetime:
    """Parse Apple Health date format."""
    try:
        return datetime.strptime(date_str, "%Y-%m-%d %H:%M:%S %z")
    except ValueError:
        try:
            return datetime.strptime(date_str, "%Y-%m-%d %H:%M:%S")
        except ValueError:
            return datetime.now()


def get_file_size(file_path: str) -> int:
    """Get file size in bytes."""
    return os.path.getsize(file_path)


def count_elements(file_path: str) -> int:
    """Quick count of Record and Workout elements for progress tracking."""
    count = 0
    # Use secure parser to prevent XXE attacks
    context = etree.iterparse(file_path, events=("end",), tag=("Record", "Workout"))
    context.root  # Force parser initialization
    for event, elem in context:
        count += 1
        elem.clear()
    return count


def parse_apple_health_export(file_path: str, progress_callback=None) -> dict:
    """
    Parse Apple Health export.xml file using streaming.

    Args:
        file_path: Path to export.xml
        progress_callback: Optional callback(progress_percent, records_count)

    Returns:
        dict with import statistics
    """
    database.clear_database()
    database.init_database()
    database.update_import_status("parsing", 0, 0)

    file_size = get_file_size(file_path)

    health_records = []
    workouts = []
    sleep_records = []

    record_count = 0
    batch_size = 5000
    bytes_read = 0

    try:
        context = etree.iterparse(file_path, events=("end",), tag=("Record", "Workout"))

        for event, elem in context:
            tag = elem.tag

            if tag == "Record":
                record_type = elem.get("type", "")

                # Health quantity records
                if record_type in QUANTITY_TYPES:
                    try:
                        value = float(elem.get("value", 0))
                    except (ValueError, TypeError):
                        value = None

                    record = (
                        record_type,
                        value,
                        elem.get("unit"),
                        parse_date(elem.get("startDate", "")).isoformat(),
                        parse_date(elem.get("endDate", "")).isoformat(),
                        elem.get("sourceName"),
                        elem.get("device"),
                    )
                    health_records.append(record)

                # Sleep records
                elif record_type in SLEEP_TYPES:
                    sleep_value = elem.get("value", "")
                    record = (
                        sleep_value,
                        parse_date(elem.get("startDate", "")).isoformat(),
                        parse_date(elem.get("endDate", "")).isoformat(),
                        elem.get("sourceName"),
                    )
                    sleep_records.append(record)

            elif tag == "Workout":
                try:
                    duration = float(elem.get("duration", 0))
                except (ValueError, TypeError):
                    duration = None

                try:
                    distance = float(elem.get("totalDistance", 0))
                except (ValueError, TypeError):
                    distance = None

                try:
                    energy = float(elem.get("totalEnergyBurned", 0))
                except (ValueError, TypeError):
                    energy = None

                workout = (
                    elem.get("workoutActivityType", ""),
                    duration,
                    distance,
                    energy,
                    parse_date(elem.get("startDate", "")).isoformat(),
                    parse_date(elem.get("endDate", "")).isoformat(),
                    elem.get("sourceName"),
                )
                workouts.append(workout)

            record_count += 1

            # Batch insert for performance
            if len(health_records) >= batch_size:
                database.insert_health_records(health_records)
                health_records = []

            if len(workouts) >= batch_size:
                database.insert_workouts(workouts)
                workouts = []

            if len(sleep_records) >= batch_size:
                database.insert_sleep_records(sleep_records)
                sleep_records = []

            # Update progress periodically
            if record_count % 10000 == 0:
                # Estimate progress based on position in file
                # This is approximate since we can't easily get byte position with iterparse
                progress = min(95, (record_count / 1000000) * 50)  # Rough estimate
                database.update_import_status("parsing", progress, record_count)
                if progress_callback:
                    progress_callback(progress, record_count)

            # Clear element to free memory
            elem.clear()
            while elem.getprevious() is not None:
                del elem.getparent()[0]

        # Insert remaining records
        if health_records:
            database.insert_health_records(health_records)
        if workouts:
            database.insert_workouts(workouts)
        if sleep_records:
            database.insert_sleep_records(sleep_records)

        # Compute daily summaries
        database.update_import_status("computing", 95, record_count)
        database.compute_daily_summaries()

        # Mark complete
        database.update_import_status("complete", 100, record_count)

        return {
            "status": "success",
            "records_imported": record_count,
            "health_records": database.get_records_count(),
        }

    except Exception as e:
        database.update_import_status("error", 0, record_count, str(e))
        raise


def parse_export_file(file_path: Path) -> dict:
    """Convenience wrapper for parsing."""
    return parse_apple_health_export(str(file_path))
