<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { request } from '../utils/request'
import { getUserInfo, setUserInfo } from '../utils/user'
import type { UserInfo } from '../utils/user'

interface Order {
  id: string
  orderNo?: string
  merchantName?: string
  totalAmount?: number
  status?: string | number
  createTime?: string
  [key: string]: any
}

const emit = defineEmits<{ back: []; logout: [] }>()

const currentUser = ref<UserInfo | null>(getUserInfo())
const showUserMenu = ref(false)
const activeTab = ref<'profile' | 'orders'>('profile')
const profileLoading = ref(false)

const avatarInputRef = ref<HTMLInputElement | null>(null)
const uploadError = ref('')
const avatarUploading = ref(false)

type EditField = 'name' | 'phone' | 'password' | null
const editingField = ref<EditField>(null)
const editValue = ref('')
const passwordForm = ref({ oldPassword: '', newPassword: '', confirmPassword: '' })
const fieldMsg = ref('')
const fieldSaving = ref(false)

const orders = ref<Order[]>([])
const ordersLoading = ref(false)
const orderCurrent = ref(1)
const orderSize = ref(10)
const orderTotal = ref(0)

async function fetchProfileInfo() {
  if (!currentUser.value?.username) return
  profileLoading.value = true
  try {
    const response = await request(`http://localhost:8080/user/getByUsername?username=${currentUser.value.username}`)
    if (response.ok) {
      const result = await response.json()
      const data = result.data ?? result
      const updated: UserInfo = {
        username: data.username ?? currentUser.value.username,
        name: data.name ?? '',
        imgUrl: data.imgUrl ?? '',
        phone: data.phone ?? '',
        points: data.points ?? 0,
      }
      setUserInfo(updated)
      currentUser.value = updated
    }
  } catch (err) {
    console.error('获取用户信息失败:', err)
  } finally {
    profileLoading.value = false
  }
}

function toggleUserMenu() { showUserMenu.value = !showUserMenu.value }
function closeUserMenu() { showUserMenu.value = false }
function triggerAvatarUpload() { avatarInputRef.value?.click() }

async function handleAvatarSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) { uploadError.value = '请选择图片文件'; return }
  if (file.size > 5 * 1024 * 1024) { uploadError.value = '文件大小不能超过 5MB'; return }

  avatarUploading.value = true
  uploadError.value = ''
  try {
    const formData = new FormData()
    formData.append('file', file)
    const response = await request('http://localhost:8080/file/upload', { method: 'POST', body: formData })
    if (!response.ok) throw new Error('上传失败')
    const result = await response.json()
    const url = result.url ?? result.data ?? result.filePath ?? result.fileUrl ?? ''
    if (!url) throw new Error('上传失败，未返回地址')

    const updated = { ...currentUser.value, imgUrl: url } as UserInfo
    setUserInfo(updated)
    currentUser.value = updated
    await request('http://localhost:8080/user/update', { method: 'PUT', body: JSON.stringify({ imgUrl: url }) })
  } catch (err: any) {
    uploadError.value = err.message || '上传失败'
  } finally {
    avatarUploading.value = false
    if (target) target.value = ''
  }
}

function startEdit(field: EditField) {
  editingField.value = field
  fieldMsg.value = ''
  if (field === 'name') editValue.value = currentUser.value?.name ?? ''
  else if (field === 'phone') editValue.value = currentUser.value?.phone ?? ''
  else if (field === 'password') passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
}

function cancelEdit() { editingField.value = null; fieldMsg.value = '' }

