<template>
  <div class="page-container">
    <div class="content-card">
      <div class="header-section">
        <h2 class="section-title">题目管理</h2>
        <div class="header-right">
          <a-button 
            class="ai-button" 
            @click="showAIModal"
            :loading="generatingQuestions"
          >
            <template #icon><robot-outlined /></template>
            AI 生成题目
          </a-button>
          <a-dropdown>
            <a-button>
              <template #icon><download-outlined /></template>
              下载模板
              <down-outlined />
            </a-button>
            <template #overlay>
              <a-menu @click="handleDownloadTemplate">
                <a-menu-item key="json">JSON 模板</a-menu-item>
                <a-menu-item key="csv">CSV 模板</a-menu-item>
                <a-menu-item key="excel">Excel 模板</a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
          <a-upload
            :customRequest="handleImportQuestions"
            :showUploadList="false"
            accept=".json,.csv,.xlsx,.xls"
          >
            <a-button>
              <template #icon><upload-outlined /></template>
              批量导入
            </a-button>
          </a-upload>
          <a-button type="primary" @click="goToAddQuestion">
            <template #icon><plus-outlined /></template>
            添加题目
          </a-button>
        </div>
      </div>

      <!-- 题目列表 -->
      <a-table
        :loading="loading"
        :columns="columns"
        :data-source="questions"
        :pagination="pagination"
        :row-key="record => record.id"
        @change="handleTableChange"
        :rowClassName="() => 'table-row'"
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
            <a-space>
              <a-button type="link" @click="handleEdit(record)">编辑</a-button>
              <a-popconfirm
                title="确定要删除这道题目吗？"
                @confirm="() => handleDelete(record)"
              >
                <a-button type="link" danger>删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>

      <!-- AI 生成题目的模态框 -->
      <a-modal
        v-model:visible="aiModalVisible"
        title="AI 生成题目"
        @ok="handleGenerateQuestions"
        :confirm-loading="generatingQuestions"
        :maskClosable="false"
        okText="开始生成"
        cancelText="取消"
      >
        <a-form :model="aiFormState" layout="vertical">
          <a-form-item 
            label="题目类型（如：Java、Python、前端等）" 
            required
            :rules="[{ required: true, message: '请输入题目类型' }]"
          >
            <a-input
              v-model:value="aiFormState.questionType"
              placeholder="请输入想要生成的题目类型，例如：Java基础、Spring、Vue3 等"
              style="width: 100%"
            />
          </a-form-item>
          
          <a-form-item 
            label="生成数量" 
            required
            :rules="[{ required: true, message: '请输入生成数量' }]"
          >
            <a-input-number
              v-model:value="aiFormState.number"
              :min="1"
              :max="10"
              style="width: 100%"
              placeholder="请输入要生成的题目数量，范围：1-10"
            />
          </a-form-item>
          
          <div class="ai-tips">
            <info-circle-outlined />
            <span>
              提示：
              <ul class="tips-list">
                <li>AI 将根据输入的类型自动生成对应的面试题目</li>
                <li>题目类型越具体，生成的内容越精准</li>
                <li>建议一次生成 3-5 道题目以获得最佳效果</li>
              </ul>
            </span>
          </div>
        </a-form>
      </a-modal>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message, InputNumber } from 'ant-design-vue'
import { questionApi } from '@/api/question'
import { 
  PlusOutlined, 
  UploadOutlined, 
  DownloadOutlined, 
  DownOutlined,
  RobotOutlined,
  InfoCircleOutlined
} from '@ant-design/icons-vue'

const router = useRouter()
const loading = ref(false)
const questions = ref([])
const AInputNumber = InputNumber  // 注册组件

// 分页配置
const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total) => `共 ${total} 条记录`
})

// 表格列定义
const columns = [
  {
    title: '题目ID',
    dataIndex: 'id',
    key: 'id',
    width: 80
  },
  {
    title: '标题',
    dataIndex: 'title',
    key: 'title'
  },
  {
    title: '标签',
    key: 'tags',
    width: 200
  },
  {
    title: '操作',
    key: 'action',
    width: 150,
    fixed: 'right'
  }
]

// AI 生成题目相关
const aiModalVisible = ref(false)
const generatingQuestions = ref(false)
const aiFormState = ref({
  questionType: undefined,
  number: 3
})

// 获取题目列表
const fetchQuestions = async () => {
  try {
    loading.value = true
    const res = await questionApi.queryPage({
      page: pagination.value.current,
      pageSize: pagination.value.pageSize
    })
    if (res.code === 200) {
      questions.value = res.value.records
      pagination.value.total = res.value.total
    }
  } catch (error) {
    message.error('获取题目列表失败')
  } finally {
    loading.value = false
  }
}

