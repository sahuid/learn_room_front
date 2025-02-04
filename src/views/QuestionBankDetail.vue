<template>
  <div v-if="loading" class="loading-container">
    <a-spin size="large" />
  </div>
  <div v-else-if="bankInfo.id" class="question-bank-detail">
    <!-- 题库信息头部 -->
    <a-card class="bank-info">
      <div class="bank-header">
        <div class="bank-cover-wrapper">
          <img
            v-if="bankInfo.picture"
            :src="bankInfo.picture"
            :alt="bankInfo.title"
            class="cover-image"
            @error="handleImageError"
          />
          <div v-else class="cover-placeholder">
            <BookOutlined class="placeholder-icon" />
          </div>
        </div>
        <div class="bank-info-content">
          <div class="bank-main-info">
            <h1 class="bank-title">{{ bankInfo.title }}</h1>
            <p class="bank-description">{{ bankInfo.description || '暂无描述' }}</p>
          </div>
        </div>
      </div>
    </a-card>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <a-input-search
        v-model:value="searchParams.title"
        placeholder="搜索题目标题"
        style="width: 200px"
        @search="handleSearch"
      />
      <a-input
        v-model:value="searchParams.description"
        placeholder="搜索题目描述"
        style="width: 200px; margin-left: 16px"
        @pressEnter="handleSearch"
      />
      <a-button type="primary" style="margin-left: 16px" @click="handleSearch">
        搜索
      </a-button>
    </div>

    <!-- 题目列表 -->
    <a-table
      class="question-list"
      :loading="loading"
      :dataSource="questions"
      :columns="columns"
      :pagination="{
        ...pagination,
        showQuickJumper: true,
        showSizeChanger: true,
        showTotal: total => `共 ${total} 题`
      }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'tags'">
          <a-tag 
            v-for="tag in (record.tags ? JSON.parse(record.tags) : [])"
            :key="tag"
            color="blue"
          >
            {{ tag }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'action'">
          <a-button type="link" @click="handleViewQuestion(record)">查看</a-button>
        </template>
      </template>
    </a-table>
  </div>
  <div v-else class="error-container">
    <a-empty description="暂无数据" />
  </div>
</template>

<script setup>
import { ref, reactive, h, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { questionBankApi } from '@/api/questionBank'
import { message, Table, Tag, Button, Spin, Empty } from 'ant-design-vue'
import { BookOutlined } from '@ant-design/icons-vue'

// 注册组件
const ATable = Table
const ATag = Tag
const AButton = Button
const ASpin = Spin
const AEmpty = Empty

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const questions = ref([])
const bankInfo = ref({})

// 搜索参数
const searchParams = reactive({
  title: '',
  description: ''
})

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  onChange: (page, pageSize) => {
    pagination.current = page
    pagination.pageSize = pageSize
    fetchQuestions()
  }
})

// 表格列定义
const columns = [
  {
    title: '题目标题',
    dataIndex: 'title',
    key: 'title',
    width: '70%',
    customRender: ({ text, record }) => {
      return {
        children: h(
          'a',
          {
            onClick: () => handleViewQuestion(record),
            style: 'color: #1890ff; cursor: pointer;'
          },
          text
        )
      }
    }
  },
  {
    title: '标签',
    dataIndex: 'tags',
    key: 'tags',
    width: '30%'
  }
]

// 获取题目列表
const fetchQuestions = async () => {
  loading.value = true
  try {
    const res = await questionBankApi.queryOne({
      id: route.params.id.toString(),
      showQuestion: true,
      page: pagination.current,
      pageSize: pagination.pageSize,
      ...searchParams
    })
    if (res.code === 200) {
      // 更新题库信息
      bankInfo.value = res.value.questionBank || {}
      // 更新题目列表
      questions.value = res.value.questionPage?.records || []
      pagination.total = res.value.questionPage?.total || 0
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

// 处理搜索
const handleSearch = () => {
  pagination.current = 1
  fetchQuestions()
}

// 图片加载错误处理
const handleImageError = (e) => {
  console.error('图片加载失败:', e.target.src)
  e.target.src = 'https://pic.code-nav.cn/mianshiya/question_picture/default.png'
}

// 查看题目详情
const handleViewQuestion = (record) => {
  router.push(`/home/question-bank/question/${record.id}`)
}

// 初始化数据
const initializeData = () => {
  const state = router.currentRoute.value.state
  if (state?.bankInfo && state?.questionData) {
    bankInfo.value = state.bankInfo
    questions.value = state.questionData.questionPage?.records || []
    pagination.total = state.questionData.questionPage?.total || 0
  } else {
    fetchQuestions()
  }
}

onMounted(() => {
  initializeData()
})

// 监听路由参数变化
watch(
  () => route.params.id,
  (newId) => {
    if (newId) {
      initializeData()
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.loading-container,
.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.question-bank-detail {
  padding: 24px;
}

.bank-info {
  margin-bottom: 24px;
  background: #fff;
}

.bank-header {
  display: flex;
  align-items: flex-start;
}

.bank-cover-wrapper {
  flex: 0 0 300px;
  margin-right: 24px;
  height: 180px;
  overflow: hidden;
  border-radius: 8px;
  background: #fafafa;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;

  &:hover {
    transform: scale(1.05);
  }
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
}

.placeholder-icon {
  font-size: 48px;
  color: #d9d9d9;
}

.bank-info-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 180px;
  justify-content: space-between;
}

.bank-main-info {
  flex: 1;
}

.bank-title {
  margin: 0 0 12px;
  font-size: 24px;
  color: rgba(0, 0, 0, 0.85);
  font-weight: 500;
  line-height: 32px;
}

.bank-description {
  color: rgba(0, 0, 0, 0.65);
  font-size: 16px;
  line-height: 24px;
  margin: 0;
}

.search-bar {
  margin-bottom: 24px;
}

.question-list {
  background: #fff;
  padding: 24px;
  border-radius: 2px;
}
</style> 