import { Sliders, Zap } from 'lucide-react'

function SettingsPanel({ k, setK, hybrid, setHybrid }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sliders size={16} className="text-gray-500" />
        <h3 className="text-sm font-medium text-gray-700">Retrieval settings</h3>
      </div>

      {/* k slider */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs text-gray-500">Top-k chunks</label>
          <span className="text-xs font-mono font-medium text-rag-primary bg-rag-light px-2 py-0.5 rounded">
            k={k}
          </span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          value={k}
          onChange={(e) => setK(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-rag-primary"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-0.5">
          <span>1</span>
          <span>5</span>
          <span>10</span>
        </div>
      </div>

      {/* Hybrid search toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-gray-500" />
          <div>
            <label className="text-xs text-gray-700 font-medium">Hybrid search</label>
            <p className="text-xs text-gray-400">Semantic + keyword (TF-IDF)</p>
          </div>
        </div>
        <button
          onClick={() => setHybrid(!hybrid)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            hybrid ? 'bg-rag-primary' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
              hybrid ? 'translate-x-5' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  )
}

export default SettingsPanel
