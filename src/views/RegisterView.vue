<template>
  <div class="register-container">
    <div class="register-card">
      <h2>宣原動画共有システム</h2>
      <h2>新規登録</h2>
      
      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label for="email">メールアドレス</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            placeholder="example@example.com"
            required
          />
        </div>

        <div class="form-group">
          <label for="password">パスワード</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            placeholder="••••••••"
            required
            minlength="8"
          />
          <small class="form-hint">8文字以上で設定してください</small>
        </div>

        <div class="form-group">
          <label for="password-confirm">パスワード確認</label>
          <input
            id="password-confirm"
            v-model="form.passwordConfirm"
            type="password"
            placeholder="••••••••"
            required
            minlength="8"
          />
        </div>

        <div class="form-group">
          <label for="full-name">ユーザー名</label>
          <input
            id="full-name"
            v-model="form.fullName"
            type="text"
            placeholder="山田太郎"
            required
          />
        </div>

        <button type="submit" class="btn-primary" :disabled="loading || !isFormValid">
          {{ loading ? '登録中...' : '登録' }}
        </button>
      </form>

      <p v-if="error" class="error-message">{{ error }}</p>
      <p v-if="success" class="success-message">{{ success }}</p>

      <p class="login-link">
        既に登録している場合は
        <router-link to="/login">ログイン</router-link>
      </p>
    </div>
  </div>
</template>

<script>
import api from '@/services/api'

export default {
  name: 'RegisterView',
  data() {
    return {
      form: {
        email: '',
        password: '',
        passwordConfirm: '',
        fullName: ''
      },
      loading: false,
      error: null,
      success: null
    }
  },
  computed: {
    isFormValid() {
      return (
        this.form.email &&
        this.form.password &&
        this.form.passwordConfirm &&
        this.form.fullName &&
        this.form.password === this.form.passwordConfirm &&
        this.form.password.length >= 8
      )
    }
  },
  methods: {
    async handleRegister() {
      // Validate passwords match
      if (this.form.password !== this.form.passwordConfirm) {
        this.error = 'パスワードが一致しません'
        return
      }

      this.loading = true
      this.error = null
      this.success = null

      try {
        await api.register(
          this.form.email,
          this.form.password,
          this.form.fullName
        )

        this.success = '登録が完了しました。ログインしてください。'
        
        // Clear form
        this.form = {
          email: '',
          password: '',
          passwordConfirm: '',
          fullName: ''
        }

        // Redirect to login after 2 seconds
        setTimeout(() => {
          this.$router.push('/login')
        }, 2000)
      } catch (error) {
        this.error = error.message || '登録に失敗しました'
      } finally {
        this.loading = false
      }
    }
  },
  mounted() {
    // If already authenticated, redirect to contents
    if (api.isAuthenticated()) {
      this.$router.push('/contents')
    }
  }
}
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
}

.register-card {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 450px;
}

.register-card h2 {
  margin-bottom: 1.5rem;
  text-align: center;
  color: #333;
  font-size: 1.5rem;
}

.register-card h2:last-of-type {
  margin-top: -1rem;
  font-size: 1.3rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #555;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 1rem;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 5px rgba(102, 126, 234, 0.1);
}

.form-hint {
  display: block;
  margin-top: 0.3rem;
  font-size: 0.85rem;
  color: #999;
}

.btn-primary {
  width: 100%;
  padding: 0.75rem;
  margin-top: 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  color: #e74c3c;
  margin-top: 1rem;
  text-align: center;
  font-size: 0.9rem;
  padding: 0.75rem;
  background: #fadbd8;
  border-radius: 5px;
}

.success-message {
  color: #27ae60;
  margin-top: 1rem;
  text-align: center;
  font-size: 0.9rem;
  padding: 0.75rem;
  background: #d5f4e6;
  border-radius: 5px;
}

.login-link {
  text-align: center;
  margin-top: 1.5rem;
  color: #666;
}

.login-link a {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}

.login-link a:hover {
  text-decoration: underline;
}
</style>
