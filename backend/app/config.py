import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """
    Application configuration settings.
    Beginner note: Settings can be overridden by environment variables in .env.
    """
    APP_NAME: str = "SupportDesk - Smart Technical Support Platform"
    APP_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database URL: defaults to local PostgreSQL or SQLite fallback for development
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./supportdesk.db")
    
    # SLA Response/Resolution Thresholds in Hours
    # Critical: 2 hrs, High: 4 hrs, Medium: 8 hrs, Low: 24 hrs
    SLA_HOURS_CRITICAL: int = 2
    SLA_HOURS_HIGH: int = 4
    SLA_HOURS_MEDIUM: int = 8
    SLA_HOURS_LOW: int = 24
    
    # CORS Origins (allowing React development server and Docker containers)
    CORS_ORIGINS: list = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:80",
        "*"
    ]

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
