"""
RAG Pipeline orchestrator — ties together chunking, embedding, retrieval, and generation.
Handles corpus loading, index building, and the full ask flow.
"""

import os
import pathlib
from typing import List, Dict, Optional

from .chunker import recursive_chunk
from .embedder import Embedder
from .retriever import VectorStore
from .generator import Generator


class RAGPipeline:
    """
    Orchestrates the full RAG pipeline:
    1. Load corpus (.txt files)
    2. Chunk documents
    3. Embed chunks
    4. Build FAISS index
    5. On query: retrieve -> build prompt -> generate answer
    """

    def __init__(self, data_dir: str, corpus_dir: str, chunk_size: int = 300, chunk_overlap: int = 50):
        self.data_dir = data_dir
        self.corpus_dir = corpus_dir
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

        self.embedder: Optional[Embedder] = None
        self.store: Optional[VectorStore] = None
        self.generator: Optional[Generator] = None

        self._initialized = False

    def initialize(self):
        """Load models, build or load index. Called once at startup."""
        if self._initialized:
            return

        print("[RAGPipeline] Initializing...")

        # Load embedder
        self.embedder = Embedder()

        # Load or build vector store
        self.store = VectorStore(dimension=self.embedder.dimension)
        if not self.store.load(self.data_dir):
            print("[RAGPipeline] No saved index found, building from corpus...")
            self.build_index()
        else:
            print("[RAGPipeline] Loaded existing index from disk.")

        # Load generator
        self.generator = Generator()

        self._initialized = True
        print("[RAGPipeline] Ready.")

    def load_corpus(self) -> Dict[str, str]:
        """Load all .txt files from corpus directory."""
        corpus_path = pathlib.Path(self.corpus_dir)
        docs = {}
        for p in sorted(corpus_path.glob("*.txt")):
            docs[p.name] = p.read_text(encoding="utf-8")
        print(f"[RAGPipeline] Loaded {len(docs)} documents from {self.corpus_dir}")
        return docs

    def build_index(self):
        """Full rebuild: load corpus -> chunk -> embed -> build FAISS index -> save."""
        docs = self.load_corpus()

        chunks, sources = [], []
        for name, text in docs.items():
            for c in recursive_chunk(text, self.chunk_size, self.chunk_overlap):
                chunks.append(c)
                sources.append(name)

        print(f"[RAGPipeline] Chunked into {len(chunks)} pieces "
              f"(avg {sum(len(c) for c in chunks) / len(chunks):.0f} chars)")

        embeddings = self.embedder.embed(chunks)
        print(f"[RAGPipeline] Embeddings shape: {embeddings.shape}")

        self.store.build_index(chunks, sources, embeddings)
        self.store.save(self.data_dir)

    def add_document(self, filename: str, content: str):
        """Add a new document to the corpus and rebuild the index."""
        filepath = os.path.join(self.corpus_dir, filename)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"[RAGPipeline] Added document: {filename}")
        # Rebuild index with new corpus
        self.build_index()

    def ask(self, question: str, k: int = 5, hybrid: bool = False) -> Dict:
        """
        Full RAG flow: retrieve chunks -> build prompt -> generate answer.

        Returns dict with: answer, sources, top_score, answerable.
        """
        if not self._initialized:
            self.initialize()

        # Embed the question
        query_embedding = self.embedder.embed_single(question)

        # Retrieve
        if hybrid:
            results = self.store.hybrid_retrieve(query_embedding, question, k=k)
        else:
            results = self.store.retrieve(query_embedding, k=k)

        top_score = results[0]["score"] if results else 0.0
        # Score threshold from notebook: below 0.4 = likely unanswerable
        answerable = top_score >= 0.4

        # Build augmented prompt and generate
        prompt = self.generator.build_prompt(question, results, k=min(k, len(results)))
        answer = self.generator.generate(prompt)

        return {
            "answer": answer,
            "sources": results,
            "top_score": top_score,
            "answerable": answerable,
        }

    def retrieve_only(self, question: str, k: int = 5, hybrid: bool = False) -> List[Dict]:
        """Retrieve chunks without generating an answer (for debugging / display)."""
        if not self._initialized:
            self.initialize()

        query_embedding = self.embedder.embed_single(question)
        if hybrid:
            return self.store.hybrid_retrieve(query_embedding, question, k=k)
        else:
            return self.store.retrieve(query_embedding, k=k)

    def list_sources(self) -> List[str]:
        """Return unique source filenames in the corpus."""
        if not self._initialized:
            self.initialize()
        return sorted(set(self.store.sources))

    def get_stats(self) -> Dict:
        """Return corpus statistics."""
        if not self._initialized:
            self.initialize()
        chunks = self.store.chunks
        return {
            "num_documents": len(set(self.store.sources)),
            "num_chunks": len(chunks),
            "avg_chunk_length": round(sum(len(c) for c in chunks) / len(chunks), 1) if chunks else 0,
            "longest_chunk": max(len(c) for c in chunks) if chunks else 0,
            "shortest_chunk": min(len(c) for c in chunks) if chunks else 0,
            "index_size": self.store.index.ntotal,
            "embedding_dimension": self.embedder.dimension,
        }
