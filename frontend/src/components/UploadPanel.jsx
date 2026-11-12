import { useRef, useState } from 'react'
import { Upload, Loader2, CheckCircle } from 'lucide-react'
import { uploadDocument } from '../api/client'

function UploadPanel({ onUploaded }) {
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleFile = async (file) => {
    if (!file.name.endsWith('.txt')) {
      setError('Only .txt files are supported')
      return
    }

    setUploading(true)
    setError(null)
    setResult(null)

    try {
      const data = await uploadDocument(file)
      setResult(data)
      if (onUploaded) onUploaded()
    } catch (e) {
      setError(e.response?.data?.detail || e.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleChange = (e) => {
    const file = e.target.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="card p-4">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Upload document</h3>

      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-rag-primary hover:bg-rag-light transition-colors"
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2 text-gray-500">
            <Loader2 size={24} className="animate-spin" />
            <p className="text-xs">Uploading and rebuilding index...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-500">
            <Upload size={24} />
            <p className="text-xs">Drop a .txt file here or click to browse</p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt"
          onChange={handleChange}
          className="hidden"
        />
      </div>

      {result && (
        <div className="mt-3 flex items-start gap-2 text-xs text-green-700 bg-green-50 rounded-lg p-2">
          <CheckCircle size={14} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">{result.message}</p>
            <p className="text-gray-500">Total chunks: {result.num_chunks}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 text-xs text-red-700 bg-red-50 rounded-lg p-2">
          {error}
        </div>
      )}
    </div>
  )
}

export default UploadPanel
