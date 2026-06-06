import os

from dotenv import load_dotenv

# Load variables from a local .env file (no-op if the file is absent).
load_dotenv()


class Settings:
    """Application settings sourced from environment variables."""

    DATABASE_URL: str = os.getenv("DATABASE_URL", "")


settings = Settings()
