import ReactMarkdown from 'react-markdown'
import { User, Bot, AlertCircle } from 'lucide-react'
import ConfidenceBadge from './ConfidenceBadge'
import SourcePanel from './SourcePanel'

function MessageBubble({ message }) {
  const isUser = message.role === 'user'
  const isError = message.isError

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
        isUser
          ? 'bg-rag-primary text-white'
          : isError
            ? 'bg-red-100 text-red-600'
            : 'bg-gray-100 text-gray-600'
      }`}>
        {isUser ? <User size={18} /> : isError ? <AlertCircle size={18} /> : <Bot size={18} />}
      </div>

      {/* Message content */}
      <div className={`flex flex-col gap-2 max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-rag-primary text-white rounded-tr-sm'
            : isError
              ? 'bg-red-50 text-red-700 border border-red-200 rounded-tl-sm'
              : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
        }`}>
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="text-sm leading-relaxed prose prose-sm max-w-none">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Confidence badge for assistant messages */}
        {!isUser && !isError && message.topScore !== undefined && (
          <ConfidenceBadge score={message.topScore} answerable={message.answerable} />
        )}

        {/* Source panel for assistant messages */}
        {!isUser && !isError && message.sources && message.sources.length > 0 && (
          <SourcePanel sources={message.sources} />
        )}
      </div>
    </div>
  )
}

export default MessageBubble
