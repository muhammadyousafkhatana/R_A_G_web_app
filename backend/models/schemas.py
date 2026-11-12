"""
Pydantic schemas for API request/response validation.
"""

from pydantic import BaseModel, Field
from typing import List, Optional


class AskRequest(BaseModel):
    question: str = Field(..., min_length=1, description="The question to ask the RAG system")
    k: int = Field(default=5, ge=1, le=20, description="Number of chunks to retrieve")
    hybrid: bool = Field(default=False, description="Use hybrid search (semantic + keyword)")


class SourceResult(BaseModel):
    rank: int
    score: float
    source: str
    chunk: str


class AskResponse(BaseModel):
    answer: str
    sources: List[SourceResult]
    top_score: float
    answerable: bool


class RetrieveRequest(BaseModel):
    question: str = Field(..., min_length=1)
    k: int = Field(default=5, ge=1, le=20)
    hybrid: bool = Field(default=False)


class RetrieveResponse(BaseModel):
    results: List[SourceResult]
    top_score: float
    answerable: bool


class UploadResponse(BaseModel):
    filename: str
    message: str
    num_chunks: int


class HealthResponse(BaseModel):
    status: str
    initialized: bool
    num_documents: Optional[int] = None
    num_chunks: Optional[int] = None
    embedding_dimension: Optional[int] = None


class StatsResponse(BaseModel):
    num_documents: int
    num_chunks: int
    avg_chunk_length: float
    longest_chunk: int
    shortest_chunk: int
    index_size: int
    embedding_dimension: int


class SourcesResponse(BaseModel):
    sources: List[str]


class RebuildResponse(BaseModel):
    message: str
    num_chunks: int
