"""Configuration settings for Harvey Local Sales Agent.
Zero-cost local architecture; all cloud LLMs explicitly prohibited.
"""

import os
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DB_PATH = PROJECT_ROOT / "harvey_sales.db"


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Harvey Local Sales Agent"
    APP_VERSION: str = "2.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    HOST: str = "127.0.0.1"
    PORT: int = 8000

    # Local SQLite Database (Resolved absolutely)
    DATABASE_URL: str = f"sqlite:///{DB_PATH.as_posix()}"

    # Ollama Local AI Inference
    OLLAMA_BASE_URL: str = "http://127.0.0.1:11434"
    OLLAMA_DEFAULT_MODEL: str = "qwen2.5:3b"
    OLLAMA_FALLBACK_MODEL: str = "qwen2.5:1.5b"
    OLLAMA_TIMEOUT_SECONDS: int = 60

    # Offline & Network Guardrails
    OFFLINE_MODE: bool = False
    ALLOW_PUBLIC_WEB_RESEARCH: bool = True
    SCRAPE_REQUEST_TIMEOUT: int = 10
    USER_AGENT: str = "HarveyLocalSalesAgent/2.0 (Permitted Research Bot; Respects robots.txt)"

    # Embeddings (Local Sentence Transformers)
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
