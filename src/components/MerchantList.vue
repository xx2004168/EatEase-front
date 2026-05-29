<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { request } from '../utils/request'

interface Merchant {
  id: string
  name: string
  imgUrl?: string
  phone?: string
  canteenId?: string
  isOpen?: number | boolean
  [key: string]: any
}

const merchants = ref<Merchant[]>([])
const loading = ref(false)
const current = ref(1)
const size = ref(10)
const total = ref(0)
const error = ref('')

const emit = defineEmits<{
  logout: []
}>()

function isMerchantOpen(isOpen: number | boolean | undefined): boolean {
  return isOpen === 1 || isOpen === true
}

async function fetchMerchants() {
  loading.value = true
  error.value = ''

  try {
    const response = await request(
      `http://localhost:8080/merchant/list?current=${current.value}&size=${size.value}`
    )

    if (!response.ok) {
      if (response.status === 401) {
        emit('logout')
        throw new Error('登录已过期，请重新登录')
      }
      throw new Error('获取商家列表失败')
    }

    const result = await response.json()
    const data = result.data ?? result
    merchants.value = data.records ?? data.list ?? []
    total.value = data.total ?? 0
  } catch (err: any) {
    error.value = err.message || '加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

function handlePageChange(page: number) {
  current.value = page
  fetchMerchants()
}

function handleLogout() {
  emit('logout')
}

const totalPages = computed(() => Math.ceil(total.value / size.value))

onMounted(() => {
  fetchMerchants()
})
</script>

<template>
  <div class="merchant-page">
    <header class="page-header">
      <div class="header-left">
        <h1 class="logo">EatEase</h1>
        <span class="divider"></span>
        <span class="page-title">商家列表</span>
        <span class="count-badge" v-if="total > 0">{{ total }} 家</span>
      </div>
      <button class="logout-btn" @click="handleLogout">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
        退出
      </button>
    </header>

    <main class="merchant-content">
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
        <button class="retry-btn" @click="fetchMerchants">重试</button>
      </div>

      <div v-else-if="merchants.length === 0" class="empty-container">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
        <p>暂无商家</p>
      </div>

      <div v-else class="merchant-grid">
        <div
          v-for="merchant in merchants"
          :key="merchant.id"
          class="merchant-card"
        >
          <div class="card-top">
            <div class="card-avatar">
              <img
                v-if="merchant.imgUrl"
                :src="merchant.imgUrl"
                :alt="merchant.name"
              />
              <div v-else class="avatar-placeholder">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
              </div>
            </div>

            <div class="card-header-info">
              <h3 class="merchant-name">{{ merchant.name || '未命名商家' }}</h3>
              <span class="status-dot" :class="{ active: isMerchantOpen(merchant.isOpen) }"></span>
            </div>
          </div>

          <div class="card-details">
            <div v-if="merchant.phone" class="detail-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              <span>{{ merchant.phone }}</span>
            </div>
            <div v-if="merchant.canteenId" class="detail-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              <span>食堂 ID: {{ merchant.canteenId }}</span>
            </div>
          </div>

          <div class="card-popular">
            <span class="popular-label">热门菜品</span>
            <div class="popular-placeholder">
              <span>暂无菜品</span>
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
.merchant-page {
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

.logo {
  font-size: 22px;
  font-weight: 800;
  color: #1a1a2e;
  margin: 0;
  letter-spacing: -0.5px;
}

.divider {
  width: 1px;
  height: 20px;
  background: #e5e7eb;
}

.page-title {
  font-size: 15px;
  color: #6b7280;
  font-weight: 500;
}

.count-badge {
  padding: 4px 10px;
  background: #f3f4f6;
  border-radius: 20px;
  font-size: 12px;
  color: #9ca3af;
  font-weight: 500;
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: transparent;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  color: #6b7280;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.logout-btn:hover {
  border-color: #ef4444;
  color: #ef4444;
  background: #fef2f2;
}

.merchant-content {
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

.merchant-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.merchant-card {
  background: #ffffff;
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid #f0f0f5;
}

.merchant-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.06);
}

.card-top {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px 24px 0;
}

.card-avatar {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  overflow: hidden;
  background: #f5f6fa;
  flex-shrink: 0;
}

.card-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c5c8d1;
}

.card-header-info {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
}

.merchant-name {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #1a1a2e;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-dot {
  width: 8px;
  height: 8px;
  background: #e5e7eb;
  border-radius: 50%;
  flex-shrink: 0;
  transition: all 0.3s;
}

.status-dot.active {
  background: #22c55e;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.15);
}

.card-details {
  display: flex;
  gap: 16px;
  padding: 16px 24px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #9ca3af;
  font-size: 13px;
}

.detail-item svg {
  flex-shrink: 0;
}

.card-popular {
  padding: 16px 24px;
  border-top: 1px solid #f5f6fa;
}

.popular-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.popular-placeholder {
  height: 40px;
  background: #f8f9fc;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.popular-placeholder span {
  font-size: 12px;
  color: #c5c8d1;
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
