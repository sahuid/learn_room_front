<template>
  <div class="mock-interview-container">
    <div class="content-card">
      <div class="header-section">
        <h2 class="section-title">模拟面试</h2>
        <a-button type="primary" @click="showCreateModal">
          <template #icon><plus-outlined /></template>
          创建模拟面试
        </a-button>
      </div>

      <!-- 面试记录列表 -->
      <div class="interview-list">
        <a-table
          :loading="loading"
          :columns="columns"
          :data-source="interviews"
          :pagination="pagination"
          @change="handleTableChange"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'status'">
              <a-tag :color="getStatusColor(record.status)">
                {{ getStatusText(record.status) }}
              </a-tag>
            </template>
            <template v-if="column.key === 'action'">
              <a-button 
                type="link" 
                @click="handleEnter(record)"
              >
                进入
              </a-button>
            </template>
          </template>
        </a-table>
      </div>
    </div>

    <!-- 创建面试弹窗 -->
    <a-modal
      v-model:visible="modalVisible"
      title="创建模拟面试"
      @ok="handleCreateInterview"
      :confirmLoading="loading"
      okText="开始面试"
      cancelText="取消"
    >
      <a-form :model="formState" layout="vertical">
        <a-form-item 
          label="面试难度" 
          required
          :rules="[{ required: true, message: '请输入面试难度' }]"
        >
          <a-input
            v-model:value="formState.difficulty"
            placeholder="请输入面试难度，如：简单/中等/困难"
          />
        </a-form-item>

        <a-form-item 
          label="面试岗位" 
          required
          :rules="[{ required: true, message: '请输入面试岗位' }]"
        >
          <a-input
            v-model:value="formState.position"
            placeholder="请输入面试岗位，如：前端开发工程师"
          />
        </a-form-item>
        
        <a-form-item 
          label="工作年限" 
          required
          :rules="[{ required: true, message: '请输入工作年限' }]"
        >
          <a-input
            v-model:value="formState.experience"
            placeholder="请输入工作年限，如：3年"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { mockInterviewApi } from '@/api/mockInterview'
import dayjs from 'dayjs'
import { useRouter } from 'vue-router'

const modalVisible = ref(false)
const loading = ref(false)
const router = useRouter()

const formState = reactive({
  difficulty: '',
  position: '',
  experience: ''
})

const interviews = ref([])
const tableLoading = ref(false)

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total) => `共 ${total} 条记录`
})

const columns = [
  {
    title: '面试岗位',
    dataIndex: 'jobPosition',
    key: 'jobPosition',
    width: '20%'
  },
  {
    title: '工作年限',
    dataIndex: 'workExperience',
    key: 'workExperience',
    width: '15%'
  },
  {
    title: '面试难度',
    dataIndex: 'difficulty',
    key: 'difficulty',
    width: '15%'
  },
  {
    title: '状态',
    key: 'status',
    width: '15%'
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    key: 'createTime',
    width: '20%',
    customRender: ({ text }) => dayjs(text).format('YYYY-MM-DD HH:mm:ss')
  },
  {
    title: '操作',
    key: 'action',
    width: '15%'
  }
]

const showCreateModal = () => {
  modalVisible.value = true
}

const handleCreateInterview = async () => {
  if (!formState.difficulty || !formState.position || !formState.experience) {
    message.warning('请填写完整信息')
    return
  }
  
  loading.value = true
  try {
    const res = await mockInterviewApi.create({
      difficulty: formState.difficulty,
      position: formState.position,
      experience: formState.experience
    })
    
    if (res.code === 200) {
      message.success('创建成功')
      modalVisible.value = false
      formState.difficulty = ''
      formState.position = ''
      formState.experience = ''
      fetchInterviews()
    } else {
      message.error(res.msg || '创建失败')
    }
  } catch (error) {
    message.error('创建面试失败')
  } finally {
    loading.value = false
  }
}

const fetchInterviews = async () => {
  tableLoading.value = true
  try {
    const res = await mockInterviewApi.queryPage({
      page: pagination.current,
      pageSize: pagination.pageSize
    })
    if (res.code === 200) {
      interviews.value = res.value.data || []
      pagination.total = res.value.total || 0
    }
  } catch (error) {
    message.error('获取面试列表失败')
  } finally {
    tableLoading.value = false
  }
}

const handleTableChange = (pag) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchInterviews()
}

const getStatusColor = (status) => {
  switch (status) {
    case 0: return 'blue'
    case 1: return 'orange'
    case 2: return 'green'
    default: return 'default'
  }
}

const getStatusText = (status) => {
  switch (status) {
    case 0: return '待开始'
    case 1: return '进行中'
    case 2: return '已结束'
    default: return '未知'
  }
}

const handleEnter = (record) => {
  router.push(`/home/mock-interview/chat/${record.id}`)
}

onMounted(() => {
  fetchInterviews()
})
</script>

<style scoped>
.mock-interview-container {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.content-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 24px;
}

.header-section {
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

.interview-list {
  min-height: auto;
  display: block;
}

/* 弹窗相关样式 */
:deep(.ant-modal-content) {
  border-radius: 8px;
}

:deep(.ant-form-item-label) {
  font-weight: 500;
}

:deep(.ant-input) {
  border-radius: 4px;
}

/* 表格样式 */
:deep(.ant-table-thead > tr > th) {
  background: #fafafa;
}

:deep(.ant-table-tbody > tr:hover > td) {
  background: #f5f5f5;
}
</style> 