// 处理表格变化
const handleTableChange = (paginationObj, _filters, _sorter, _extra) => {
  // 只处理分页变化
  if (paginationObj) {
    pagination.value.current = paginationObj.current
    pagination.value.pageSize = paginationObj.pageSize
    fetchQuestions()
  }
}

// 跳转到添加题目页面
const goToAddQuestion = () => {
  router.push('/home/question/add')
}

// 处理编辑
const handleEdit = (record) => {
  router.push(`/home/question/edit/${record.id}`)
}

// 处理删除
const handleDelete = async (record) => {
  try {
    const res = await questionApi.delete(record.id)
    if (res.code === 200) {
      message.success('删除成功')
      fetchQuestions()
    }
  } catch (error) {
    message.error('删除失败')
  }
}

// 处理导入题目
const handleImportQuestions = async ({ file }) => {
  if (!file) {
    message.error('请选择文件')
    return
  }

  const formData = new FormData()
  formData.append('file', file)

  try {
    loading.value = true
    const res = await fetch('/api/file/export', {
      method: 'POST',
      body: formData,
      headers: {
        [localStorage.getItem('tokenName')]: localStorage.getItem('tokenValue')
      }
    })
    
    const data = await res.json()
    
    if (data.code === 200) {
      message.success('导入成功')
      fetchQuestions()
    } else {
      message.error(data.msg || '导入失败')
    }
  } catch (error) {
    message.error('导入失败，请重试')
  } finally {
    loading.value = false
  }
}

// 处理下载模板
const handleDownloadTemplate = async ({ key }) => {
  try {
    const response = await fetch('/api/file/template', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        [localStorage.getItem('tokenName')]: localStorage.getItem('tokenValue')
      },
      body: new URLSearchParams({
        type: key
      }).toString()
    })

    if (!response.ok) {
      throw new Error('下载失败')
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.style.display = 'none'
    link.href = url
    const extension = key === 'excel' ? 'xlsx' : key
    link.download = `template.${extension}`
    
    document.body.appendChild(link)
    link.click()
    
    window.URL.revokeObjectURL(url)
    document.body.removeChild(link)
  } catch (error) {
    message.error('下载模板失败，请重试')
  }
}

// 显示 AI 生成模态框
const showAIModal = () => {
  aiModalVisible.value = true
  aiFormState.value = {
    questionType: undefined,
    number: 3
  }
}

// 处理生成题目
const handleGenerateQuestions = async () => {
  if (!aiFormState.value.questionType || !aiFormState.value.number) {
    message.error('请填写完整信息')
    return
  }

  try {
    generatingQuestions.value = true
    message.loading('AI 正在生成题目，请耐心等待...', 0)  // 0 表示不自动关闭
    const res = await questionApi.generateQuestions(aiFormState.value)
    
    if (res.code === 200) {
      message.destroy()  // 清除之前的 loading 消息
      message.success(`成功生成 ${aiFormState.value.number} 道题目`)
      aiModalVisible.value = false
      fetchQuestions() // 刷新题目列表
    } else {
      message.destroy()  // 清除之前的 loading 消息
      message.error(res.msg || 'AI 生成题目失败')
    }
  } catch (error) {
    message.destroy()  // 清除之前的 loading 消息
    message.error('AI 生成题目失败，请重试')
  } finally {
    generatingQuestions.value = false
  }
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
}

.section-title {
  font-size: 20px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.85);
  margin-bottom: 24px;
}

.table-operations {
  margin-bottom: 16px;
}

.operation-buttons {
  display: flex;
  gap: 8px;
}

.header-right {
  display: flex;
  gap: 12px;
}

.ai-button {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  color: white;
  border: none;
  height: 36px;
  padding: 0 20px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(24, 144, 255, 0.2);
  display: flex;
  align-items: center;
  gap: 6px;
}

.ai-button:hover {
  background: linear-gradient(135deg, #40a9ff 0%, #1890ff 100%);
  color: white;
}

.ai-button:active {
  background: linear-gradient(135deg, #096dd9 0%, #0050b3 100%);
}

.ai-tips {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: #8c8c8c;
  font-size: 13px;
  margin-top: 16px;
  padding: 12px;
  background-color: #fafafa;
  border-radius: 4px;
}

.tips-list {
  margin: 0;
  padding-left: 16px;
}

.tips-list li {
  margin-bottom: 4px;
}

.tips-list li:last-child {
  margin-bottom: 0;
}

.ai-tips .anticon {
  color: #1890ff;
  margin-top: 3px;
}
</style> 