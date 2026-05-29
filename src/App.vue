<script setup lang="ts">
import { ref, onMounted } from 'vue'
import LoginForm from './components/LoginForm.vue'
import RegisterModal from './components/RegisterModal.vue'
import MerchantList from './components/MerchantList.vue'
import { getToken, setToken, removeToken } from './utils/request'

const showRegister = ref(false)
const isLoggedIn = ref(!!getToken())
const loginFormRef = ref<InstanceType<typeof LoginForm> | null>(null)
const registerModalRef = ref<InstanceType<typeof RegisterModal> | null>(null)

async function handleLogin(data: { username: string; password: string }) {
  loginFormRef.value?.setLoading(true)
  loginFormRef.value?.setError('')

  try {
    const response = await fetch('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error('登录失败，请检查用户名和密码')
    }

    const result = await response.json()
    const token = result.token ?? result.data?.token ?? result.accessToken
    if (token) {
      setToken(token)
    }
    console.log('登录成功:', result)
    loginFormRef.value?.clearForm()
    isLoggedIn.value = true
  } catch (err: any) {
    loginFormRef.value?.setError(err.message || '登录失败，请稍后重试')
  } finally {
    loginFormRef.value?.setLoading(false)
  }
}

async function handleRegister(data: any) {
  try {
    const response = await fetch('http://localhost:8080/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}))
      throw new Error(errData.message || '注册失败，请稍后重试')
    }
  } catch (err: any) {
    throw err
  }
}

function handleLogout() {
  removeToken()
  isLoggedIn.value = false
}

onMounted(() => {
  isLoggedIn.value = !!getToken()
})
</script>

<template>
  <MerchantList v-if="isLoggedIn" @logout="handleLogout" />
  <div v-else class="login-container">
    <LoginForm
      ref="loginFormRef"
      @login="handleLogin"
      @open-register="showRegister = true"
    />

    <RegisterModal
      ref="registerModalRef"
      :visible="showRegister"
      @close="showRegister = false"
      @register="handleRegister"
    />
  </div>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #f8f9fc 0%, #ffffff 100%);
  padding: 20px;
}
</style>
