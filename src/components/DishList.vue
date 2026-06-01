<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { request } from '../utils/request'
import { getUserInfo } from '../utils/user'
import type { UserInfo } from '../utils/user'

interface Dish {
  id: string
  name: string
  price?: number
  imgUrl?: string
  description?: string
  [key: string]: any
}

const props = defineProps<{
  merchantId: string
  merchantName: string
}>()

const emit = defineEmits<{
  back: []
  logout: []
  profile: []
}>()

function handleProfile() {
  emit('profile')
}

const currentUser = ref<UserInfo | null>(getUserInfo())
const showUserMenu = ref(false)

const dishes = ref<Dish[]>([])
const loading = ref(false)
const current = ref(1)
const size = ref(10)
const total = ref(0)
const error = ref('')

function toggleUserMenu() {
  showUserMenu.value = !showUserMenu.value
}

function closeUserMenu() {
  showUserMenu.value = false
}

async function fetchDishes() {
  loading.value = true
  error.value = ''

  try {
    const response = await request(
      `http://localhost:8080/dish/list?current=${current.value}&size=${size.value}&merchantId=${props.merchantId}`
    )

    if (!response.ok) {
      if (response.status === 401) {
        emit('logout')
        throw new Error('登录已过期，请重新登录')
      }
      throw new Error('获取菜品列表失败')
    }

    const result = await response.json()
    const data = result.data ?? result
    dishes.value = data.records ?? data.list ?? []
    total.value = data.total ?? 0
  } catch (err: any) {
    error.value = err.message || '加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

function handlePageChange(page: number) {
  current.value = page
  fetchDishes()
}

function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('.user-menu-wrapper')) {
    showUserMenu.value = false
  }
}

const totalPages = computed(() => Math.ceil(total.value / size.value))

