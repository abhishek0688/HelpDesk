from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import engine, Base
# Import all models to ensure they are registered with Base.metadata
import app.models
from app.routes import (
    tickets,
    troubleshooting,
    rca,
    resolution,
    escalation,
    kb,
    dashboard,
    analytics
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application startup event.
    Automatically ensures all database tables exist.
    """
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Smart Technical Support and Incident Management Platform REST API",
    lifespan=lifespan
)

# Configure Cross-Origin Resource Sharing (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register All API Routers
app.include_router(tickets.router, prefix=settings.API_V1_STR)
app.include_router(troubleshooting.router, prefix=settings.API_V1_STR)
app.include_router(rca.router, prefix=settings.API_V1_STR)
app.include_router(resolution.router, prefix=settings.API_V1_STR)
app.include_router(escalation.router, prefix=settings.API_V1_STR)
app.include_router(kb.router, prefix=settings.API_V1_STR)
app.include_router(dashboard.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)

@app.get("/", tags=["Health"])
def health_check():
    """
    Root health check endpoint.
    """
    return {
        "status": "online",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
