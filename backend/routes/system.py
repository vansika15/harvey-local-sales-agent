"""System endpoints: health, hardware awareness, model logs, and offline task queue.
"""

from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.config import settings
from backend.models import ModelExecutionLog, TaskQueue
from backend.schemas import (
    SystemHealthResponse, HardwareProfileResponse,
    ModelExecutionLogResponse, TaskQueueResponse
)
from backend.services.hardware_service import detect_system_hardware
from backend.services.ollama_service import ollama_service

router = APIRouter(prefix="/api/system", tags=["System & Diagnostics"])


@router.get("/health", response_model=SystemHealthResponse)
async def get_system_health(db: Session = Depends(get_db)):
    """Check connectivity to local Ollama instance and count pending offline tasks."""
    ollama_health = await ollama_service.check_health()
    pending_tasks = db.query(TaskQueue).filter(TaskQueue.status == "pending").count()

    return {
        "status": "healthy" if ollama_health["connected"] else "degraded",
        "ollama_connected": ollama_health["connected"],
        "ollama_url": ollama_health["url"],
        "active_model": settings.OLLAMA_DEFAULT_MODEL,
        "available_models": ollama_health.get("models", []),
        "offline_mode": settings.OFFLINE_MODE,
        "pending_tasks_count": pending_tasks,
        "environment": settings.ENVIRONMENT,
    }


@router.get("/hardware", response_model=HardwareProfileResponse)
async def get_hardware_profile():
    """Detect OS, CPU, RAM, GPU, and recommend model configuration."""
    return detect_system_hardware()


@router.get("/logs", response_model=List[ModelExecutionLogResponse])
def get_model_execution_logs(
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Retrieve audit log of local model inference executions."""
    logs = db.query(ModelExecutionLog).order_by(ModelExecutionLog.created_at.desc()).limit(limit).all()
    return logs


@router.get("/queue", response_model=List[TaskQueueResponse])
def get_task_queue(db: Session = Depends(get_db)):
    """Retrieve queued tasks created while local model was offline."""
    return db.query(TaskQueue).order_by(TaskQueue.created_at.desc()).limit(50).all()


@router.post("/toggle-offline")
def toggle_offline_mode(enabled: bool):
    """Toggle strict offline mode (disables all external HTTP traffic)."""
    settings.OFFLINE_MODE = enabled
    return {
        "offline_mode": settings.OFFLINE_MODE,
        "message": "Offline mode enabled. All external web requests blocked." if enabled else "Online mode enabled."
    }
