<script setup lang="ts">
import { ref } from 'vue'
import FileUpload from './FileUpload.vue'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  close: []
  register: [data: any]
}>()

const regUsername = ref('')
const regPassword = ref('')
const regConfirmPassword = ref('')
const regName = ref('')
const regPhone = ref('')
const regRole = ref('user')
const regCanteenId = ref('')
const regIsOpen = ref(0)
const regImgUrl = ref('')
const regLoading = ref(false)
const regError = ref('')
const regSuccess = ref('')

function close() {
  emit('close')
}

function resetForm() {
  regUsername.value = ''
  regPassword.value = ''
  regConfirmPassword.value = ''
  regName.value = ''
  regPhone.value = ''
  regRole.value = 'user'
  regCanteenId.value = ''
  regIsOpen.value = 1
  regImgUrl.value = ''
  regError.value = ''
  regSuccess.value = ''
}

function handleUploadError(msg: string) {
  regError.value = msg
}

async function handleRegister() {
  regError.value = ''
  regSuccess.value = ''

  if (!regUsername.value || !regPassword.value || !regConfirmPassword.value || !regName.value || !regPhone.value) {
    regError.value = '请填写所有必填字段'
    return
  }

  if (regPassword.value !== regConfirmPassword.value) {
    regError.value = '两次输入的密码不一致'
    return
  }

  if (regPassword.value.length < 6) {
    regError.value = '密码长度不能少于6位'
    return
  }

  if (!/^1[3-9]\d{9}$/.test(regPhone.value)) {
    regError.value = '请输入正确的手机号'
    return
  }

  if (regRole.value === 'merchant' && !regCanteenId.value) {
    regError.value = '请选择所在的食堂'
    return
  }

  regLoading.value = true

  const requestBody: any = {
    username: regUsername.value,
    password: regPassword.value,
    name: regName.value,
    phone: regPhone.value,
    role: regRole.value,
  }

  if (regImgUrl.value) {
    requestBody.imgUrl = regImgUrl.value
  }

  if (regRole.value === 'merchant') {
    requestBody.canteenId = Number(regCanteenId.value)
    requestBody.isOpen = regIsOpen.value === 1 ? 1 : 0
  }

  try {
    emit('register', requestBody)
    regSuccess.value = '注册成功！即将关闭...'
    setTimeout(() => {
      resetForm()
      close()
    }, 1500)
  } catch (err: any) {
    regError.value = err.message || '注册失败，请稍后重试'
  } finally {
    regLoading.value = false
  }
}
</script>

<template>
  <Transition name="drawer">
    <div v-if="visible" class="drawer-overlay" @click.self="close">
      <div class="drawer">
        <div class="drawer-header">
          <div class="header-content">
            <h2>创建账号</h2>
            <p class="header-subtitle">填写以下信息完成注册</p>
          </div>
          <button class="close-btn" @click="close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="drawer-body">
          <form @submit.prevent="handleRegister" class="register-form">
            <FileUpload
              v-model="regImgUrl"
              label="头像"
              shape="circle"
              accept="image/*"
              :max-size="5"
              @error="handleUploadError"
            />

            <div class="form-row">
              <div class="form-group">
                <label for="reg-username" class="form-label">用户名</label>
                <input
                  id="reg-username"
                  v-model="regUsername"
                  type="text"
                  placeholder="请设置用户名"
                  class="form-input"
                  autocomplete="username"
                />
              </div>

              <div class="form-group">
                <label for="reg-name" class="form-label">昵称</label>
                <input
                  id="reg-name"
                  v-model="regName"
                  type="text"
                  placeholder="请设置昵称"
                  class="form-input"
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="reg-phone" class="form-label">手机号</label>
                <input
                  id="reg-phone"
                  v-model="regPhone"
                  type="tel"
                  placeholder="请输入手机号"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label for="reg-role" class="form-label">角色</label>
                <select
                  id="reg-role"
                  v-model="regRole"
                  class="form-input form-select"
                >
                  <option value="user">普通用户</option>
                  <option value="merchant">商家</option>
                </select>
              </div>
            </div>

            <template v-if="regRole === 'merchant'">
              <div class="merchant-section">
                <div class="section-title">商家信息</div>
                <div class="form-row">
                  <div class="form-group">
                    <label for="reg-canteen-id" class="form-label">所在食堂 ID</label>
                    <input
                      id="reg-canteen-id"
                      v-model="regCanteenId"
                      type="text"
                      placeholder="请输入食堂ID"
                      class="form-input"
                    />
                  </div>

              <div class="form-group">
                <label class="form-label">是否营业中</label>
                <div class="switch-container">
                  <label class="switch">
                    <input type="checkbox" :checked="regIsOpen === 1" @change="regIsOpen = regIsOpen === 1 ? 0 : 1" />
                    <span class="slider"></span>
                  </label>
                  <span class="switch-text">{{ regIsOpen === 1 ? '营业中' : '未营业' }}</span>
                </div>
              </div>
                </div>
              </div>
            </template>

            <div class="form-row">
              <div class="form-group">
                <label for="reg-password" class="form-label">密码</label>
                <input
                  id="reg-password"
                  v-model="regPassword"
                  type="password"
                  placeholder="请设置密码（至少6位）"
                  class="form-input"
                  autocomplete="new-password"
                />
              </div>

              <div class="form-group">
                <label for="reg-confirm-password" class="form-label">确认密码</label>
                <input
                  id="reg-confirm-password"
                  v-model="regConfirmPassword"
                  type="password"
                  placeholder="请再次输入密码"
                  class="form-input"
                  autocomplete="new-password"
                />
              </div>
            </div>

            <div v-if="regError" class="error-message">{{ regError }}</div>
            <div v-if="regSuccess" class="success-message">{{ regSuccess }}</div>

            <button type="submit" class="register-button" :disabled="regLoading">
              <span v-if="regLoading" class="spinner"></span>
              <span v-else>注册</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(2px);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
}

