"""
FastAPI application — RAG web app backend.
Exposes endpoints for asking questions, retrieving chunks, uploading docs,
and managing the vector index.
"""

import os
import pathlib
from contextlib import asynccontextmanager

# Use HF_HOME from environment if set (for cloud deployment), otherwise default
# On cloud platforms, set HF_HOME to a writable cache directory
_hf_cache = os.environ.get("HF_HOME", os.path.expanduser("~/.cache/huggingface"))
os.environ.setdefault("HF_HOME", _hf_cache)
os.environ.setdefault("TRANSFORMERS_CACHE", _hf_cache)

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from rag.pipeline import RAGPipeline
from models.schemas import (
    AskRequest, AskResponse, SourceResult,
    RetrieveRequest, RetrieveResponse,
    UploadResponse, HealthResponse, StatsResponse,
    SourcesResponse, RebuildResponse,
)

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
CORPUS_DIR = os.path.join(DATA_DIR, "rag_course_docs")

# Pipeline instance (global, initialized on startup)
pipeline = RAGPipeline(data_dir=DATA_DIR, corpus_dir=CORPUS_DIR)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize the RAG pipeline on startup."""
    print("=" * 50)
    print("Starting RAG Web App backend...")
    print(f"Data dir: {DATA_DIR}")
    print(f"Corpus dir: {CORPUS_DIR}")
    print(f"HF cache: {os.environ.get('HF_HOME')}")
    print("=" * 50)
    pipeline.initialize()
    yield
    print("Shutting down RAG Web App backend...")


app = FastAPI(
    title="RAG Web App API",
    description="Retrieval-Augmented Generation system built from a Kaggle notebook",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow all origins for deployment (Vercel frontend, local dev, etc.)
_app_origin = os.environ.get("FRONTEND_URL", "*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[_app_origin] if _app_origin != "*" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health", response_model=HealthResponse)
async def health():
    """Check if backend, model, and index are ready."""
    if not pipeline._initialized:
        return HealthResponse(status="starting", initialized=False)
    stats = pipeline.get_stats()
    return HealthResponse(
        status="ready",
        initialized=True,
        num_documents=stats["num_documents"],
        num_chunks=stats["num_chunks"],
        embedding_dimension=stats["embedding_dimension"],
    )


@app.post("/api/ask", response_model=AskResponse)
async def ask(request: AskRequest):
    """Send a question, get a grounded answer with source citations."""
    try:
        result = pipeline.ask(question=request.question, k=request.k, hybrid=request.hybrid)
        return AskResponse(
            answer=result["answer"],
            sources=[SourceResult(**s) for s in result["sources"]],
            top_score=result["top_score"],
            answerable=result["answerable"],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/retrieve", response_model=RetrieveResponse)
async def retrieve(request: RetrieveRequest):
    """Retrieve chunks without generating an answer (for debugging)."""
    try:
        results = pipeline.retrieve_only(
            question=request.question, k=request.k, hybrid=request.hybrid
        )
        top_score = results[0]["score"] if results else 0.0
        return RetrieveResponse(
            results=[SourceResult(**r) for r in results],
            top_score=top_score,
            answerable=top_score >= 0.4,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/upload", response_model=UploadResponse)
async def upload_document(file: UploadFile = File(...)):
    """Upload a .txt file to the corpus and rebuild the index."""
    if not file.filename.endswith(".txt"):
        raise HTTPException(status_code=400, detail="Only .txt files are supported")

    content = await file.read()
    text = content.decode("utf-8")

    pipeline.add_document(file.filename, text)
    stats = pipeline.get_stats()

    return UploadResponse(
        filename=file.filename,
        message=f"Added '{file.filename}' and rebuilt index",
        num_chunks=stats["num_chunks"],
    )


@app.get("/api/sources", response_model=SourcesResponse)
async def list_sources():
    """List all source documents in the corpus."""
    return SourcesResponse(sources=pipeline.list_sources())


@app.get("/api/stats", response_model=StatsResponse)
async def get_stats():
    """Return corpus and index statistics."""
    stats = pipeline.get_stats()
    return StatsResponse(**stats)


@app.post("/api/rebuild", response_model=RebuildResponse)
async def rebuild_index():
    """Force rebuild the FAISS index from all corpus documents."""
    pipeline.build_index()
    stats = pipeline.get_stats()
    return RebuildResponse(
        message="Index rebuilt successfully",
        num_chunks=stats["num_chunks"],
    )


@app.get("/")
async def root():
    """Root endpoint with API info."""
    return {
        "name": "RAG Web App API",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": [
            "GET /api/health",
            "POST /api/ask",
            "POST /api/retrieve",
            "POST /api/upload",
            "GET /api/sources",
            "GET /api/stats",
            "POST /api/rebuild",
        ],
    }
