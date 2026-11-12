import { useState, useCallback } from 'react'
import { askQuestion, getHealth, getStats, getSources } from '../api/client'

export function useRAG() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [health, setHealth] = useState(null)
  const [stats, setStats] = useState(null)
  const [sources, setSources] = useState([])

  const checkHealth = useCallback(async () => {
    try {
      const data = await getHealth()
      setHealth(data)
      return data
    } catch (e) {
      setError('Cannot connect to backend. Is it running on port 8000?')
      return null
    }
  }, [])

  const loadStats = useCallback(async () => {
    try {
      const data = await getStats()
      setStats(data)
    } catch (e) {
      console.error('Failed to load stats:', e)
    }
  }, [])

  const loadSources = useCallback(async () => {
    try {
      const data = await getSources()
      setSources(data.sources)
    } catch (e) {
      console.error('Failed to load sources:', e)
    }
  }, [])

  const ask = useCallback(async (question, k = 5, hybrid = false) => {
    setLoading(true)
    setError(null)

    // Add user message
    const userMsg = { role: 'user', content: question, timestamp: Date.now() }
    setMessages(prev => [...prev, userMsg])

    try {
      const result = await askQuestion(question, k, hybrid)

      // Add assistant message
      const assistantMsg = {
        role: 'assistant',
        content: result.answer,
        sources: result.sources,
        topScore: result.top_score,
        answerable: result.answerable,
        timestamp: Date.now(),
      }
      setMessages(prev => [...prev, assistantMsg])
      return result
    } catch (e) {
      const errorMsg = e.response?.data?.detail || e.message || 'Unknown error'
      setError(errorMsg)
      const errMsg = {
        role: 'assistant',
        content: `Error: ${errorMsg}`,
        isError: true,
        timestamp: Date.now(),
      }
      setMessages(prev => [...prev, errMsg])
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  return {
    messages,
    loading,
    error,
    health,
    stats,
    sources,
    checkHealth,
    loadStats,
    loadSources,
    ask,
    clearMessages,
  }
}
