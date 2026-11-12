import { useState, useEffect } from 'react'
import { BookOpen } from 'lucide-react'
import ChatWindow from './components/ChatWindow'
import SettingsPanel from './components/SettingsPanel'
import UploadPanel from './components/UploadPanel'
import StatsPanel from './components/StatsPanel'
import { useRAG } from './hooks/useRAG'

function App() {
  const {
    messages, loading, error,
    health, stats, sources,
    checkHealth, loadStats, loadSources,
    ask, clearMessages,
  } = useRAG()

  const [k, setK] = useState(5)
  const [hybrid, setHybrid] = useState(false)

  useEffect(() => {
    checkHealth().then((h) => {
      if (h?.status === 'ready') {
        loadStats()
        loadSources()
      }
    })

    // Poll health every 10s until ready
    const interval = setInterval(() => {
      checkHealth().then((h) => {
        if (h?.status === 'ready') {
          loadStats()
          loadSources()
          clearInterval(interval)
        }
      })
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  const handleAsk = (question) => {
    ask(question, k, hybrid)
  }

  const handleUploaded = () => {
    loadStats()
    loadSources()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rag-primary flex items-center justify-center text-white font-bold text-sm">
              R
            </div>
            <div>
              <h1 className="text-sm font-semibold text-gray-800">RAG Web App</h1>
              <p className="text-xs text-gray-400 hidden sm:block">
                Retrieval-Augmented Generation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`w-2 h-2 rounded-full ${
              health?.status === 'ready' ? 'bg-green-500' : 'bg-amber-400 animate-pulse'
            }`}></span>
            <span className="text-xs text-gray-500 hidden sm:inline">
              {health?.status === 'ready'
                ? `${stats?.num_chunks || 0} chunks indexed`
                : 'Starting up...'}
            </span>
          </div>
        </div>
      </header>

      {/* Main layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 h-[calc(100vh-120px)]">
          {/* Chat — main area */}
          <div className="min-h-0">
            <ChatWindow
              messages={messages}
              loading={loading}
              onAsk={handleAsk}
              onClear={clearMessages}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-4 overflow-y-auto">
            <SettingsPanel k={k} setK={setK} hybrid={hybrid} setHybrid={setHybrid} />
            <UploadPanel onUploaded={handleUploaded} />
            <StatsPanel stats={stats} health={health} />

            {/* Source files list */}
            {sources.length > 0 && (
              <div className="card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen size={16} className="text-gray-500" />
                  <h3 className="text-sm font-medium text-gray-700">Corpus files</h3>
                </div>
                <ul className="space-y-1">
                  {sources.map((src) => (
                    <li key={src} className="text-xs text-gray-500 flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                      {src}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Error display */}
            {error && (
              <div className="card p-3 border-red-200 bg-red-50">
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