.drawer {
  width: 100%;
  max-width: 680px;
  height: 100vh;
  background: #ffffff;
  box-shadow: -10px 0 40px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 32px 40px 24px;
  border-bottom: 1px solid #e8e9f0;
  background: linear-gradient(180deg, #f8f9fc 0%, #ffffff 100%);
}

.header-content h2 {
  margin: 0 0 6px;
  font-size: 26px;
  font-weight: 700;
  color: #1a1a2e;
}

.header-subtitle {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
}

.close-btn {
  background: #f3f4f6;
  border: none;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s;
  flex-shrink: 0;
}

.close-btn:hover {
  background: #e5e7eb;
  color: #1a1a2e;
}

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 32px 40px 40px;
}

.drawer-body::-webkit-scrollbar {
  width: 6px;
}

.drawer-body::-webkit-scrollbar-track {
  background: transparent;
}

.drawer-body::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.drawer-body::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  color: #374151;
  font-size: 14px;
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 14px 16px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  color: #111827;
  font-size: 15px;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.form-input::placeholder {
  color: #9ca3af;
}

.form-input:focus {
  outline: none;
  border-color: #6366f1;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 12px center;
  background-repeat: no-repeat;
  background-size: 20px;
  padding-right: 40px;
}

.merchant-section {
  background: #f8f9fc;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid #e8e9f0;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 16px;
}

.error-message {
  color: #ef4444;
  font-size: 13px;
  text-align: center;
  padding: 12px;
  background: #fef2f2;
  border-radius: 10px;
}

.success-message {
  color: #059669;
  font-size: 13px;
  text-align: center;
  padding: 12px;
  background: #ecfdf5;
  border-radius: 10px;
}

.register-button {
  width: 100%;
  padding: 16px;
  background: #6366f1;
  border: none;
  border-radius: 12px;
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 8px;
}

.register-button:hover:not(:disabled) {
  background: #4f46e5;
  transform: translateY(-2px);
  box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.35);
}

.register-button:active:not(:disabled) {
  transform: translateY(0);
}

.register-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.switch-container {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 8px;
}

.switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 26px;
  flex-shrink: 0;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background-color: #e5e7eb;
  transition: 0.3s;
  border-radius: 26px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

input:checked + .slider {
  background-color: #6366f1;
}

input:checked + .slider:before {
  transform: translateX(22px);
}

.switch-text {
  font-size: 14px;
  color: #374151;
  font-weight: 500;
}

.drawer-enter-active,
.drawer-leave-active {
  transition: all 0.3s ease;
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}

.drawer-enter-from .drawer,
.drawer-leave-to .drawer {
  transform: translateX(100%);
}
</style>
