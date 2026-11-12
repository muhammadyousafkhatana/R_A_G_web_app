"""
Embedding module — wraps sentence-transformers/all-MiniLM-L6-v2.
Produces 384-dimensional vectors, same as the notebook.
"""

import numpy as np
import torch
from transformers import AutoTokenizer, AutoModel
from typing import List


class Embedder:
    """Singleton-style embedder. Load the model once, embed many times."""

    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        self.model_name = model_name
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModel.from_pretrained(model_name)
        self.model.eval()
        self.dimension = 384

    def embed(self, texts: List[str], batch_size: int = 32) -> np.ndarray:
        """Embed a list of texts into a (N, 384) float32 numpy array."""
        vectors = []
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            encoded = self.tokenizer(
                batch, padding=True, truncation=True,
                max_length=256, return_tensors="pt"
            )
            with torch.no_grad():
                output = self.model(**encoded).last_hidden_state
            mask = encoded["attention_mask"].unsqueeze(-1)
            mean = (output * mask).sum(1) / mask.sum(1)
            vectors.append(mean.numpy())
        return np.vstack(vectors).astype("float32")

    def embed_single(self, text: str) -> np.ndarray:
        """Embed a single text string, returns (1, 384) array."""
        return self.embed([text])
