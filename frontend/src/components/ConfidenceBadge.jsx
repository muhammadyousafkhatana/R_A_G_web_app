function ConfidenceBadge({ score, answerable }) {
  let level = 'low'
  let color = 'bg-red-100 text-red-700 border-red-300'
  let label = 'Low confidence'

  if (score >= 0.6) {
    level = 'high'
    color = 'bg-green-100 text-green-700 border-green-300'
    label = 'High confidence'
  } else if (score >= 0.4) {
    level = 'medium'
    color = 'bg-amber-100 text-amber-700 border-amber-300'
    label = 'Medium confidence'
  }

  if (!answerable) {
    color = 'bg-red-100 text-red-700 border-red-300'
    label = 'Likely unanswerable'
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${color}`}>
      <span className="w-2 h-2 rounded-full bg-current opacity-70"></span>
      {label} ({score.toFixed(3)})
    </span>
  )
}

export default ConfidenceBadge
