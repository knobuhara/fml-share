<template>
  <div class="contents-container">
    <header class="header">
      <div class="header-left">
        <h1>宣原動画一覧</h1>
        <img :src="akiokaImage" alt="akioka" class="header-image" />
      </div>
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
        <button @click="triggerFileInput" class="btn-upload" :disabled="uploading">
          <span v-if="uploading" class="btn-spinner"></span>
          {{ uploading ? 'アップロード中...' : 'アップロード' }}
        </button>
        <input
          ref="fileInput"
          type="file"
          accept="video/*"
          style="display: none"
          @change="handleFileSelect"
        />
      </div>

      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>動画を読み込み中...</p>
      </div>

      <div v-else-if="error" class="error">
        <p>エラーが発生しました: {{ error }}</p>
        <button @click="fetchVideos" class="btn-retry">再試行</button>
      </div>

      <div v-if="uploadSuccess" class="upload-success">
        <p>✓ 動画がアップロードされました。動画情報がDBに登録されています。</p>
        <button @click="uploadSuccess = false" class="btn-close-message">×</button>
      </div>

      <div v-if="uploadProgress > 0 && uploadProgress < 100" class="upload-progress">
        <p>アップロード中: {{ Math.round(uploadProgress) }}%</p>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div>
        </div>
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
            <button 
              v-if="isAdmin && video.id" 
              @click="deleteVideo(video)" 
              class="btn-delete"
              :disabled="deletingId === video.id"
            >
              <span v-if="deletingId === video.id" class="btn-spinner"></span>
              {{ deletingId === video.id ? '削除中...' : '削除' }}
            </button>
          </div>
        </div>
      </div>

    </main>

    <!-- Upload Info Modal -->
    <div v-if="showUploadModal" class="upload-modal" @click.self="closeUploadModal">
      <div class="upload-modal-content">
        <div class="modal-header">
          <h2>動画をアップロード</h2>
          <button class="btn-close-modal" @click="closeUploadModal">×</button>
        </div>

        <div class="modal-body">
          <div class="file-info">
            <p><strong>ファイル:</strong> {{ uploadFile?.name }}</p>
            <p><strong>サイズ:</strong> {{ uploadFile ? formatFileSize(uploadFile.size) : '-' }}</p>
          </div>

          <div class="form-group">
            <label for="upload-title">タイトル <span class="required">*</span></label>
            <input
              id="upload-title"
              v-model="uploadForm.title"
              type="text"
              placeholder="動画のタイトルを入力"
              class="form-input"
              maxlength="255"
            />
            <span class="char-count">{{ uploadForm.title.length }}/255</span>
            <span v-if="uploadErrors.title" class="error-text">{{ uploadErrors.title }}</span>
          </div>

          <div class="form-group">
            <label for="upload-description">説明</label>
            <textarea
              id="upload-description"
              v-model="uploadForm.description"
              placeholder="動画の説明を入力（オプション）"
              class="form-textarea"
              maxlength="1000"
              rows="4"
            ></textarea>
            <span class="char-count">{{ uploadForm.description.length }}/1000</span>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeUploadModal" class="btn-cancel">キャンセル</button>
          <button @click="confirmUpload" class="btn-confirm" :disabled="!isUploadFormValid">
            アップロード
          </button>
        </div>
      </div>
    </div>

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
import akiokaImage from '@/../resource/akioka.jpg'

