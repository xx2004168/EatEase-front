<script setup lang="ts">
import { ref, onMounted } from 'vue'
import LoginForm from './components/LoginForm.vue'
import RegisterModal from './components/RegisterModal.vue'
import MerchantList from './components/MerchantList.vue'
import DishList from './components/DishList.vue'
import Profile from './components/Profile.vue'
import { getToken, setToken, removeToken, request } from './utils/request'
import { setUserInfo, removeUserInfo, type UserInfo } from './utils/user'

type Page = 'merchants' | 'dishes' | 'profile'

const showRegister = ref(false)
const isLoggedIn = ref(!!getToken())
const loginFormRef = ref<InstanceType<typeof LoginForm> | null>(null)
const registerModalRef = ref<InstanceType<typeof RegisterModal> | null>(null)
const currentPage = ref<Page>('merchants')
const selectedMerchant = ref<{ id: string; name: string } | null>(null)

async function fetchUserInfo(username: string): Promise<UserInfo> {
  try {
    const response = await request(`http://localhost:8080/user/getByUsername?username=${username}`)
    if (response.ok) {
      const result = await response.json()
      const data = result.data ?? result
      return {
        username: data.username ?? username,
        name: data.name ?? '',
        imgUrl: data.imgUrl ?? '',
        phone: data.phone ?? '',
        points: data.points ?? 0,
      }
    }
  } catch (err) {
    console.error('获取用户信息失败:', err)
  }
  return { username }
}

function handleSelectMerchant(data: { id: string; name: string }) {
  selectedMerchant.value = data
  currentPage.value = 'dishes'
}

function handleBackToMerchants() {
  currentPage.value = 'merchants'
  selectedMerchant.value = null
}

function handleGoProfile() {
  currentPage.value = 'profile'
}

function handleBackFromProfile() {
  currentPage.value = selectedMerchant.value ? 'dishes' : 'merchants'
}

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
    const loginUsername = data.username ?? ''
    const userInfo = await fetchUserInfo(loginUsername)
    setUserInfo(userInfo)
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
  removeUserInfo()
  isLoggedIn.value = false
}

onMounted(() => {
  isLoggedIn.value = !!getToken()
})
</script>

<template>
  <template v-if="isLoggedIn">
    <MerchantList
      v-if="currentPage === 'merchants'"
      @logout="handleLogout"
      @selectMerchant="handleSelectMerchant"
      @profile="handleGoProfile"
    />
    <DishList
      v-else-if="currentPage === 'dishes' && selectedMerchant"
      :merchantId="selectedMerchant.id"
      :merchantName="selectedMerchant.name"
      @back="handleBackToMerchants"
      @logout="handleLogout"
      @profile="handleGoProfile"
    />
    <Profile
      v-else-if="currentPage === 'profile'"
      @back="handleBackFromProfile"
      @logout="handleLogout"
    />
  </template>
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
