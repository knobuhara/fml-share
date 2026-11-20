<template>
  <div class="contents-container">
    <header class="header">
      <h1>宣原動画一覧</h1>
      <div class="header-actions">
        <span class="user-info">{{ userName }}</span>
        <button class="btn-logout" @click="handleLogout">ログアウト</button>
      </div>
    </header>

    <main class="main-content">
      <div class="filters">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="動画を検索..."
          class="search-input"
        />
        <button @click="fetchVideos" class="btn-refresh">更新</button>
      </div>

      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>動画を読み込み中...</p>
      </div>

      <div v-else-if="error" class="error">
        <p>エラーが発生しました: {{ error }}</p>
        <button @click="fetchVideos" class="btn-retry">再試行</button>
      </div>

      <div v-else-if="filteredVideos.length === 0" class="no-videos">
        <p>動画がありません</p>
      </div>

      <div v-else class="videos-grid">
        <div v-for="video in filteredVideos" :key="video.id || video.file_path" class="video-card">
          <div class="video-thumbnail">
            <img 
              :src="video.thumbnail_url || 'https://via.placeholder.com/300x200?text=No+Thumbnail'"
              :alt="video.title"
            />
            <div v-if="video.duration" class="video-duration">
              {{ formatDuration(video.duration) }}
            </div>
          </div>
          
          <div class="video-info">
            <h3 class="video-title">{{ video.title }}</h3>
            <p v-if="video.description" class="video-description">
              {{ truncate(video.description, 100) }}
            </p>
            <div class="video-meta">
              <span class="meta-item">
                <i>📅</i> {{ formatDate(video.created_at) }}
              </span>
              <span class="meta-item">
                <i>💾</i> {{ formatFileSize(video.file_size) }}
              </span>
            </div>
            <p v-if="video.file_name" class="video-description">{{ video.file_name }}</p>
          </div>

          <div class="video-actions">
            <button v-if="video.playback_url" @click="playVideo(video)" class="btn-play">
              再生
            </button>
            <button v-else class="btn-unavailable" disabled>
              再生URL未設定
            </button>
            <button 
              v-if="video.id && (video.file_path || video.file_name)" 
              @click="downloadVideo(video)" 
              class="btn-download"
              :disabled="downloadingId === video.id"
            >
              <span v-if="downloadingId === video.id" class="btn-spinner"></span>
              {{ downloadingId === video.id ? 'ダウンロード中...' : 'ダウンロード' }}
            </button>
          </div>
        </div>
      </div>

    </main>

    <!-- Video Player Modal -->
    <div v-if="selectedVideo" class="video-modal" @click.self="selectedVideo = null">
      <div class="video-modal-content">
        <button class="btn-close" @click="selectedVideo = null">×</button>
        <div class="video-player-wrapper">
          <video
            ref="videoPlayer"
            :src="selectedVideo.playback_url"
            width="100%"
            height="auto"
            controls
            autoplay
            playsinline
            @error="handlePlaybackError"
          >
            Your browser does not support the video tag.
          </video>
        </div>
        <p v-if="playbackError" class="playback-error">{{ playbackError }}</p>
        <h3>{{ selectedVideo.title }}</h3>
      </div>
    </div>
  </div>
</template>

<script>
import api from '@/services/api'

export default {
  name: 'ContentsView',
  data() {
    return {
      videos: [],
      filteredVideos: [],
      searchQuery: '',
      loading: true,
      error: null,
      userName: 'ユーザー',
      selectedVideo: null,
      downloadingId: null,
      playbackError: null
    }
  },
  watch: {
    searchQuery() {
      this.filterVideos()
    }
  },
  methods: {
    async fetchVideos() {
      this.loading = true
      this.error = null

      try {
        const response = await api.getVideoMetadata()
        this.videos = response.data.videos
        this.filterVideos()
      } catch (error) {
        this.error = error.message || '動画の読み込みに失敗しました'
        console.error('Error fetching videos:', error)
      } finally {
        this.loading = false
      }
    },

    filterVideos() {
      if (!this.searchQuery) {
        this.filteredVideos = this.videos
      } else {
        const query = this.searchQuery.toLowerCase()
        this.filteredVideos = this.videos.filter(video =>
          video.title.toLowerCase().includes(query) ||
          (video.description && video.description.toLowerCase().includes(query))
        )
      }
    },

    playVideo(video) {
      this.playbackError = null
      this.selectedVideo = {
        ...video,
        playback_url: api.getUrl(video.playback_url)
      }
      this.$nextTick(() => {
        const player = this.$refs.videoPlayer
        if (!player) return

        player.play().catch(error => {
          this.playbackError = error.name === 'NotAllowedError'
            ? '自動再生がブロックされました。動画内の再生ボタンを押してください。'
            : '動画を再生できませんでした。再生URLと動画形式を確認してください。'
        })
      })
    },

    handlePlaybackError() {
      this.playbackError = '動画を読み込めません。再生URL、アクセス権、動画形式を確認してください。'
    },

    async downloadVideo(video) {
      if (this.downloadingId) return

      try {
        this.downloadingId = video.id
        await api.downloadVideo(video.id, video.file_name || video.title)
      } catch (error) {
        console.error('Download error:', error)
        alert('ダウンロードに失敗しました: ' + error.message)
      } finally {
        this.downloadingId = null
      }
    },

    handleLogout() {
      api.clearAuth()
      this.$router.push('/login')
    },

    formatDate(dateString) {
      if (!dateString) return '-'
      const date = new Date(dateString)
      return date.toLocaleDateString('ja-JP')
    },

    formatFileSize(bytes) {
      if (bytes == null) return '-'

      let size = typeof bytes === 'string' && bytes.trim() !== '' ? Number(bytes) : bytes
      if (!Number.isFinite(size) || size < 0) {
        console.warn('Invalid video file size')
        return '-'
      }
      if (size === 0) return '-'

      const sizes = ['B', 'KB', 'MB', 'GB']
      let sizeIndex = 0
      
      while (size >= 1024 && sizeIndex < sizes.length - 1) {
        size /= 1024
        sizeIndex++
      }
      
      return `${size.toFixed(2)} ${sizes[sizeIndex]}`
    },

    formatDuration(seconds) {
      if (!seconds) return ''
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      const secs = seconds % 60
      
      if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
      }
      return `${minutes}:${String(secs).padStart(2, '0')}`
    },

    truncate(text, length) {
      if (!text) return ''
      return text.length > length ? text.substring(0, length) + '...' : text
    }
  },
  mounted() {
    // Check authentication
    if (!api.isAuthenticated()) {
      this.$router.push('/login')
      return
    }

    // Load user info
    const user = api.getUser()
    this.userName = user?.name || 'ユーザー'

    // Fetch videos when component mounts
    this.fetchVideos()
  }
}
</script>

