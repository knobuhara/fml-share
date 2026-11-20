/**
 * API Service - Vue.js 用 API 通信ユーティリティ
 * 
 * 使用方法:
 * import api from '@/services/api'
 * 
 * const response = await api.login(email, password)
 * const videos = await api.getVideoMetadata()
 */

class ApiService {
  constructor(baseURL = process.env.VUE_APP_API_URL || 'http://localhost:3001') {
    this.baseURL = baseURL.replace(/\/+$/, '')
    this.token = localStorage.getItem('token')
  }

  /**
   * Generic request method
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}/${endpoint}`
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    try {
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || `API Error: ${response.status}`)
      }

      return data
    } catch (error) {
      console.error('API Error:', error)
      throw error
    }
  }

  /**
   * Authentication endpoints
   */
  async login(email, password) {
    return this.request('api/auth/login', {
      method: 'POST',
      body: { email, password },
    })
  }

  async register(email, password, name) {
    return this.request('api/auth/register', {
      method: 'POST',
      body: { email, password, name },
    })
  }

  /**
   * Video endpoints
   */
  async getVideos(page = 1, limit = 20) {
    return this.request(`api/videos/list?page=${page}&limit=${limit}`, {
      method: 'GET',
    })
  }

  async getVideoMetadata() {
    return this.request('api/videos/metadata', {
      method: 'GET',
    })
  }

  /**
   * Download video file
   */
  async downloadVideo(videoId, fileName) {
    const url = `${this.baseURL}/api/videos/download/${videoId}`
    const headers = {}

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      })

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`)
      }

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = fileName || 'video'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error('Download Error:', error)
      throw error
    }
  }

  /**
   * Token management
   */
  setToken(token) {
    this.token = token
    localStorage.setItem('token', token)
  }

  getToken() {
    return this.token
  }

  logout() {
    this.token = null
    localStorage.removeItem('token')
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.token
  }

  /**
   * Get stored user info
   */
  getUser() {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  }

  /**
   * Store user info
   */
  setUser(user) {
    localStorage.setItem('user', JSON.stringify(user))
  }

  /**
   * Clear all auth data
   */
  clearAuth() {
    this.logout()
    localStorage.removeItem('user')
  }
}

// シングルトンインスタンスをエクスポート
export default new ApiService()