async function saveField() {
  fieldSaving.value = true
  fieldMsg.value = ''
  const field = editingField.value

  if (field === 'password') {
    if (!passwordForm.value.oldPassword) { fieldMsg.value = '请输入旧密码'; fieldSaving.value = false; return }
    if (!passwordForm.value.newPassword) { fieldMsg.value = '请输入新密码'; fieldSaving.value = false; return }
    if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) { fieldMsg.value = '两次密码不一致'; fieldSaving.value = false; return }
  }

  const body: Record<string, any> = {}
  if (field === 'name') body.name = editValue.value
  else if (field === 'phone') body.phone = editValue.value
  else if (field === 'password') {
    body.oldPassword = passwordForm.value.oldPassword
    body.newPassword = passwordForm.value.newPassword
  }

  try {
    const response = await request('http://localhost:8080/user/update', { method: 'PUT', body: JSON.stringify(body) })
    if (response.ok) {
      const result = await response.json()
      const data = result.data ?? result
      const updated: UserInfo = {
        username: data.username ?? currentUser.value?.username ?? '',
        name: data.name ?? currentUser.value?.name ?? '',
        imgUrl: data.imgUrl ?? currentUser.value?.imgUrl ?? '',
        phone: data.phone ?? currentUser.value?.phone ?? '',
        points: data.points ?? currentUser.value?.points ?? 0,
      }
      setUserInfo(updated)
      currentUser.value = updated
      fieldMsg.value = '保存成功'
      setTimeout(cancelEdit, 1000)
    } else {
      const result = await response.json().catch(() => ({}))
      fieldMsg.value = result.message || '保存失败'
    }
  } catch (err: any) {
    fieldMsg.value = err.message || '保存失败'
  } finally {
    fieldSaving.value = false
  }
}

async function fetchOrders() {
  ordersLoading.value = true
  try {
    const response = await request(`http://localhost:8080/order/myList?current=${orderCurrent.value}&size=${orderSize.value}`)
    if (response.ok) {
      const result = await response.json()
      const data = result.data ?? result
      orders.value = data.records ?? data.list ?? []
      orderTotal.value = data.total ?? 0
    }
  } catch (err: any) {
    console.error('获取订单列表失败:', err)
  } finally {
    ordersLoading.value = false
  }
}

function handleOrderPageChange(page: number) { orderCurrent.value = page; fetchOrders() }

function getOrderStatusText(status: string | number | undefined): string {
  const map: Record<string, string> = { '0': '待支付', '1': '已支付', '2': '制作中', '3': '已完成', '4': '已取消' }
  return status !== undefined ? map[String(status)] ?? String(status) : '-'
}

function getOrderStatusClass(status: string | number | undefined): string {
  const map: Record<string, string> = { '0': 'status-pending', '1': 'status-paid', '2': 'status-preparing', '3': 'status-completed', '4': 'status-cancelled' }
  return status !== undefined ? map[String(status)] ?? '' : ''
}

function handleClickOutside(event: MouseEvent) {
  if (!(event.target as HTMLElement).closest('.user-menu-wrapper')) showUserMenu.value = false
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  fetchProfileInfo()
  fetchOrders()
})
</script>

