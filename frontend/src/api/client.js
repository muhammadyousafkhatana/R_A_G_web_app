import axios from 'axios'

// Use environment variable for backend URL, fallback to proxy in dev
const API_BASE = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000, // 2 min timeout — generation can be slow
})

export async function askQuestion(question, k = 5, hybrid = false) {
  const { data } = await api.post('/ask', { question, k, hybrid })
  return data
}

export async function retrieveChunks(question, k = 5, hybrid = false) {
  const { data } = await api.post('/retrieve', { question, k, hybrid })
  return data
}

export async function uploadDocument(file) {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function getHealth() {
  const { data } = await api.get('/health')
  return data
}

export async function getSources() {
  const { data } = await api.get('/sources')
  return data
}

export async function getStats() {
  const { data } = await api.get('/stats')
  return data
}

export async function rebuildIndex() {
  const { data } = await api.post('/rebuild')
  return data
}
