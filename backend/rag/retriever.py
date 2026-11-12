"""
Retrieval module — FAISS vector search + optional hybrid (TF-IDF) search.
Handles index building, persistence, and querying.
"""

import json
import os
from typing import List, Dict, Optional

import faiss
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer


class VectorStore:
    """
    Manages the FAISS index, chunk texts, source filenames, and optional
    TF-IDF index for hybrid search.
    """

    def __init__(self, dimension: int = 384):
        self.dimension = dimension
        self.index: Optional[faiss.IndexFlatIP] = None
        self.chunks: List[str] = []
        self.sources: List[str] = []
        self.tfidf: Optional[TfidfVectorizer] = None
        self.tfidf_matrix = None

    # ---- Index building ----

    def build_index(self, chunks: List[str], sources: List[str], embeddings: np.ndarray):
        """Build FAISS index from embeddings and store chunk/source metadata."""
        self.chunks = chunks
        self.sources = sources
        faiss.normalize_L2(embeddings)
        self.index = faiss.IndexFlatIP(self.dimension)
        self.index.add(embeddings)
        self._build_tfidf()

    def _build_tfidf(self):
        """Fit TF-IDF vectorizer on chunks for hybrid search."""
        self.tfidf = TfidfVectorizer().fit(self.chunks)
        self.tfidf_matrix = self.tfidf.transform(self.chunks)

    # ---- Persistence ----

    def save(self, data_dir: str):
        """Save FAISS index, chunks, and sources to disk."""
        os.makedirs(data_dir, exist_ok=True)
        faiss.write_index(self.index, os.path.join(data_dir, "rag.index"))
        with open(os.path.join(data_dir, "chunks.json"), "w", encoding="utf-8") as f:
            json.dump(self.chunks, f, ensure_ascii=False)
        with open(os.path.join(data_dir, "sources.json"), "w", encoding="utf-8") as f:
            json.dump(self.sources, f, ensure_ascii=False)
        print(f"[VectorStore] Saved index ({self.index.ntotal} vectors) to {data_dir}")

    def load(self, data_dir: str) -> bool:
        """Load FAISS index, chunks, and sources from disk. Returns False if missing."""
        index_path = os.path.join(data_dir, "rag.index")
        chunks_path = os.path.join(data_dir, "chunks.json")
        sources_path = os.path.join(data_dir, "sources.json")

        if not all(os.path.exists(p) for p in [index_path, chunks_path, sources_path]):
            return False

        self.index = faiss.read_index(index_path)
        with open(chunks_path, "r", encoding="utf-8") as f:
            self.chunks = json.load(f)
        with open(sources_path, "r", encoding="utf-8") as f:
            self.sources = json.load(f)
        self._build_tfidf()
        print(f"[VectorStore] Loaded index ({self.index.ntotal} vectors) from {data_dir}")
        return True

    # ---- Search ----

    def retrieve(self, query_embedding: np.ndarray, k: int = 5) -> List[Dict]:
        """Semantic search via FAISS. Returns list of {score, source, chunk, rank}."""
        faiss.normalize_L2(query_embedding)
        scores, ids = self.index.search(query_embedding, k)
        results = []
        for i in range(k):
            idx = int(ids[0][i])
            results.append({
                "rank": i + 1,
                "score": float(scores[0][i]),
                "source": self.sources[idx],
                "chunk": self.chunks[idx],
            })
        return results

    def hybrid_retrieve(self, query_embedding: np.ndarray, question: str,
                        k: int = 5, candidates: int = 20) -> List[Dict]:
        """
        Hybrid search: combine semantic (FAISS) + keyword (TF-IDF) scores.
        Each retriever gets `candidates` results, scores are normalized to 0-1,
        summed, and the top-k of the combined score are returned.
        """
        # Semantic search — get more candidates
        faiss.normalize_L2(query_embedding)
        sem_scores, sem_ids = self.index.search(query_embedding, candidates)
        sem = {int(sem_ids[0][i]): float(sem_scores[0][i]) for i in range(candidates)}

        # Keyword search — TF-IDF
        key_scores = (self.tfidf.transform([question]) @ self.tfidf_matrix.T).toarray()[0]
        key_top = key_scores.argsort()[::-1][:candidates]
        max_key = max(key_scores[key_top]) if len(key_top) > 0 and max(key_scores[key_top]) > 0 else 1.0
        key = {int(i): float(key_scores[i] / max_key) for i in key_top}

        # Combine
        combined = {}
        for idx, score in sem.items():
            combined[idx] = combined.get(idx, 0) + score
        for idx, score in key.items():
            combined[idx] = combined.get(idx, 0) + score

        ranked = sorted(combined.items(), key=lambda x: x[1], reverse=True)[:k]
        results = []
        for rank, (idx, score) in enumerate(ranked, start=1):
            results.append({
                "rank": rank,
                "score": float(score),
                "source": self.sources[idx],
                "chunk": self.chunks[idx],
            })
        return results
