<template>
  <div class="page-container">
    <!-- 筛选器 -->
    <div class="content-card">
      <div class="filter-section">
        <div class="filter-group">
          <div class="filter-label">公司：</div>
          <div class="filter-options">
            <a-tag 
              v-for="company in companies" 
              :key="company"
              :color="selectedCompany === company ? 'blue' : ''"
              class="filter-tag"
              @click="handleCompanySelect(company)"
            >
              {{ company }}
            </a-tag>
          </div>
        </div>
        <div class="filter-group">
          <div class="filter-label">岗位：</div>
          <div class="filter-options">
            <a-tag 
              v-for="position in positions" 
              :key="position"
              :color="selectedPosition === position ? 'blue' : ''"
              class="filter-tag"
              @click="handlePositionSelect(position)"
            >
              {{ position }}
            </a-tag>
          </div>
        </div>
      </div>
    </div>

    <!-- 面经列表 -->
    <div class="content-card">
      <div class="list-header">
        <h2 class="section-title">面经列表</h2>
        <a-radio-group v-model:value="sortBy" button-style="solid">
          <a-radio-button value="new">最新</a-radio-button>
          <a-radio-button value="hot">最热</a-radio-button>
        </a-radio-group>
      </div>

      <a-list
        :loading="loading"
        :data-source="interviews"
        :pagination="pagination"
      >
        <template #renderItem="{ item }">
          <a-list-item class="interview-item">
            <div class="interview-content">
              <div class="interview-header">
                <h3 class="interview-title" @click="goToDetail(item.id)">
                  {{ item.title }}
                </h3>
                <div class="interview-meta">
                  <span class="company">{{ item.company }}</span>
                  <span class="position">{{ item.position }}</span>
                  <span class="date">{{ formatDate(item.createTime) }}</span>
                </div>
              </div>
              <div class="interview-summary">{{ item.summary }}</div>
              <div class="interview-footer">
                <div class="interview-stats">
                  <span class="stat-item">
                    <EyeOutlined /> {{ item.viewCount || 0 }}
                  </span>
                  <span class="stat-item">
                    <LikeOutlined /> {{ item.likeNum || 0 }}
                  </span>
                  <span class="stat-item">
                    <MessageOutlined /> {{ item.commentNum || 0 }}
                  </span>
                </div>
                <div class="interview-tags">
                  <a-tag v-for="tag in item.tags" :key="tag">{{ tag }}</a-tag>
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
import { EyeOutlined, LikeOutlined, MessageOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'

const router = useRouter()
const loading = ref(false)
const interviews = ref([])
const selectedCompany = ref('')
const selectedPosition = ref('')
const sortBy = ref('new')

// 分页配置
const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 0,
  onChange: (page, pageSize) => {
    pagination.value.current = page
    pagination.value.pageSize = pageSize
    fetchInterviews()
  }
})

// 筛选选项
const companies = ['字节跳动', '阿里巴巴', '腾讯', '美团', '百度', '华为', '小米']
const positions = ['前端', '后端', '算法', '测试', '运维', '产品']

// 选择公司
const handleCompanySelect = (company) => {
  selectedCompany.value = selectedCompany.value === company ? '' : company
  fetchInterviews()
}

// 选择岗位
const handlePositionSelect = (position) => {
  selectedPosition.value = selectedPosition.value === position ? '' : position
  fetchInterviews()
}

// 获取面经列表
const fetchInterviews = async () => {
  loading.value = true
  try {
    // TODO: 调用后端接口获取数据
    // const res = await api.getInterviews({
    //   page: pagination.value.current,
    //   pageSize: pagination.value.pageSize,
    //   company: selectedCompany.value,
    //   position: selectedPosition.value,
    //   sortBy: sortBy.value
    // })
  } catch (error) {
    console.error('获取面经失败:', error)
    message.error('获取面经失败')
  } finally {
    loading.value = false
  }
}

// 格式化日期
const formatDate = (date) => {
  return new Date(date).toLocaleDateString()
}

// 跳转到详情页
const goToDetail = (id) => {
  router.push(`/home/interview/${id}`)
}

onMounted(() => {
  fetchInterviews()
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

.filter-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-group {
  display: flex;
  align-items: center;
}

.filter-label {
  width: 60px;
  color: rgba(0, 0, 0, 0.85);
  font-weight: 500;
}

.filter-options {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-tag {
  cursor: pointer;
  user-select: none;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-title {
  font-size: 20px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.85);
  margin: 0;
}

.interview-item {
  padding: 20px 0;
  border-bottom: 1px solid #f0f0f0;
}

.interview-header {
  margin-bottom: 12px;
}

.interview-title {
  font-size: 18px;
  color: rgba(0, 0, 0, 0.85);
  margin-bottom: 8px;
  cursor: pointer;
}

.interview-title:hover {
  color: #1890ff;
}

.interview-meta {
  display: flex;
  gap: 16px;
  color: rgba(0, 0, 0, 0.45);
  font-size: 14px;
}

.interview-summary {
  color: rgba(0, 0, 0, 0.65);
  margin-bottom: 16px;
  line-height: 1.5;
}

.interview-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.interview-stats {
  display: flex;
  gap: 16px;
  color: rgba(0, 0, 0, 0.45);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.interview-tags {
  display: flex;
  gap: 8px;
}
</style> 