onMounted(() => {
  fetchDishes()
  document.addEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="dish-page">
    <header class="page-header">
      <div class="header-left">
        <button class="back-btn" @click="$emit('back')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <h1 class="page-title">{{ merchantName }} - 菜品列表</h1>
        <span class="count-badge" v-if="total > 0">{{ total }} 个菜品</span>
      </div>
      <div class="user-menu-wrapper" @click.stop="toggleUserMenu">
        <div class="user-avatar-btn">
          <div class="user-avatar">
            <img v-if="currentUser?.imgUrl" :src="currentUser.imgUrl" :alt="currentUser.name || currentUser.username" />
            <span v-else>{{ (currentUser?.name || currentUser?.username || 'U').charAt(0).toUpperCase() }}</span>
          </div>
          <span class="user-name">{{ currentUser?.name || currentUser?.username || '用户' }}</span>
          <svg class="dropdown-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
        <div v-show="showUserMenu" class="user-dropdown">
          <div class="dropdown-item" @click.stop="handleProfile(); closeUserMenu()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span>个人中心</span>
          </div>
          <div class="dropdown-divider"></div>
          <div class="dropdown-item danger" @click.stop="$emit('logout'); closeUserMenu()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span>退出登录</span>
          </div>
        </div>
      </div>
    </header>

    <main class="dish-content">
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <span>加载中...</span>
      </div>

      <div v-else-if="error" class="error-container">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <p>{{ error }}</p>
        <button class="retry-btn" @click="fetchDishes">重试</button>
      </div>

      <div v-else-if="dishes.length === 0" class="empty-container">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
          <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
          <line x1="6" y1="1" x2="6" y2="4"></line>
          <line x1="10" y1="1" x2="10" y2="4"></line>
          <line x1="14" y1="1" x2="14" y2="4"></line>
        </svg>
        <p>暂无菜品</p>
      </div>

      <div v-else class="dish-grid">
        <div
          v-for="dish in dishes"
          :key="dish.id"
          class="dish-card"
        >
          <div class="dish-image">
            <img v-if="dish.imgUrl" :src="dish.imgUrl" :alt="dish.name" />
            <div v-else class="image-placeholder">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
                <line x1="6" y1="1" x2="6" y2="4"></line>
                <line x1="10" y1="1" x2="10" y2="4"></line>
                <line x1="14" y1="1" x2="14" y2="4"></line>
              </svg>
            </div>
          </div>
          <div class="dish-info">
            <h3 class="dish-name">{{ dish.name || '未命名菜品' }}</h3>
            <p v-if="dish.description" class="dish-desc">{{ dish.description }}</p>
            <div class="dish-footer">
              <span v-if="dish.price !== undefined" class="dish-price">¥{{ dish.price }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="totalPages > 1" class="pagination">
        <button
          class="page-btn"
          :disabled="current === 1"
          @click="handlePageChange(current - 1)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>

        <div class="page-numbers">
          <button
            v-for="page in totalPages"
            :key="page"
            class="page-number"
            :class="{ active: current === page }"
            @click="handlePageChange(page)"
          >
            {{ page }}
          </button>
        </div>

        <button
          class="page-btn"
          :disabled="current === totalPages"
          @click="handlePageChange(current + 1)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>
    </main>
  </div>
</template>

<style scoped>
.dish-page {
  min-height: 100vh;
  background: #f8f9fc;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 48px;
  height: 72px;
  background: #ffffff;
  border-bottom: 1px solid #f0f0f5;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: transparent;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #f3f4f6;
  color: #6366f1;
}

.page-title {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0;
}

.count-badge {
  padding: 4px 10px;
  background: #f3f4f6;
  border-radius: 20px;
  font-size: 12px;
  color: #9ca3af;
  font-weight: 500;
}

.user-menu-wrapper {
  position: relative;
  cursor: pointer;
}

.user-avatar-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 12px;
  border-radius: 10px;
  transition: all 0.2s;
}

.user-avatar-btn:hover {
  background: #f3f4f6;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  max-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-arrow {
  color: #9ca3af;
  transition: transform 0.2s;
}

.user-avatar-btn:hover .dropdown-arrow {
  transform: rotate(180deg);
}

.user-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 160px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
  border: 1px solid #f0f0f5;
  overflow: hidden;
  z-index: 100;
  animation: dropdownFade 0.15s ease-out;
}

@keyframes dropdownFade {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  color: #374151;
  font-size: 14px;
  transition: all 0.15s;
}

.dropdown-item:hover {
  background: #f9fafb;
  color: #6366f1;
}

.dropdown-item.danger {
  color: #ef4444;
}

.dropdown-item.danger:hover {
  background: #fef2f2;
  color: #dc2626;
}

.dropdown-divider {
  height: 1px;
  background: #f0f0f5;
  margin: 4px 0;
}

.dish-content {
  max-width: 1120px;
  margin: 0 auto;
  padding: 40px 48px;
}

.loading-container,
.error-container,
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 20px;
  color: #9ca3af;
  gap: 16px;
}

.loading-container span,
.error-container p,
.empty-container p {
  font-size: 14px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 2px solid #e5e7eb;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.retry-btn {
  padding: 8px 20px;
  background: #6366f1;
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-btn:hover {
  background: #5568d3;
}

.error-container svg {
  color: #ef4444;
  opacity: 0.6;
}

.empty-container svg {
  color: #d1d5db;
}

.dish-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 24px;
}

.dish-card {
  background: #ffffff;
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid #f0f0f5;
}

.dish-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.06);
}

.dish-image {
  width: 100%;
  height: 180px;
  overflow: hidden;
  background: #f5f6fa;
}

.dish-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c5c8d1;
}

.dish-info {
  padding: 16px;
}

.dish-name {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dish-desc {
  margin: 0 0 12px;
  font-size: 13px;
  color: #6b7280;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.dish-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dish-price {
  font-size: 18px;
  font-weight: 700;
  color: #ef4444;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 48px;
}

.page-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  border-color: #6366f1;
  color: #6366f1;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 6px;
}

.page-number {
  min-width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
  background: #ffffff;
  border: 1px solid transparent;
  border-radius: 8px;
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.page-number:hover:not(.active) {
  background: #f3f4f6;
}

.page-number.active {
  background: #6366f1;
  color: white;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
