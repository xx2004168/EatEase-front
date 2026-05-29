<script setup lang="ts">
import { ref, computed } from 'vue'
import { uploadRequest } from '../utils/request'

const props = defineProps<{
  modelValue?: string
  uploadUrl?: string
  accept?: string
  maxSize?: number
  shape?: 'circle' | 'square'
  size?: number
  label?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [url: string]
  change: [url: string]
  error: [msg: string]
}>()

const uploadUrl = ref('')
const previewUrl = ref('')
const uploading = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

const displayUrl = computed(() => props.modelValue || uploadUrl.value)
const isCircle = computed(() => props.shape === 'circle')
const componentSize = computed(() => props.size || 80)
const acceptType = computed(() => props.accept || 'image/*')
const maxSizeBytes = computed(() => (props.maxSize || 5) * 1024 * 1024)

function triggerSelect() {
  if (props.disabled || uploading.value) return
  fileInputRef.value?.click()
}

async function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  if (acceptType.value !== '*' && !file.type.match(acceptType.value.replace('*', '.*'))) {
    emit('error', `请选择 ${acceptType.value} 格式的文件`)
    return
  }

  if (file.size > maxSizeBytes.value) {
    emit('error', `文件大小不能超过 ${props.maxSize || 5}MB`)
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    previewUrl.value = e.target?.result as string
  }
  reader.readAsDataURL(file)

  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await uploadRequest(props.uploadUrl || 'http://localhost:8080/file/upload', formData)

    if (!response.ok) {
      throw new Error('上传失败')
    }

    const result = await response.json()
    const url = result.url ?? result.data ?? result.filePath ?? result.fileUrl ?? ''
    if (!url) {
      throw new Error('上传失败，未返回地址')
    }

    uploadUrl.value = url
    emit('update:modelValue', url)
    emit('change', url)
  } catch (err: any) {
    emit('error', err.message || '上传失败，请稍后重试')
    previewUrl.value = ''
    uploadUrl.value = ''
  } finally {
    uploading.value = false
    if (fileInputRef.value) fileInputRef.value.value = ''
  }
}

function removeFile() {
  uploadUrl.value = ''
  previewUrl.value = ''
  emit('update:modelValue', '')
  emit('change', '')
}

defineExpose({
  clear: removeFile,
})
</script>

<template>
  <div class="file-upload-wrapper">
    <label v-if="label" class="form-label">{{ label }}</label>
    <div class="file-uploader">
      <div
        v-if="!displayUrl"
        class="file-placeholder"
        :class="{ disabled: disabled || uploading, circle: isCircle }"
        :style="{ width: componentSize + 'px', height: componentSize + 'px' }"
        @click="triggerSelect"
      >
        <svg v-if="!uploading" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="17 8 12 3 7 8"></polyline>
          <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
        <div v-else class="upload-spinner"></div>
        <span class="placeholder-text">{{ uploading ? '上传中...' : '点击上传' }}</span>
      </div>
      <div
        v-else
        class="file-preview"
        :class="{ circle: isCircle }"
        :style="{ width: componentSize + 'px', height: componentSize + 'px' }"
      >
        <img v-if="acceptType.includes('image')" :src="previewUrl || displayUrl" alt="预览" />
        <div v-else class="file-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
        </div>
        <button type="button" class="remove-btn" @click="removeFile">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <input
        ref="fileInputRef"
        type="file"
        :accept="acceptType"
        class="hidden-input"
        @change="handleFileChange"
      />
    </div>
  </div>
</template>

<style scoped>
.file-upload-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  color: #374151;
  font-size: 14px;
  font-weight: 500;
}

.file-uploader {
  display: flex;
  align-items: center;
}

.file-placeholder {
  border-radius: 12px;
  border: 2px dashed #d1d5db;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.2s;
  background: #f9fafb;
  color: #9ca3af;
}

.file-placeholder.circle {
  border-radius: 50%;
}

.file-placeholder:hover:not(.disabled) {
  border-color: #6366f1;
  background: #f0f0ff;
  color: #6366f1;
}

.file-placeholder.disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.placeholder-text {
  font-size: 11px;
}

.file-preview {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid #e8e9f0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
}

.file-preview.circle {
  border-radius: 50%;
}

.file-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-icon {
  color: #6b7280;
}

.remove-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  padding: 0;
}

.remove-btn:hover {
  background: rgba(239, 68, 68, 0.9);
}

.hidden-input {
  display: none;
}

.upload-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(99, 102, 241, 0.2);
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