<template>
  <div class="profile-page">
    <header class="page-header">
      <div class="header-left">
        <button class="back-btn" @click="$emit('back')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        <h1 class="page-title">个人中心</h1>
      </div>
      <div class="user-menu-wrapper" @click.stop="toggleUserMenu">
        <div class="user-avatar-btn">
          <div class="user-avatar">
            <img v-if="currentUser?.imgUrl" :src="currentUser.imgUrl" :alt="currentUser.name || currentUser.username" />
            <span v-else>{{ (currentUser?.name || currentUser?.username || 'U').charAt(0).toUpperCase() }}</span>
          </div>
          <span class="user-name">{{ currentUser?.name || currentUser?.username || '用户' }}</span>
          <svg class="dropdown-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </div>
        <div v-show="showUserMenu" class="user-dropdown">
          <div class="dropdown-divider"></div>
          <div class="dropdown-item danger" @click.stop="$emit('logout'); closeUserMenu()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            <span>退出登录</span>
          </div>
        </div>
      </div>
    </header>

    <main class="profile-content">
      <div class="tabs">
        <button class="tab-btn" :class="{ active: activeTab === 'profile' }" @click="activeTab = 'profile'">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          个人信息
        </button>
        <button class="tab-btn" :class="{ active: activeTab === 'orders' }" @click="activeTab = 'orders'">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
          我的订单
        </button>
      </div>

      <div v-if="activeTab === 'profile'" class="tab-content">
        <div v-if="profileLoading" class="loading-container">
          <div class="loading-spinner"></div><span>加载中...</span>
        </div>
        <div v-else class="profile-card">
          <div class="avatar-section">
            <div class="avatar-wrapper" @click="triggerAvatarUpload">
              <div class="avatar-circle">
                <img v-if="currentUser?.imgUrl" :src="currentUser.imgUrl" alt="avatar" />
                <span v-else>{{ (currentUser?.name || currentUser?.username || 'U').charAt(0).toUpperCase() }}</span>
              </div>
              <div class="avatar-overlay">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
              </div>
              <input ref="avatarInputRef" type="file" accept="image/*" class="hidden-input" @change="handleAvatarSelect" />
            </div>
            <div class="avatar-info">
              <h2 class="display-name">{{ currentUser?.name || currentUser?.username || '用户' }}</h2>
              <p class="username">@{{ currentUser?.username }}</p>
              <span v-if="uploadError" class="upload-error">{{ uploadError }}</span>
            </div>
          </div>

          <div class="info-list">
            <div class="info-row">
              <span class="info-label">用户名</span>
              <span class="info-value mono">{{ currentUser?.username }}</span>
              <span class="info-placeholder">-</span>
            </div>

            <div class="info-row">
              <span class="info-label">昵称</span>
              <template v-if="editingField !== 'name'">
                <span class="info-value">{{ currentUser?.name || '-' }}</span>
                <button class="edit-icon-btn" @click="startEdit('name')">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
              </template>
              <template v-else>
                <input v-model="editValue" class="edit-input" placeholder="请输入昵称" @keyup.enter="saveField" />
                <div class="row-actions">
                  <button class="action-btn save" :disabled="fieldSaving" @click="saveField">
                    <span v-if="fieldSaving" class="spinner-xs"></span><span v-else>保存</span>
                  </button>
                  <button class="action-btn cancel" @click="cancelEdit">取消</button>
                </div>
              </template>
            </div>

            <div class="info-row">
              <span class="info-label">手机号</span>
              <template v-if="editingField !== 'phone'">
                <span class="info-value">{{ currentUser?.phone || '-' }}</span>
                <button class="edit-icon-btn" @click="startEdit('phone')">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
              </template>
              <template v-else>
                <input v-model="editValue" class="edit-input" placeholder="请输入手机号" @keyup.enter="saveField" />
                <div class="row-actions">
                  <button class="action-btn save" :disabled="fieldSaving" @click="saveField">
                    <span v-if="fieldSaving" class="spinner-xs"></span><span v-else>保存</span>
                  </button>
                  <button class="action-btn cancel" @click="cancelEdit">取消</button>
                </div>
              </template>
            </div>

            <div class="info-row">
              <span class="info-label">密码</span>
              <template v-if="editingField !== 'password'">
                <span class="info-value password-mask">••••••••</span>
                <button class="edit-icon-btn" @click="startEdit('password')">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
              </template>
              <template v-else>
                <div class="password-fields">
                  <input v-model="passwordForm.oldPassword" type="password" class="edit-input" placeholder="旧密码" />
                  <input v-model="passwordForm.newPassword" type="password" class="edit-input" placeholder="新密码" />
                  <input v-model="passwordForm.confirmPassword" type="password" class="edit-input" placeholder="确认新密码" @keyup.enter="saveField" />
                </div>
                <div class="row-actions">
                  <button class="action-btn save" :disabled="fieldSaving" @click="saveField">
                    <span v-if="fieldSaving" class="spinner-xs"></span><span v-else>保存</span>
                  </button>
                  <button class="action-btn cancel" @click="cancelEdit">取消</button>
                </div>
              </template>
            </div>

            <div v-if="fieldMsg" class="row-msg" :class="{ success: fieldMsg === '保存成功' }">{{ fieldMsg }}</div>
          </div>
        </div>
      </div>

      <div v-else class="tab-content">
        <div v-if="ordersLoading" class="loading-container">
          <div class="loading-spinner"></div><span>加载中...</span>
        </div>
        <div v-else-if="orders.length === 0" class="empty-container">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
          <p>暂无订单</p>
        </div>
        <div v-else class="orders-list">
          <div v-for="order in orders" :key="order.id" class="order-card">
            <div class="order-header">
              <span class="order-no">订单号: {{ order.orderNo || order.id }}</span>
              <span class="order-status" :class="getOrderStatusClass(order.status)">{{ getOrderStatusText(order.status) }}</span>
            </div>
            <div class="order-body">
              <div class="order-info">
                <p class="merchant">{{ order.merchantName || '-' }}</p>
                <p class="time">{{ order.createTime ? new Date(order.createTime).toLocaleString() : '-' }}</p>
              </div>
              <div class="order-amount">
                <span class="label">合计</span>
                <span class="amount">¥{{ order.totalAmount ?? '-' }}</span>
              </div>
            </div>
          </div>
          <div v-if="Math.ceil(orderTotal / orderSize) > 1" class="pagination">
            <button class="page-btn" :disabled="orderCurrent === 1" @click="handleOrderPageChange(orderCurrent - 1)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg></button>
            <div class="page-numbers">
              <button v-for="page in Math.ceil(orderTotal / orderSize)" :key="page" class="page-number" :class="{ active: orderCurrent === page }" @click="handleOrderPageChange(page)">{{ page }}</button>
            </div>
            <button class="page-btn" :disabled="orderCurrent === Math.ceil(orderTotal / orderSize)" @click="handleOrderPageChange(orderCurrent + 1)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg></button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.profile-page { min-height: 100vh; background: #f8f9fc; }
