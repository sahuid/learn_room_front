<template>
  <div class="question-bank-container">
    <!-- 头部搜索区域 -->
    <div class="header-section">
      <h1 class="page-title">题库列表</h1>
      <a-input-search
        v-model:value="searchText"
        placeholder="搜索题库"
        @search="handleSearch"
        class="search-input"
      >
        <template #enterButton>
          <search-outlined />
        </template>
      </a-input-search>
    </div>

    <!-- 题库列表区域 -->
    <div class="bank-list">
      <div class="bank-grid">
        <div v-for="item in questionBankList" :key="item.id" class="bank-item">
          <div class="bank-card" @click="handleCardClick(item)">
            <div class="card-cover">
              <img
                v-if="item.picture"
                :src="item.picture"
                :alt="item.title"
                class="cover-image"
                @error="handleImageError"
              />
              <div v-else class="cover-placeholder">
                <book-outlined class="placeholder-icon" />
              </div>
            </div>
            <div class="card-content">
              <h3 class="card-title">{{ item.title }}</h3>
              <p class="card-desc">{{ item.description || '暂无描述' }}</p>
              <div class="card-footer">
                <span class="question-count">
                  <file-text-outlined />
                  {{ item.questionCount || 0 }} 题
                </span>
                <span class="create-time">{{ formatDate(item.createTime) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页器 -->
    <div class="pagination-wrapper">
      <a-pagination
        v-model:current="pagination.current"
        v-model:pageSize="pagination.pageSize"
        :total="pagination.total"
        @change="handlePageChange"
        show-size-changer
        :page-size-options="['9', '12', '15', '18']"
        :default-page-size="9"
      />
    </div>
  </div>
</template>

<script>
export default {
  name: 'QuestionBank'
}
</script>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { questionBankApi } from '@/api/questionBank'
import { message } from 'ant-design-vue'
import { SearchOutlined, BookOutlined, FileTextOutlined } from '@ant-design/icons-vue'
import dayjs from 'dayjs'

const router = useRouter()

// 题库列表数据
const questionBankList = ref([])

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0
})

// 获取题库列表
const fetchQuestionBanks = async () => {
  try {
    // 先检查是否有登录信息
    const loginInfo = localStorage.getItem('userInfo')
    if (!loginInfo) {
      return
    }
    const res = await questionBankApi.queryPage({
      page: pagination.current,
      pageSize: pagination.pageSize
    })
    if (res.code === 200) {
      console.log('题库数据:', res.value.records)
      questionBankList.value = res.value.records || []
      pagination.total = res.value.total || 0
    } else {
      message.error(res.msg || '获取题库列表失败')
    }
  } catch (error) {
    console.error('获取题库列表失败:', error)
  }
}

// 页码改变处理
const handlePageChange = (page, pageSize) => {
  pagination.current = page
  pagination.pageSize = pageSize
  fetchQuestionBanks()
}

// 只在有登录信息时才获取题库列表
onMounted(() => {
  if (localStorage.getItem('userInfo')) {
    fetchQuestionBanks()
  }
})

// 格式化日期
const formatDate = (date) => {
  if (!date) return ''
  return dayjs(date).format('YYYY-MM-DD')
}

// 处理卡片点击
const handleCardClick = (item) => {
  router.push(`/home/bank/detail/${item.id}`)
}

// 搜索相关
const searchText = ref('')
const handleSearch = () => {
  pagination.current = 1
  fetchQuestionBanks()
}

// 处理图片加载错误
const handleImageError = (e) => {
  e.target.src = '/default-bank-cover.png'  // 设置默认图片
}
</script>

<style scoped>
.question-bank-container {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  min-height: calc(100vh - 64px);
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  background: white;
  padding: 20px 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #1f1f1f;
}

.search-input {
  width: 300px;
}

.bank-list {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.bank-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.bank-item {
  transition: transform 0.3s;
}

.bank-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid #f0f0f0;
  transition: all 0.3s;
}

.bank-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.card-cover {
  position: relative;
  height: 200px;
  overflow: hidden;
  background: #f5f5f5;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.bank-card:hover .cover-image {
  transform: scale(1.05);
}

.cover-placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f2f5;
}

.placeholder-icon {
  font-size: 48px;
  color: #d9d9d9;
}

.card-content {
  padding: 20px;
}

.card-title {
  margin: 0 0 12px;
  font-size: 18px;
  font-weight: 600;
  color: #1f1f1f;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-desc {
  margin: 0 0 16px;
  font-size: 14px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.6;
  height: 44px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #999;
  font-size: 14px;
}

.question-count {
  display: flex;
  align-items: center;
  gap: 6px;
}

.create-time {
  font-size: 13px;
}

.pagination-wrapper {
  margin-top: 24px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* 响应式布局 */
@media screen and (max-width: 1400px) {
  .bank-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media screen and (max-width: 1200px) {
  .bank-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media screen and (max-width: 768px) {
  .bank-grid {
    grid-template-columns: 1fr;
  }
  
  .header-section {
    flex-direction: column;
    gap: 16px;
  }
  
  .search-input {
    width: 100%;
  }
}
</style> 