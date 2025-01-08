<template>
  <div class="page-container">
    <!-- 公司筛选 -->
    <div class="content-card">
      <div class="filter-header">
        <h2 class="section-title">公司筛选</h2>
        <div class="company-tags">
          <a-tag 
            v-for="company in companies" 
            :key="company"
            :color="selectedCompany === company ? 'blue' : ''"
            class="company-tag"
            @click="handleCompanySelect(company)"
          >
            {{ company }}
          </a-tag>
        </div>
      </div>
    </div>

    <!-- 热门题目列表 -->
    <div class="content-card">
      <div class="list-header">
        <h2 class="section-title">热门题目</h2>
        <div class="list-filters">
          <a-radio-group v-model:value="sortBy" button-style="solid">
            <a-radio-button value="hot">热度排序</a-radio-button>
            <a-radio-button value="new">最新</a-radio-button>
          </a-radio-group>
        </div>
      </div>
      
      <a-list
        :loading="loading"
        :data-source="questions"
        :pagination="pagination"
      >
        <template #renderItem="{ item }">
          <a-list-item class="question-item">
            <div class="question-content">
              <div class="question-main">
                <h3 class="question-title" @click="goToQuestion(item.id)">
                  {{ item.title }}
                </h3>
                <div class="question-tags">
                  <a-tag v-for="tag in (item.tags ? JSON.parse(item.tags) : [])" :key="tag">
                    {{ tag }}
                  </a-tag>
                </div>
              </div>
              <div class="question-stats">
                <div class="stat-item">
                  <EyeOutlined /> {{ item.viewCount || 0 }}
                </div>
                <div class="stat-item">
                  <LikeOutlined /> {{ item.likeNum || 0 }}
                </div>
                <div class="stat-item">
                  <StarOutlined /> {{ item.collectNum || 0 }}
                </div>
                <div class="company-info">
                  来自 {{ item.company }}
                </div>
              </div>
            </div>
          </a-list-item>
        </template>
      </a-list>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { EyeOutlined, LikeOutlined, StarOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'

const router = useRouter()
const loading = ref(false)
const questions = ref([])
const selectedCompany = ref('')
const sortBy = ref('hot')

// 分页配置
const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 0,
  onChange: (page, pageSize) => {
    pagination.value.current = page
    pagination.value.pageSize = pageSize
    fetchQuestions()
  }
})

// 公司列表
const companies = ['字节跳动', '阿里巴巴', '腾讯', '美团', '百度', '华为', '小米']

// 选择公司
const handleCompanySelect = (company) => {
  selectedCompany.value = selectedCompany.value === company ? '' : company
  fetchQuestions()
}

// 获取题目列表
const fetchQuestions = async () => {
  loading.value = true
  try {
    // TODO: 调用后端接口获取数据
    // const res = await api.getHotQuestions({
    //   page: pagination.value.current,
    //   pageSize: pagination.value.pageSize,
    //   company: selectedCompany.value,
    //   sortBy: sortBy.value
    // })
  } catch (error) {
    console.error('获取题目失败:', error)
    message.error('获取题目失败')
  } finally {
    loading.value = false
  }
}

// 跳转到题目详情
const goToQuestion = (id) => {
  router.push(`/home/question-bank/question/${id}`)
}

onMounted(() => {
  fetchQuestions()
})
</script>

<style scoped>
.page-container {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.content-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 24px;
  margin-bottom: 24px;
}

.section-title {
  font-size: 20px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.85);
  margin-bottom: 16px;
}

.filter-header,
.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.company-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.company-tag {
  cursor: pointer;
  user-select: none;
  padding: 4px 12px;
}

.question-item {
  padding: 16px;
  transition: all 0.3s;
}

.question-item:hover {
  background: #f5f7fa;
}

.question-content {
  width: 100%;
}

.question-main {
  margin-bottom: 12px;
}

.question-title {
  font-size: 16px;
  color: rgba(0, 0, 0, 0.85);
  margin-bottom: 8px;
  cursor: pointer;
}

.question-title:hover {
  color: #1890ff;
}

.question-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.question-stats {
  display: flex;
  align-items: center;
  gap: 16px;
  color: rgba(0, 0, 0, 0.45);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.company-info {
  margin-left: auto;
  color: #1890ff;
}
</style> 