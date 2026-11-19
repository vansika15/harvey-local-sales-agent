"""Verification of Zero-Cost Local Architecture constraint.
Inspects codebase and environment to ensure zero cloud LLM dependencies or paid API keys.
"""

import os
from pathlib import Path

PROHIBITED_STRINGS = [
    "api.openai.com",
    "api.anthropic.com",
    "generativelanguage.googleapis.com",
    "OPENAI_API_KEY",
    "ANTHROPIC_API_KEY",
    "GEMINI_API_KEY",
    "CLAUDE_API_KEY",
]


def test_zero_cloud_api_dependencies():
    """Verify that backend codebase does not invoke any paid cloud LLM inference APIs."""
    backend_dir = Path(__file__).resolve().parent.parent
    
    for py_file in backend_dir.rglob("*.py"):
        if "test_no_cloud_leak" in py_file.name:
            continue
        content = py_file.read_text(encoding="utf-8", errors="ignore")
        for bad in PROHIBITED_STRINGS:
            assert bad not in content, f"Violation detected: Found '{bad}' in {py_file}"


def test_environment_variables_zero_cloud_keys():
    """Verify that no external cloud LLM keys are defined or required in environment."""
    for key in ["OPENAI_API_KEY", "ANTHROPIC_API_KEY", "GEMINI_API_KEY"]:
        # Should not be present or required for Harvey local sales agent
        assert os.environ.get(key) is None or os.environ.get(key) == "", f"Cloud key {key} found in environment!"
