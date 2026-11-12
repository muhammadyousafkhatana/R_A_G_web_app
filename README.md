# RAG Web App

A full Retrieval-Augmented Generation web application built from a Kaggle notebook.
React frontend + FastAPI backend, with the complete RAG pipeline: chunking, embeddings,
FAISS vector search, and LLM generation.

## Architecture

```
rag-webapp/
├── backend/               # FastAPI + RAG pipeline
│   ├── main.py            # FastAPI app with all API endpoints
│   ├── rag/               # RAG pipeline modules (extracted from notebook)
│   │   ├── chunker.py     # Recursive text chunking
│   │   ├── embedder.py    # all-MiniLM-L6-v2 embeddings (384-dim)
│   │   ├── retriever.py   # FAISS index + hybrid TF-IDF search
│   │   ├── generator.py   # Qwen2.5 / DeepSeek answer generation
│   │   └── pipeline.py    # Orchestrates the full pipeline
│   ├── models/
│   │   └── schemas.py     # Pydantic request/response models
│   ├── data/
│   │   └── rag_course_docs/  # 13 course document .txt files
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/              # React + Vite + TailwindCSS
│   ├── src/
│   │   ├── App.jsx        # Main layout with chat + sidebar
│   │   ├── components/
│   │   │   ├── ChatWindow.jsx       # Chat interface
│   │   │   ├── MessageBubble.jsx    # Message rendering with markdown
│   │   │   ├── SourcePanel.jsx      # Collapsible source citations
│   │   │   ├── ConfidenceBadge.jsx  # Score-based confidence indicator
│   │   │   ├── SettingsPanel.jsx    # k slider + hybrid search toggle
│   │   │   ├── UploadPanel.jsx      # Document upload (drag & drop)
│   │   │   └── StatsPanel.jsx       # System statistics display
│   │   ├── hooks/
│   │   │   └── useRAG.js            # React hook for API calls
│   │   └── api/
│   │       └── client.js            # Axios API client
│   ├── package.json
│   └── Dockerfile
│
├── docker-compose.yml
└── README.md
```

## Quick start (local development)

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend will:
- Load the embedding model (all-MiniLM-L6-v2) on first startup
- Build the FAISS index from the 13 .txt files in `data/rag_course_docs/`
- Save the index to `data/rag.index` for fast subsequent startups
- Serve API docs at http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at http://localhost:5173.

### 3. Using Docker

```bash
docker-compose up --build
```

Backend on port 8000, frontend on port 5173.

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/health` | Check backend status |
| POST   | `/api/ask` | Ask a question, get answer + sources |
| POST   | `/api/retrieve` | Retrieve chunks without generating |
| POST   | `/api/upload` | Upload a .txt file to corpus |
| GET    | `/api/sources` | List all source documents |
| GET    | `/api/stats` | Get corpus statistics |
| POST   | `/api/rebuild` | Force rebuild the FAISS index |

## Configuration

### Generation model

By default, the app uses **Qwen2.5-1.5B-Instruct** locally (same as the notebook).

To use **DeepSeek via HuggingFace API** instead:

1. Copy `backend/.env.example` to `backend/.env`
2. Set `HF_TOKEN=your_token`
3. Set `USE_DEEPSEEK=true`
4. Optionally set `DEEPSEEK_MODEL=deepseek-ai/DeepSeek-R1`

## RAG pipeline details

This pipeline is extracted directly from the Kaggle notebook `notebook0bf973e4e4.ipynb`:

1. **Corpus**: 13 text files covering AI fundamentals, Huawei ecosystem, Python,
   NumPy/Pandas, ML, HuggingFace, computer vision, evaluation metrics, RAG, and more.
2. **Chunking**: Recursive chunking with chunk_size=300, overlap=50. Splits by
   paragraph > line > sentence > space, in that order.
3. **Embeddings**: `sentence-transformers/all-MiniLM-L6-v2` produces 384-dim vectors.
4. **Vector DB**: FAISS `IndexFlatIP` with L2-normalized vectors (cosine similarity).
   Index persisted to disk as `rag.index`.
5. **Retrieval**: Top-k search, configurable k (1-10). Optional hybrid search
   combining semantic + TF-IDF keyword scores.
6. **Generation**: Augmented prompt with grounding instruction. Model answers only
   from retrieved context, cites sources, says "I do not know" if unanswerable.
7. **Confidence scoring**: Top retrieval score indicates answerability.
   Score >= 0.6 = high confidence, 0.4-0.6 = medium, < 0.4 = likely unanswerable.
