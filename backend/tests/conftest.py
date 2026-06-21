"""Pytest configuration that isolates tests from the development database.

The test suite uses ``SessionLocal()`` directly and commits rows, so without
isolation it pollutes whatever database ``DATABASE_URL`` points at. This module
redirects the whole app to a dedicated ``*_test`` database BEFORE any app
module is imported, creates the schema there, and truncates every table after
each test so cases stay independent and the real dev database is never touched.

Requirement: PostgreSQL must be reachable with the same credentials as the dev
database (the test database is created automatically if it doesn't exist).
"""

import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url

# --- 1. Point the app at a dedicated test database BEFORE importing it -------
# Load .env so we can read the developer's real DATABASE_URL, then derive a
# sibling ``<db>_test`` database and overwrite the env var. ``app.core.config``
# calls ``load_dotenv()`` too, but python-dotenv does not override variables
# already present in the environment, so our test URL wins.
load_dotenv()

_dev_url_str = os.environ.get("DATABASE_URL")
if not _dev_url_str:
    raise RuntimeError(
        "DATABASE_URL must be set (in the environment or backend/.env) to run "
        "the test suite."
    )

_dev_url = make_url(_dev_url_str)
_test_db_name = f"{_dev_url.database}_test"
_test_url = _dev_url.set(database=_test_db_name)
_maintenance_url = _dev_url.set(database="postgres")

# Make every later ``import app.*`` use the test database.
os.environ["DATABASE_URL"] = _test_url.render_as_string(hide_password=False)

# --- 2. Create the test database if it does not exist ------------------------
_admin_engine = create_engine(
    _maintenance_url.render_as_string(hide_password=False),
    isolation_level="AUTOCOMMIT",
)
with _admin_engine.connect() as conn:
    already = conn.execute(
        text("SELECT 1 FROM pg_database WHERE datname = :name"),
        {"name": _test_db_name},
    ).scalar()
    if not already:
        conn.execute(text(f'CREATE DATABASE "{_test_db_name}"'))
_admin_engine.dispose()

# --- 3. Create the schema on the test database -------------------------------
# Importing the app registers every model on the shared ``Base`` metadata and
# builds the engine bound to the (now test) DATABASE_URL.
import app.main  # noqa: E402,F401  (import for side effect: registers models)
from app.db.database import Base  # noqa: E402
from app.db.session import engine  # noqa: E402

Base.metadata.create_all(bind=engine)

import pytest  # noqa: E402

_ALL_TABLES = ", ".join(f'"{t.name}"' for t in Base.metadata.sorted_tables)


@pytest.fixture(autouse=True)
def _clean_database():
    """Truncate every table after each test so cases never leak into one another."""
    yield
    if _ALL_TABLES:
        with engine.begin() as conn:
            conn.execute(text(f"TRUNCATE {_ALL_TABLES} RESTART IDENTITY CASCADE"))