.page-header { display: flex; justify-content: space-between; align-items: center; padding: 0 48px; height: 72px; background: #ffffff; border-bottom: 1px solid #f0f0f5; }
.header-left { display: flex; align-items: center; gap: 16px; }
.back-btn { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; background: transparent; border: 1px solid #e5e7eb; border-radius: 8px; color: #6b7280; cursor: pointer; transition: all 0.2s; }
.back-btn:hover { background: #f3f4f6; color: #6366f1; }
.page-title { font-size: 18px; font-weight: 700; color: #1a1a2e; margin: 0; }
.user-menu-wrapper { position: relative; cursor: pointer; }
.user-avatar-btn { display: flex; align-items: center; gap: 10px; padding: 6px 12px; border-radius: 10px; transition: all 0.2s; }
.user-avatar-btn:hover { background: #f3f4f6; }
.user-avatar { width: 36px; height: 36px; border-radius: 50%; overflow: hidden; background: linear-gradient(135deg, #6366f1, #8b5cf6); display: flex; align-items: center; justify-content: center; color: white; font-size: 14px; font-weight: 600; flex-shrink: 0; }
.user-avatar img { width: 100%; height: 100%; object-fit: cover; }
.user-name { font-size: 14px; font-weight: 500; color: #374151; max-width: 120px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dropdown-arrow { color: #9ca3af; transition: transform 0.2s; }
.user-avatar-btn:hover .dropdown-arrow { transform: rotate(180deg); }
.user-dropdown { position: absolute; top: calc(100% + 8px); right: 0; min-width: 160px; background: #ffffff; border-radius: 12px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12); border: 1px solid #f0f0f5; overflow: hidden; z-index: 100; animation: dropdownFade 0.15s ease-out; }
@keyframes dropdownFade { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
.dropdown-item { display: flex; align-items: center; gap: 10px; padding: 12px 16px; color: #374151; font-size: 14px; transition: all 0.15s; }
.dropdown-item:hover { background: #f9fafb; color: #6366f1; }
.dropdown-item.danger { color: #ef4444; }
.dropdown-item.danger:hover { background: #fef2f2; color: #dc2626; }
.dropdown-divider { height: 1px; background: #f0f0f5; margin: 4px 0; }
.profile-content { max-width: 800px; margin: 0 auto; padding: 32px 24px; }
.tabs { display: flex; gap: 8px; margin-bottom: 24px; background: #ffffff; padding: 6px; border-radius: 12px; border: 1px solid #f0f0f5; }
.tab-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 16px; background: transparent; border: none; border-radius: 8px; color: #6b7280; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
.tab-btn:hover { color: #374151; background: #f9fafb; }
.tab-btn.active { background: #6366f1; color: #ffffff; }
.tab-content { background: #ffffff; border-radius: 16px; border: 1px solid #f0f0f5; overflow: hidden; }
.profile-card { padding: 32px; }
.avatar-section { display: flex; align-items: center; gap: 24px; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid #f0f0f5; }
.avatar-wrapper { position: relative; cursor: pointer; flex-shrink: 0; }
.avatar-wrapper:hover .avatar-overlay { opacity: 1; }
.avatar-circle { width: 80px; height: 80px; border-radius: 50%; overflow: hidden; background: linear-gradient(135deg, #6366f1, #8b5cf6); display: flex; align-items: center; justify-content: center; color: white; font-size: 32px; font-weight: 600; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25); }
.avatar-circle img { width: 100%; height: 100%; object-fit: cover; }
.avatar-overlay { position: absolute; inset: 0; background: rgba(0, 0, 0, 0.45); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; opacity: 0; transition: opacity 0.25s; }
.avatar-info { display: flex; flex-direction: column; gap: 4px; }
.display-name { margin: 0; font-size: 20px; font-weight: 700; color: #1a1a2e; }
.username { margin: 0; font-size: 14px; color: #9ca3af; }
.upload-error { font-size: 12px; color: #ef4444; }
.hidden-input { display: none; }
.info-list { display: flex; flex-direction: column; gap: 0; }
.info-row { display: flex; align-items: center; padding: 16px 0; border-bottom: 1px solid #f5f5f5; gap: 12px; min-height: 52px; }
.info-row:last-child { border-bottom: none; }
.info-label { width: 72px; font-size: 14px; color: #6b7280; font-weight: 500; flex-shrink: 0; }
.info-value { flex: 1; font-size: 14px; color: #1a1a2e; font-weight: 500; }
.info-value.mono { font-family: 'SF Mono', 'Consolas', monospace; font-size: 13px; color: #9ca3af; }
.info-value.password-mask { letter-spacing: 2px; color: #d1d5db; }
.info-placeholder { flex: 1; font-size: 14px; color: #d1d5db; }
.edit-icon-btn { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border: none; background: transparent; color: #9ca3af; border-radius: 6px; cursor: pointer; transition: all 0.2s; }
.edit-icon-btn:hover { background: #f3f4f6; color: #6366f1; }
.edit-input { flex: 1; padding: 8px 12px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; color: #1a1a2e; font-size: 14px; transition: all 0.2s; }
.edit-input:focus { outline: none; border-color: #6366f1; background: #ffffff; }
.row-actions { display: flex; gap: 8px; flex-shrink: 0; }
.action-btn { padding: 6px 14px; border: none; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
.action-btn.save { background: #6366f1; color: white; }
.action-btn.save:hover:not(:disabled) { background: #4f46e5; }
.action-btn.save:disabled { opacity: 0.6; cursor: not-allowed; }
.action-btn.cancel { background: #f3f4f6; color: #374151; }
.action-btn.cancel:hover { background: #e5e7eb; }
.password-fields { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.row-msg { padding: 10px 14px; background: #fef2f2; color: #ef4444; border-radius: 8px; font-size: 13px; margin-top: 8px; }
.row-msg.success { background: #f0fdf4; color: #16a34a; }
.spinner-xs { width: 12px; height: 12px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #ffffff; border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }
.loading-container, .empty-container { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 20px; color: #9ca3af; gap: 16px; }
.loading-container span, .empty-container p { font-size: 14px; }
.loading-spinner { width: 32px; height: 32px; border: 2px solid #e5e7eb; border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; }
.orders-list { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
.order-card { border: 1px solid #f0f0f5; border-radius: 12px; overflow: hidden; }
.order-card:hover { border-color: #e5e7eb; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
.order-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: #f9fafb; border-bottom: 1px solid #f0f0f5; }
.order-no { font-size: 13px; color: #6b7280; font-weight: 500; }
.order-status { padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; }
.status-pending { background: #fef3c7; color: #d97706; }
.status-paid { background: #dbeafe; color: #2563eb; }
.status-preparing { background: #e0e7ff; color: #4f46e5; }
.status-completed { background: #dcfce7; color: #16a34a; }
.status-cancelled { background: #fee2e2; color: #dc2626; }
.order-body { display: flex; align-items: center; justify-content: space-between; padding: 16px; }
.order-info { display: flex; flex-direction: column; gap: 4px; }
.merchant { margin: 0; font-size: 15px; font-weight: 600; color: #1a1a2e; }
.time { margin: 0; font-size: 13px; color: #9ca3af; }
.order-amount { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
.order-amount .label { font-size: 12px; color: #9ca3af; }
.order-amount .amount { font-size: 18px; font-weight: 700; color: #ef4444; }
.pagination { display: flex; justify-content: center; align-items: center; gap: 12px; margin-top: 24px; padding-top: 24px; border-top: 1px solid #f0f0f5; }
.page-btn { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 10px; color: #6b7280; cursor: pointer; transition: all 0.2s; }
.page-btn:hover:not(:disabled) { border-color: #6366f1; color: #6366f1; }
.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.page-numbers { display: flex; gap: 6px; }
.page-number { min-width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; padding: 0 8px; background: #ffffff; border: 1px solid transparent; border-radius: 8px; color: #6b7280; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
.page-number:hover:not(.active) { background: #f3f4f6; }
.page-number.active { background: #6366f1; color: white; }
</style>
