"""Central Ollama local AI inference service.
Strict zero-cloud-LLM architecture.
Handles local model inference, execution logging, failure handling, and task queuing.
"""

import time
import json
import socket
import logging
from urllib.parse import urlparse
from typing import Dict, Any, Optional, List
import httpx
from sqlalchemy.orm import Session
from backend.config import settings
from backend.models import ModelExecutionLog, TaskQueue

logger = logging.getLogger("harvey.ollama")


class OllamaUnavailableException(Exception):
    """Raised when the local Ollama service cannot be reached."""
    def __init__(self, message: str, workflow_name: str, queued: bool = True):
        super().__init__(message)
        self.workflow_name = workflow_name
        self.queued = queued


class OllamaService:
    def __init__(self, base_url: Optional[str] = None):
        self.base_url = (base_url or settings.OLLAMA_BASE_URL).rstrip("/")
        self.timeout = settings.OLLAMA_TIMEOUT_SECONDS
        self.default_model = settings.OLLAMA_DEFAULT_MODEL

    def _is_port_open(self) -> bool:
        """Fast (sub-30ms) probe to verify whether the Ollama socket is accepting connections."""
        try:
            parsed = urlparse(self.base_url)
            host = parsed.hostname or "127.0.0.1"
            port = parsed.port or 11434
            with socket.create_connection((host, port), timeout=0.08):
                return True
        except OSError:
            return False

    async def check_health(self) -> Dict[str, Any]:
        """Check if local Ollama daemon is reachable and list installed models."""
        if not self._is_port_open():
            return {
                "connected": False,
                "url": self.base_url,
                "models": [],
                "has_recommended_model": False,
            }

        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                res = await client.get(f"{self.base_url}/api/tags")
                if res.status_code == 200:
                    data = res.json()
                    models = [m.get("name") for m in data.get("models", [])]
                    return {
                        "connected": True,
                        "url": self.base_url,
                        "models": models,
                        "has_recommended_model": any(self.default_model in m for m in models),
                    }
        except Exception as e:
            logger.debug(f"Ollama health check failed: {e}")

        return {
            "connected": False,
            "url": self.base_url,
            "models": [],
            "has_recommended_model": False,
        }

    async def generate(
        self,
        prompt: str,
        workflow_name: str,
        system_prompt: Optional[str] = None,
        model: Optional[str] = None,
        db: Optional[Session] = None,
        temperature: float = 0.3,
        entity_type: Optional[str] = None,
        entity_id: Optional[int] = None,
        deterministic_fallback: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Execute local model inference via Ollama.
        
        Strict constraint: NEVER routes to cloud APIs.
        If Ollama is down:
        1. Queues task in SQLite TaskQueue
        2. Logs error in ModelExecutionLog
        3. Returns deterministic fallback if provided, or raises OllamaUnavailableException
        """
        model_name = model or self.default_model
        start_time = time.time()
        prompt_preview = (prompt[:300] + "...") if len(prompt) > 300 else prompt

        # 1. Fast socket probe before attempting HTTP request
        if not self._is_port_open():
            duration_ms = int((time.time() - start_time) * 1000)
            error_str = f"Local Ollama daemon not running at {self.base_url}"

            if db and entity_type and entity_id:
                task = TaskQueue(
                    workflow_name=workflow_name,
                    entity_type=entity_type,
                    entity_id=entity_id,
                    payload_json=json.dumps({
                        "prompt": prompt,
                        "system_prompt": system_prompt,
                        "model": model_name,
                        "temperature": temperature,
                    }),
                    status="pending",
                    attempts=1,
                    error_message=error_str,
                )
                db.add(task)

            if db:
                log_entry = ModelExecutionLog(
                    workflow_name=workflow_name,
                    model_name=model_name,
                    prompt_preview=prompt_preview,
                    response_preview=None,
                    execution_time_ms=duration_ms,
                    token_estimate=0,
                    status="queued" if (entity_type and entity_id) else "error",
                    is_offline=True,
                    error_message=error_str,
                )
                db.add(log_entry)
                db.commit()

            if deterministic_fallback is not None:
                return {
                    "text": deterministic_fallback,
                    "model": f"{model_name} (Deterministic Fallback / Queued for LLM)",
                    "duration_ms": duration_ms,
                    "tokens": 0,
                    "is_deterministic_preview": True,
                    "notice": "Ollama service was not reachable; generated deterministic preview and queued for local model processing.",
                }

            raise OllamaUnavailableException(
                f"Ollama local model '{model_name}' is currently unreachable at {self.base_url}. "
                "Ensure Ollama is running (`ollama serve`). Cloud fallback is strictly prohibited.",
                workflow_name=workflow_name,
                queued=(entity_type is not None and entity_id is not None),
            )

        # 2. Attempt local inference when socket is open
        try:
            payload: Dict[str, Any] = {
                "model": model_name,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": temperature,
                }
            }
            if system_prompt:
                payload["system"] = system_prompt

            req_timeout = httpx.Timeout(timeout=float(self.timeout), connect=2.0)
            async with httpx.AsyncClient(timeout=req_timeout) as client:
                res = await client.post(f"{self.base_url}/api/generate", json=payload)
                
                if res.status_code == 200:
                    data = res.json()
                    response_text = data.get("response", "").strip()
                    duration_ms = int((time.time() - start_time) * 1000)
                    token_count = data.get("eval_count") or int(len(response_text) / 4)

                    if db:
                        log_entry = ModelExecutionLog(
                            workflow_name=workflow_name,
                            model_name=model_name,
                            prompt_preview=prompt_preview,
                            response_preview=response_text[:400],
                            execution_time_ms=duration_ms,
                            token_estimate=token_count,
                            status="success",
                            is_offline=False,
                        )
                        db.add(log_entry)
                        db.commit()

                    return {
                        "text": response_text,
                        "model": model_name,
                        "duration_ms": duration_ms,
                        "tokens": token_count,
                        "is_deterministic_preview": False,
                    }
                else:
                    raise RuntimeError(f"Ollama returned HTTP status {res.status_code}: {res.text}")

        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            error_str = f"Local Ollama inference failed: {str(e)}"
            logger.warning(error_str)

            if db and entity_type and entity_id:
                task = TaskQueue(
                    workflow_name=workflow_name,
                    entity_type=entity_type,
                    entity_id=entity_id,
                    payload_json=json.dumps({
                        "prompt": prompt,
                        "system_prompt": system_prompt,
                        "model": model_name,
                        "temperature": temperature,
                    }),
                    status="pending",
                    attempts=1,
                    error_message=error_str,
                )
                db.add(task)

            if db:
                log_entry = ModelExecutionLog(
                    workflow_name=workflow_name,
                    model_name=model_name,
                    prompt_preview=prompt_preview,
                    response_preview=None,
                    execution_time_ms=duration_ms,
                    token_estimate=0,
                    status="queued" if (entity_type and entity_id) else "error",
                    is_offline=True,
                    error_message=error_str,
                )
                db.add(log_entry)
                db.commit()

            if deterministic_fallback is not None:
                return {
                    "text": deterministic_fallback,
                    "model": f"{model_name} (Deterministic Fallback / Queued for LLM)",
                    "duration_ms": duration_ms,
                    "tokens": 0,
                    "is_deterministic_preview": True,
                    "notice": "Ollama service was not reachable; generated deterministic preview and queued for local model processing.",
                }

            raise OllamaUnavailableException(
                f"Ollama local model '{model_name}' is currently unreachable at {self.base_url}. "
                "Ensure Ollama is running (`ollama serve`). Cloud fallback is strictly prohibited.",
                workflow_name=workflow_name,
                queued=(entity_type is not None and entity_id is not None),
            )


ollama_service = OllamaService()
