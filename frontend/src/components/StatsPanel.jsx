import { useEffect, useState } from 'react'
import { Activity, Database, FileText } from 'lucide-react'

function StatsPanel({ stats, health }) {
  if (!stats) return null

  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Activity size={16} className="text-gray-500" />
        <h3 className="text-sm font-medium text-gray-700">System stats</h3>
      </div>

      <div className="space-y-2.5">
        <StatRow
          icon={<Database size={14} />}
          label="Documents"
          value={stats.num_documents}
        />
        <StatRow
          icon={<FileText size={14} />}
          label="Chunks"
          value={stats.num_chunks}
        />
        <StatRow
          label="Avg chunk length"
          value={`${stats.avg_chunk_length} chars`}
        />
        <StatRow
          label="Longest chunk"
          value={`${stats.longest_chunk} chars`}
        />
        <StatRow
          label="Shortest chunk"
          value={`${stats.shortest_chunk} chars`}
        />
        <StatRow
          label="Index size"
          value={stats.index_size}
        />
        <StatRow
          label="Embedding dim"
          value={stats.embedding_dimension}
        />
      </div>

      {/* Backend status */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${
            health?.status === 'ready' ? 'bg-green-500' : 'bg-amber-400'
          }`}></span>
          <span className="text-xs text-gray-500">
            Backend: {health?.status || 'connecting...'}
          </span>
        </div>
      </div>
    </div>
  )
}

function StatRow({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center gap-1.5 text-gray-500">
        {icon}
        <span>{label}</span>
      </div>
      <span className="font-mono font-medium text-gray-700">{value}</span>
    </div>
  )
}

export default StatsPanel
