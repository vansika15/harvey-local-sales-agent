"""Local embeddings service using Sentence Transformers and fallback cosine vectorizer.
Operates 100% locally with zero cloud API dependencies.
"""

import math
import re
from typing import List, Dict, Any
from backend.config import settings

_model_instance = None
_model_failed = False


def get_sentence_transformer():
    """Lazily load SentenceTransformer model if available."""
    global _model_instance, _model_failed
    if _model_instance is not None:
        return _model_instance
    if _model_failed:
        return None

    try:
        from sentence_transformers import SentenceTransformer
        # Attempt loading local weights
        _model_instance = SentenceTransformer(settings.EMBEDDING_MODEL, local_files_only=True)
        return _model_instance
    except Exception:
        # Fallback to local offline vectorizer
        _model_failed = True
        return None


def _tokenize(text: str) -> List[str]:
    """Tokenize and normalize text."""
    text = text.lower()
    return re.findall(r"\b[a-z0-9_-]{2,}\b", text)


def compute_local_tfidf_vector(text: str) -> Dict[str, float]:
    """Compute local normalized bag-of-words vector."""
    tokens = _tokenize(text)
    if not tokens:
        return {}
    tf = {}
    for t in tokens:
        tf[t] = tf.get(t, 0) + 1
    # Normalize length
    norm = math.sqrt(sum(v * v for v in tf.values()))
    return {k: v / norm for k, v in tf.items()}


def cosine_similarity(v1: Dict[str, float], v2: Dict[str, float]) -> float:
    """Compute cosine similarity between two sparse vector dicts."""
    common_keys = set(v1.keys()) & set(v2.keys())
    if not common_keys:
        return 0.0
    return sum(v1[k] * v2[k] for k in common_keys)


def calculate_semantic_similarity(text1: str, text2: str) -> float:
    """Calculate semantic similarity (0.0 to 1.0) between two text blocks locally."""
    if not text1.strip() or not text2.strip():
        return 0.0

    model = get_sentence_transformer()
    if model is not None:
        try:
            from sentence_transformers import util
            e1 = model.encode(text1, convert_to_tensor=True)
            e2 = model.encode(text2, convert_to_tensor=True)
            score = float(util.cos_sim(e1, e2)[0][0])
            return max(0.0, min(1.0, score))
        except Exception:
            pass

    # Fast offline fallback
    vec1 = compute_local_tfidf_vector(text1)
    vec2 = compute_local_tfidf_vector(text2)
    score = cosine_similarity(vec1, vec2)
    return round(max(0.0, min(1.0, score)), 4)