<style scoped>
.contents-container {
  min-height: 100vh;
  background: #f5f7fa;
}

.header {
  background: white;
  padding: 1.5rem 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h1 {
  margin: 0;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.user-info {
  color: #666;
  font-weight: 500;
}

.btn-logout {
  padding: 0.5rem 1rem;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.3s;
  font-weight: 500;
}

.btn-logout:hover {
  background: #c0392b;
}

.main-content {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 1rem;
}

.filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.search-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 1rem;
  box-sizing: border-box;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 5px rgba(102, 126, 234, 0.1);
}

.btn-refresh {
  padding: 0.75rem 1.5rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.3s;
  font-weight: 500;
}

.btn-refresh:hover {
  background: #5568d3;
}

.loading,
.error {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 10px;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  color: #e74c3c;
}

.btn-retry {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.no-videos {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 10px;
  color: #999;
}

.videos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.video-card {
  background: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s, box-shadow 0.3s;
}

.video-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.video-thumbnail {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%;
  overflow: hidden;
  background: #000;
}

.video-thumbnail img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-duration {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 0.3rem 0.6rem;
  border-radius: 3px;
  font-size: 0.85rem;
  font-weight: 600;
}

.video-info {
  padding: 1rem;
}

.video-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  color: #333;
  line-height: 1.4;
}

.video-description {
  margin: 0 0 0.75rem 0;
  color: #666;
  font-size: 0.9rem;
  line-height: 1.4;
}

.video-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
  color: #999;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  gap: 0.3rem;
  align-items: center;
}

.video-actions {
  display: flex;
  gap: 0.5rem;
  padding: 0 1rem 1rem;
}

.btn-play,
.btn-unavailable {
  flex: 1;
  padding: 0.5rem;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
  text-align: center;
}

.btn-play {
  background: #667eea;
  color: white;
}

.btn-play:hover {
  background: #5568d3;
}

.btn-download {
  flex: 1;
  padding: 0.5rem;
  background: #27ae60;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
  text-align: center;
}

.btn-download:hover:not(:disabled) {
  background: #229954;
}

.btn-download:disabled {
  background: #95a5a6;
  cursor: not-allowed;
  opacity: 0.8;
}

.btn-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 0.5rem;
  vertical-align: middle;
}

.btn-unavailable {
  background: #bbb;
  color: white;
  cursor: not-allowed;
  opacity: 0.6;
}

/* Video Player Modal */
.video-modal {
  display: flex;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.video-modal-content {
  position: relative;
  width: 90%;
  max-width: 900px;
  background: white;
  border-radius: 10px;
  overflow: hidden;
}

.video-player-wrapper {
  width: 100%;
  background: black;
}

.video-player-wrapper video {
  width: 100%;
  height: auto;
  display: block;
}

.playback-error {
  margin: 0;
  padding: 0.75rem 1rem;
  color: #b42318;
  background: #fef3f2;
}

.btn-close {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  z-index: 1001;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.btn-close:hover {
  background: rgba(0, 0, 0, 0.9);
}

.video-modal-content h3 {
  padding: 1rem;
  margin: 0;
  color: #333;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 1rem;
  }

  .videos-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }

  .filters {
    flex-direction: column;
  }

  .search-input {
    width: 100%;
  }
}
</style>