export default {
  name: 'ContentsView',
  data() {
    return {
      akiokaImage,
      videos: [],
      filteredVideos: [],
      searchQuery: '',
      loading: true,
      error: null,
      userName: 'ユーザー',
      userRole: 'user',
      selectedVideo: null,
      downloadingId: null,
      deletingId: null,
      playbackError: null,
      uploading: false,
      uploadProgress: 0,
      uploadSuccess: false,
      showUploadModal: false,
      uploadFile: null,
      uploadForm: {
        title: '',
        description: ''
      },
      uploadErrors: {
        title: ''
      }
    }
  },
  watch: {
    searchQuery() {
      this.filterVideos()
    }
  },
  computed: {
    isUploadFormValid() {
      return this.uploadForm.title.trim().length >= 1 && this.uploadForm.title.length <= 255
    },
    isAdmin() {
      return this.userRole === 'admin'
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
      
      // Record watch history for non-admin users
      this.recordWatchHistory(video)
      
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

    recordWatchHistory(video) {
      const token = localStorage.getItem('token')
      if (!token) return

      fetch('/api/videos/watch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
          videoId: video.id,
          videoTitle: video.title
        })
      })
        .then(response => {
          if (!response.ok) {
            console.warn('Watch history API error:', response.status)
          }
        })
        .catch(error => {
          console.error('Watch history error:', error)
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

    async deleteVideo(video) {
      if (this.deletingId) return
      
      if (!confirm(`「${video.title}」を削除してもよろしいですか？\n\nFTPサーバーとDBの両方から削除されます。`)) {
        return
      }

      try {
        this.deletingId = video.id
        await api.deleteVideo(video.id)
        
        // Remove from list
        this.videos = this.videos.filter(v => v.id !== video.id)
        this.filterVideos()
        
        alert('動画が削除されました')
      } catch (error) {
        console.error('Delete error:', error)
        alert('削除に失敗しました: ' + error.message)
      } finally {
        this.deletingId = null
      }
    },

    handleLogout() {
      // Call logout API first to record session
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        }
      })
        .then(() => {
          // After logout API call succeeds, clear auth and redirect
          api.clearAuth()
          this.$router.push('/login')
        })
        .catch(error => {
          // Even if logout API fails, still clear auth and redirect
          console.error('Logout API error:', error)
          api.clearAuth()
          this.$router.push('/login')
        })
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
    },

    triggerFileInput() {
      this.$refs.fileInput.click()
    },

    async handleFileSelect(event) {
      const file = event.target.files[0]
      if (!file) {
        console.warn('No file selected in input')
        return
      }

      console.log('File selected:', {
        name: file.name,
        type: file.type,
        size: file.size,
        instanceOf: file instanceof File
      })

      // Validate file size (max 2GB)
      const maxSize = 2 * 1024 * 1024 * 1024
      if (file.size > maxSize) {
        alert('ファイルサイズが大きすぎます。2GB以下のファイルを選択してください。')
        // Reset file input after validation
        this.$refs.fileInput.value = ''
        return
      }

      // Store file and open modal BEFORE resetting input
      this.uploadFile = file
      this.uploadForm.title = file.name.substring(0, file.name.lastIndexOf('.')) || file.name
      this.uploadForm.description = ''
      this.uploadErrors.title = ''
      this.showUploadModal = true

      console.log('File stored and modal opened:', {
        uploadFileExists: !!this.uploadFile,
        uploadFileName: this.uploadFile?.name
      })

      // Reset file input after storing file (iPhone Safari compatibility)
      this.$refs.fileInput.value = ''
    },

    closeUploadModal() {
      this.showUploadModal = false
      // Clear file and form after a small delay to ensure modal closes first
      this.$nextTick(() => {
        this.uploadFile = null
        this.uploadForm.title = ''
        this.uploadForm.description = ''
        this.uploadErrors.title = ''
      })
    },

    validateUploadForm() {
      this.uploadErrors.title = ''

      if (!this.uploadForm.title.trim()) {
        this.uploadErrors.title = 'タイトルを入力してください'
        return false
      }

      if (this.uploadForm.title.length < 1 || this.uploadForm.title.length > 255) {
        this.uploadErrors.title = 'タイトルは1～255文字で入力してください'
        return false
      }

      return true
    },

    async confirmUpload() {
      if (!this.validateUploadForm()) {
        return
      }

      if (!this.uploadFile) {
        console.error('uploadFile is null/undefined')
        this.uploadErrors.title = 'ファイルが選択されていません。もう一度ファイルを選択してください。'
        this.showUploadModal = true
        return
      }

      // Ensure file still exists before closing modal
      if (!(this.uploadFile instanceof File)) {
        console.error('uploadFile is not a File instance:', typeof this.uploadFile)
        alert('ファイルが失われました。もう一度ファイルを選択してください。')
        this.showUploadModal = true
        return
      }

      console.log('Starting upload:', {
        fileName: this.uploadFile.name,
        fileSize: this.uploadFile.size,
        title: this.uploadForm.title
      })

      this.showUploadModal = false
      this.uploading = true
      this.uploadProgress = 0
      this.error = null

      try {
        await api.uploadVideo(this.uploadFile, this.uploadForm.title, this.uploadForm.description, (progress) => {
          this.uploadProgress = progress
        })

        this.uploadSuccess = true
        this.uploadProgress = 0

        console.log('Upload completed successfully')

        // Refresh video list after a short delay
        setTimeout(() => {
          this.fetchVideos()
        }, 1000)
      } catch (error) {
        console.error('Upload error:', error)
        this.error = `アップロードに失敗しました: ${error.message}`
        this.uploadProgress = 0
      } finally {
        this.uploading = false
        this.uploadFile = null
      }
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
    this.userRole = user?.role || 'user'

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

.header-left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.header h1 {
  margin: 0;
  color: #333;
}

.header-image {
  height: 60px;
  object-fit: contain;
  border-radius: 5px;
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

.btn-upload {
  padding: 0.75rem 1.5rem;
  background: #27ae60;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.3s;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-upload:hover:not(:disabled) {
  background: #229954;
}

.btn-upload:disabled {
  background: #95a5a6;
  cursor: not-allowed;
  opacity: 0.8;
}

.loading,
.error {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 10px;
}

.upload-success {
  padding: 1rem;
  margin-bottom: 1.5rem;
  background: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
  border-radius: 5px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.upload-success p {
  margin: 0;
  font-weight: 500;
}

.btn-close-message {
  background: transparent;
  border: none;
  color: #155724;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close-message:hover {
  opacity: 0.7;
}

.upload-progress {
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  background: white;
  border-radius: 5px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.upload-progress p {
  margin: 0 0 1rem 0;
  color: #667eea;
  font-weight: 600;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e9ecef;
  border-radius: 10px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  transition: width 0.3s ease;
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

.btn-delete {
  flex: 1;
  padding: 0.5rem;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
  text-align: center;
}

.btn-delete:hover:not(:disabled) {
  background: #c0392b;
}

.btn-delete:disabled {
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

/* Upload Modal */
.upload-modal {
  display: flex;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  align-items: center;
  justify-content: center;
  z-index: 1001;
}

.upload-modal-content {
  position: relative;
  width: 90%;
  max-width: 500px;
  background: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
  background: #f9f9f9;
}

.modal-header h2 {
  margin: 0;
  color: #333;
  font-size: 1.3rem;
}

.btn-close-modal {
  background: transparent;
  border: none;
  color: #999;
  font-size: 2rem;
  cursor: pointer;
  padding: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close-modal:hover {
  color: #333;
}

.modal-body {
  padding: 1.5rem;
}

.file-info {
  background: #f5f7fa;
  padding: 1rem;
  border-radius: 5px;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
}

.file-info p {
  margin: 0.5rem 0;
  color: #333;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
}

.required {
  color: #e74c3c;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 0.95rem;
  font-family: inherit;
  box-sizing: border-box;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 5px rgba(102, 126, 234, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.char-count {
  display: block;
  margin-top: 0.3rem;
  font-size: 0.8rem;
  color: #999;
  text-align: right;
}

.error-text {
  display: block;
  margin-top: 0.3rem;
  font-size: 0.85rem;
  color: #e74c3c;
}

.modal-footer {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #eee;
  background: #f9f9f9;
  justify-content: flex-end;
}

.btn-cancel,
.btn-confirm {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
}

.btn-cancel {
  background: #e9ecef;
  color: #333;
}

.btn-cancel:hover {
  background: #dee2e6;
}

.btn-confirm {
  background: #667eea;
  color: white;
}

.btn-confirm:hover:not(:disabled) {
  background: #5568d3;
}

.btn-confirm:disabled {
  background: #bbb;
  cursor: not-allowed;
  opacity: 0.6;
}

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

  .search-input,
  .btn-refresh,
  .btn-upload {
    width: 100%;
  }
}
</style>
