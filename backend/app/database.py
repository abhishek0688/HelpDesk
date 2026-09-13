from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

# Format PostgreSQL URI if starting with postgres:// (older Heroku/AWS standard)
database_url = settings.DATABASE_URL
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

# Handle SQLite vs PostgreSQL connection arguments
connect_args = {}
if "sqlite" in database_url:
    connect_args = {"check_same_thread": False}

# Create SQLAlchemy Database Engine
engine = create_engine(
    database_url,
    connect_args=connect_args,
    pool_pre_ping=True
)

# Create SessionLocal class for handling database transactions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative base class for all SQLAlchemy database models
Base = declarative_base()

def get_db():
    """
    FastAPI dependency that yields a database session per request
    and closes the session when the request finishes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
