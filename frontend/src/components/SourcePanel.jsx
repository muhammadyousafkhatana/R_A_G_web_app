import { useState } from 'react'
import { FileText, ChevronDown, ChevronUp } from 'lucide-react'

function SourcePanel({ sources }) {
  const [expanded, setExpanded] = useState(false)
  const [openChunks, setOpenChunks] = useState({})

  const toggleChunk = (rank) => {
    setOpenChunks(prev => ({ ...prev, [rank]: !prev[rank] }))
  }

  return (
    <div className="w-full">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
      >
        <FileText size={14} />
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {sources.length} source{sources.length !== 1 ? 's' : ''} retrieved
        {expanded ? ' (hide)' : ' (show)'}
      </button>

      {expanded && (
        <div className="mt-2 space-y-2 w-full">
          {sources.map((src) => (
            <div
              key={src.rank}
              className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50"
            >
              <button
                onClick={() => toggleChunk(src.rank)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-600">#{src.rank}</span>
                  <span className="text-gray-700 font-medium truncate max-w-[200px]">
                    {src.source}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded text-xs font-mono ${
                    src.score >= 0.6
                      ? 'bg-green-100 text-green-700'
                      : src.score >= 0.4
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-red-700'
                  }`}>
                    {src.score.toFixed(3)}
                  </span>
                  {openChunks[src.rank] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </div>
              </button>
              {openChunks[src.rank] && (
                <div className="px-3 py-2 text-xs text-gray-600 bg-white border-t border-gray-200 max-h-48 overflow-y-auto whitespace-pre-wrap">
                  {src.chunk}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SourcePanel
