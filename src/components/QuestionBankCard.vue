<template>
  <a-card hoverable class="question-bank-card" @click="handleCardClick">
    <template #cover>
      <div class="card-cover">
        <img
          v-if="item.picture"
          :src="item.picture"
          :alt="item.title"
          class="cover-image"
          @error="handleImageError"
        />
        <div v-else class="cover-placeholder">
          <BookOutlined class="placeholder-icon" />
        </div>
      </div>
    </template>
    <a-card-meta :title="item.title">
      <template #description>
        <div class="description-text">{{ item.description || '暂无描述' }}</div>
      </template>
    </a-card-meta>
  </a-card>
</template>

<script setup>
import { defineProps, defineEmits, ref } from 'vue'
import { BookOutlined } from '@ant-design/icons-vue'
import { questionBankApi } from '@/api/questionBank'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'

// 定义加载状态
const loading = ref(false)

const props = defineProps({
  item: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['questionLoaded'])
const router = useRouter()

// 图片加载错误处理
const handleImageError = (e) => {
  console.error('图片加载失败:', e.target.src)
  e.target.src = 'https://pic.code-nav.cn/mianshiya/question_picture/default.png'
}

// 处理卡片点击
const handleCardClick = async () => {
  loading.value = true
  try {
    const res = await questionBankApi.queryOne({
      id: props.item.id.toString(),
      showQuestion: true,
      page: 1,
      pageSize: 10
    })
    if (res.code === 200) {
      router.push({
        path: `/home/question-bank/detail/${props.item.id.toString()}`,
        state: {  // 通过路由状态传递初始数据
          bankInfo: props.item,
          questionData: res.value
        },
        replace: true  // 使用 replace 而不是 push
      })
    } else {
      message.error(res.msg || '获取题目列表失败')
    }
  } catch (error) {
    console.error('获取题目列表失败:', error)
    message.error('获取题目列表失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.question-bank-card {
  height: 100%;
  border-radius: 8px;
  transition: all 0.3s;
  overflow: hidden;
}

.question-bank-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.card-cover {
  height: 200px;
  overflow: hidden;
  position: relative;
  background: #f5f7fa;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
  display: block;
  background-color: #fff;
}

.cover-image:hover {
  transform: scale(1.05);
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7eb 100%);
}

.placeholder-icon {
  font-size: 48px;
  color: #bfbfbf;
}

.description-text {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  color: rgba(0, 0, 0, 0.45);
  font-size: 14px;
  line-height: 1.5;
  margin-top: 8px;
}

:deep(.ant-card-meta-title) {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 8px;
}
</style> 