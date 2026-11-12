import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Trash2 } from 'lucide-react'
import MessageBubble from './MessageBubble'

function ChatWindow({ messages, loading, onAsk, onClear }) {
  const [input, setInput] = useState('')
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || loading) return
    onAsk(trimmed)
    setInput('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="flex flex-col h-full card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
        <div>
          <h2 className="text-sm font-medium text-gray-800">RAG chat</h2>
          <p className="text-xs text-gray-400">Ask questions about your course documents</p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
            title="Clear conversation"
          >
            <Trash2 size={14} />
            Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
            <div className="w-14 h-14 rounded-full bg-rag-light flex items-center justify-center">
              <Send size={24} className="text-rag-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500">Start asking questions</p>
              <p className="text-xs mt-1">Try: "What is precision?" or "What is RAG?"</p>
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} />
          ))
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
              <Loader2 size={18} className="text-gray-400 animate-spin" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-gray-200 px-4 py-3">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question..."
            rows="1"
            className="input-field resize-none flex-1 text-sm"
            disabled={loading}
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="btn-primary flex items-center gap-1.5 flex-shrink-0"
            style={{ height: '40px' }}
          >
            <Send size={16} />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </form>
    </div>
  )
}

export default ChatWindow
