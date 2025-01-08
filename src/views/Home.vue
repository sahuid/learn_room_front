<template>
  <div class="page-container">
    <div class="content-card">
      <h2 class="section-title">推荐题库</h2>
      <div class="card-container">
        <a-row :gutter="[24, 24]" class="bank-grid">
          <a-col :span="8" v-for="item in recommendList" :key="item.id">
            <question-bank-card :item="item" />
          </a-col>
        </a-row>
      </div>
    </div>

    <a-row :gutter="24">
      <!-- 题目列表 -->
      <a-col :span="16">
        <div class="content-card">
          <h2 class="section-title">题目</h2>
          <div class="question-list">
            <a-list
              :loading="questionsLoading"
              :data-source="questions"
              :pagination="{
                current: questionsPagination.current,
                pageSize: questionsPagination.pageSize,
                total: questionsPagination.total,
                onChange: (page, pageSize) => {
                  questionsPagination.current = page;
                  questionsPagination.pageSize = pageSize;
                  fetchQuestions();
                },
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: total => `共 ${total} 题`
              }"
            >
              <template #renderItem="{ item }">
                <a-list-item class="question-item">
                  <a-list-item-meta>
                    <template #title>
                      <a @click="goToQuestion(item.id)" class="question-title">
                        {{ item.title }}
                      </a>
                    </template>
                    <template #description>
                      <div class="question-meta">
                        <div class="question-tags">
                          <a-tag 
                            v-for="tag in (item.tags ? JSON.parse(item.tags) : [])"
                            :key="tag"
                            color="blue"
                          >
                            {{ tag }}
                          </a-tag>
                        </div>
                        <div class="question-stats">
                          <span><EyeOutlined /> {{ item.viewCount || 0 }}</span>
                          <span><LikeOutlined /> {{ item.likeNum || 0 }}</span>
                          <span><StarOutlined /> {{ item.collectNum || 0 }}</span>
                        </div>
                      </div>
                    </template>
                  </a-list-item-meta>
                </a-list-item>
              </template>
            </a-list>
          </div>
        </div>
      </a-col>

      <!-- 热门题目排行榜 -->
      <a-col :span="8">
        <div class="content-card">
          <h2 class="section-title">热门题目</h2>
          <div class="hot-questions">
            <a-list
              :loading="hotQuestionsLoading"
              :data-source="hotQuestions"
              size="small"
            >
              <template #renderItem="{ item, index }">
                <a-list-item class="hot-question-item">
                  <div class="hot-question-content">
                    <div class="hot-question-rank" :class="{'top-3': index < 3}">
                      {{ index + 1 }}
                    </div>
                    <div class="hot-question-info">
                      <div class="hot-question-title" @click="goToQuestion(item.id)">
                        {{ item.title }}
                      </div>
                      <div class="hot-question-stats">
                        <EyeOutlined /> {{ item.viewCount || 0 }} 浏览
                      </div>
                    </div>
                  </div>
                </a-list-item>
              </template>
            </a-list>
          </div>
        </div>
      </a-col>
    </a-row>
  </div>
</template>

<script>
export default {
  name: 'Home'
}
</script>

<script setup>
import { ref, onMounted } from 'vue'
import { questionBankApi } from '@/api/questionBank'
import { questionApi } from '@/api/question'
import { message } from 'ant-design-vue'
import QuestionBankCard from '@/components/QuestionBankCard.vue'
import { useRouter } from 'vue-router'
import { EyeOutlined, LikeOutlined, StarOutlined } from '@ant-design/icons-vue'

const router = useRouter()
// 推荐列表数据
const recommendList = ref([])
// 题目列表数据
const questions = ref([])
const questionsLoading = ref(false)

// 题目分页配置
const questionsPagination = ref({
  current: 1,
  pageSize: 10,
  total: 0,
  onChange: (page, pageSize) => {
    questionsPagination.value.current = page;
    questionsPagination.value.pageSize = pageSize;
    fetchQuestions();
  }
})

// 获取推荐列表
const fetchRecommendList = async () => {
  try {
    const loginInfo = localStorage.getItem('userInfo')
    if (!loginInfo) {
      return
    }
    const res = await questionBankApi.queryPage({
      page: 1,
      pageSize: 6
    })
    if (res.code === 200) {
      recommendList.value = res.value.records || []
    } else {
      message.error(res.msg || '获取推荐列表失败')
    }
  } catch (error) {
    console.error('获取推荐列表失败:', error)
  }
}

// 获取题目列表
const fetchQuestions = async () => {
  questionsLoading.value = true
  try {
    const loginInfo = localStorage.getItem('userInfo')
    if (!loginInfo) {
      return
    }
    console.log('获取题目列表，参数:', {
      page: questionsPagination.value.current,
      pageSize: questionsPagination.value.pageSize
    })
    const res = await questionApi.queryPage({
      page: questionsPagination.value.current,
      pageSize: questionsPagination.value.pageSize
    })
    console.log('获取题目列表响应:', res)
    if (res.code === 200) {
      questions.value = res.value.records || []
      questionsPagination.value.total = res.value.total || 0
      console.log('处理后的题目列表:', questions.value)
    } else {
      message.error(res.msg || '获取题目列表失败')
    }
  } catch (error) {
    console.error('获取题目列表失败:', error)
  } finally {
    questionsLoading.value = false
  }
}

// 跳转到题目详情
const goToQuestion = (id) => {
  router.push(`/home/question-bank/question/${id}`)
}

// 热门题目数据
const hotQuestions = ref([])
const hotQuestionsLoading = ref(false)

// 获取热门题目
const fetchHotQuestions = async () => {
  hotQuestionsLoading.value = true
  try {
    const res = await questionApi.queryPage({
      page: 1,
      pageSize: 10,
      orderBy: 'viewCount'  // 按浏览量排序
    })
    if (res.code === 200) {
      hotQuestions.value = res.value.records || []
    }
  } catch (error) {
    console.error('获取热门题目失败:', error)
  } finally {
    hotQuestionsLoading.value = false
  }
}

onMounted(() => {
  if (localStorage.getItem('userInfo')) {
    fetchRecommendList()
    fetchQuestions()
    fetchHotQuestions()
  }
})
</script>

<style scoped>
.page-container {
  padding: 24px;
  max-width: 1200px;
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
  font-size: 20px;
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
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
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

.section-title {
  font-size: 20px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.85);
  margin-bottom: 24px;
}

.question-list {
  margin-top: 16px;
}

.question-item {
  padding: 16px;
  transition: all 0.3s;
}

.question-item:hover {
  background: #f5f7fa;
}

.question-title {
  font-size: 16px;
  color: rgba(0, 0, 0, 0.85);
  transition: color 0.3s;
}

.question-title:hover {
  color: #1890ff;
}

.question-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.question-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.question-stats {
  display: flex;
  gap: 16px;
  color: rgba(0, 0, 0, 0.45);
}

.question-stats span {
  display: flex;
  align-items: center;
  gap: 4px;
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

.hot-questions {
  margin-top: 16px;
}

.hot-question-item {
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.hot-question-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.hot-question-rank {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: #999;
}

.hot-question-rank.top-3 {
  color: #ff4d4f;
  font-size: 16px;
}

.hot-question-info {
  flex: 1;
  min-width: 0;
}

.hot-question-title {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.85);
  margin-bottom: 4px;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.3s;
}

.hot-question-title:hover {
  color: #1890ff;
}

.hot-question-stats {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  gap: 4px;
}
</style> 