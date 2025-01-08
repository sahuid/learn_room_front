<template>
  <div class="page-container">
    <h1 class="page-title">题库列表</h1>
    <div class="search-form">
      <!-- 搜索表单内容 -->
    </div>
    <div class="list-container">
      <a-row :gutter="[24, 24]" class="bank-grid">
        <a-col :span="8" v-for="item in questionBankList" :key="item.id">
          <question-bank-card :item="item" />
        </a-col>
      </a-row>
    </div>
    
    <!-- 分页器 -->
    <div class="pagination">
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
import { questionBankApi } from '@/api/questionBank'
import { message } from 'ant-design-vue'
import QuestionBankCard from '@/components/QuestionBankCard.vue'

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
</script>

<style scoped>
.page-container {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  min-height: calc(100vh - 64px); /* 减去导航栏高度 */
}

.content-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 24px;
  margin-bottom: 24px;
}

.page-title {
  margin: 0 0 24px;
  font-size: 24px;
  font-weight: 500;
  color: #1f1f1f;
}

.search-form {
  margin-bottom: 24px;
  padding: 24px;
  background: #fafafa;
  border-radius: 8px;
}

.table-wrapper {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.button-group {
  margin-bottom: 24px;
  display: flex;
  gap: 8px;
}

.list-container {
  margin-bottom: 24px;
}

.card-item {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.card-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.pagination {
  text-align: center;
  margin-top: 24px;
  padding: 16px 0;
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .page-container {
    padding: 16px;
  }
}

@media (max-width: 768px) {
  .page-container {
    padding: 12px;
  }

  .page-title {
    font-size: 20px;
    margin-bottom: 16px;
  }

  .search-form {
    padding: 16px;
    margin-bottom: 16px;
  }
}

.bank-grid {
  margin: 0 -12px;  /* 抵消 gutter 的间距 */
}

.bank-grid :deep(.ant-col) {
  padding: 12px;  /* 调整卡片间的间距 */
}

/* 响应式布局 */
@media (max-width: 1200px) {
  .bank-grid :deep(.ant-col) {
    flex: 0 0 33.33%;
    max-width: 33.33%;
  }
}

@media (max-width: 768px) {
  .bank-grid :deep(.ant-col) {
    flex: 0 0 50%;
    max-width: 50%;
  }
}

@media (max-width: 576px) {
  .bank-grid :deep(.ant-col) {
    flex: 0 0 100%;
    max-width: 100%;
  }
}
</style> 