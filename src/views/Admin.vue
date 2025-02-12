<template>
  <div class="admin-container">
    <!-- 添加隐藏的文件输入框 -->
    <input
      type="file"
      ref="fileInput"
      style="display: none"
      accept="image/*"
      @change="handleFileChange"
    />
    
    <a-card class="admin-card">
      <template #title>
        <h2>管理后台</h2>
      </template>
      
      <a-tabs v-model:activeKey="activeTab">
        <a-tab-pane key="users" tab="用户管理">
          <div class="tab-content">
            <!-- 用户管理内容 -->
            <a-table
              :loading="loading"
              :columns="columns"
              :data-source="users"
              :pagination="pagination"
              @change="handleTableChange"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'role'">
                  <a-tag :color="record.userRole === 1 ? 'blue' : 'green'">
                    {{ record.userRole === 1 ? '管理员' : '普通用户' }}
                  </a-tag>
                </template>
                <template v-else-if="column.key === 'createTime'">
                  {{ formatDate(record.createTime) }}
                </template>
                <template v-else-if="column.key === 'updateTime'">
                  {{ formatDate(record.updateTime) }}
                </template>
              </template>
            </a-table>
          </div>
        </a-tab-pane>
        
        <a-tab-pane key="questions" tab="题目管理">
          <div class="tab-content">
            <!-- 操作按钮 -->
            <div class="table-operations">
              <div style="display: flex; justify-content: flex-end;">
                <a-button type="primary" @click="goToAddQuestion">
                  <template #icon>
                    <plus-outlined />
                  </template>
                  添加题目
                </a-button>
              </div>
            </div>
            <!-- 题目列表表格 -->
            <a-table
              :loading="questionsLoading"
              :columns="questionColumns"
              :data-source="questions"
              :pagination="questionsPagination"
              :row-selection="{ selectedRowKeys: selectedQuestionKeys, onChange: onSelectChange }"
              :row-key="record => record.id"
              @change="handleQuestionsTableChange"
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
                <template v-else-if="column.key === 'createTime'">
                  {{ formatDate(record.createTime) }}
                </template>
                <template v-else-if="column.key === 'updateTime'">
                  {{ formatDate(record.updateTime) }}
                </template>
              </template>
            </a-table>
          </div>
        </a-tab-pane>
        
        <a-tab-pane key="banks" tab="题库管理">
          <div class="tab-content">
            <!-- 添加题库按钮 -->
            <div class="table-operations">
              <a-button type="primary" @click="showAddBankModal">
                <plus-outlined />
                添加题库
              </a-button>
            </div>

            <!-- 搜索表单 -->
            <a-form layout="inline" class="search-form">
              <a-form-item label="题库名称">
                <a-input
                  v-model:value="bankSearchForm.title"
                  placeholder="请输入题库名称"
                  allow-clear
                />
              </a-form-item>
              <a-form-item label="题库描述">
                <a-input
                  v-model:value="bankSearchForm.description"
                  placeholder="请输入题库描述"
                  allow-clear
                />
              </a-form-item>
              <a-form-item>
                <a-button type="primary" @click="handleBankSearch">搜索</a-button>
                <a-button style="margin-left: 8px" @click="resetBankSearch">重置</a-button>
              </a-form-item>
            </a-form>
            
            <!-- 题库列表表格 -->
            <a-table
              :loading="banksLoading"
              :columns="bankColumns"
              :data-source="banks"
              :pagination="banksPagination"
              @change="handleBanksTableChange"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'picture'">
                  <img 
                    v-if="record.picture" 
                    :src="record.picture" 
                    alt="题库图片"
                    class="bank-thumbnail" 
                  />
                  <span v-else>暂无图片</span>
                </template>
              </template>
            </a-table>
          </div>
        </a-tab-pane>
      </a-tabs>
    </a-card>

    <!-- 添加题目的弹窗组件 -->
    <add-question-modal
      v-model="addQuestionVisible"
      @success="handleAddSuccess"
    />

    <!-- 选择题库的弹窗 -->
    <Modal
      v-model:visible="bankModalVisible"
      title="选择题库"
      @ok="handleConfirmAddToBank"
      :confirmLoading="bankModalLoading"
      @cancel="handleCloseModal"
    >
      <a-form layout="vertical">
        <a-form-item label="选择题库">
          <a-select
            v-model:value="selectedBank"
            placeholder="请选择题库"
            style="width: 100%"
          >
            <a-select-option
              v-for="bank in bankList"
              :key="bank.id"
              :value="bank.id"
            >
              {{ bank.title }}
            </a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </Modal>

    <!-- 添加题库的模态框 -->
    <a-modal
      v-model:visible="addBankModalVisible"
      title="添加题库"
      @ok="handleAddBank"
      :confirm-loading="addingBank"
      okText="确定"
      cancelText="取消"
    >
      <a-form :model="bankForm" layout="vertical">
        <a-form-item label="题库名称" required>
          <a-input v-model:value="bankForm.title" placeholder="请输入题库名称" />
        </a-form-item>
        
        <a-form-item label="题库描述">
          <a-textarea 
            v-model:value="bankForm.description" 
            placeholder="请输入题库描述"
            :rows="4" 
          />
        </a-form-item>
        
        <a-form-item label="题库图片">
          <div class="upload-wrapper">
            <div class="upload-container" @click="triggerFileInput">
              <div v-if="bankForm.picture" class="preview-container">
                <img :src="bankForm.picture" alt="题库图片" />
                <div class="upload-mask">
                  <camera-outlined />
                  <span>点击更换图片</span>
                </div>
              </div>
              <div v-else class="upload-placeholder">
                <plus-outlined />
                <div class="upload-text">点击上传图片</div>
              </div>
            </div>
          </div>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 编辑题库的模态框 -->
    <a-modal
      v-model:visible="editBankModalVisible"
      title="编辑题库"
      @ok="handleUpdateBank"
      :confirm-loading="updatingBank"
      okText="保存"
      cancelText="取消"
    >
      <a-form :model="editBankForm" layout="vertical">
        <a-form-item label="题库名称" required>
          <a-input v-model:value="editBankForm.title" placeholder="请输入题库名称" />
        </a-form-item>
        
        <a-form-item label="题库描述">
          <a-textarea 
            v-model:value="editBankForm.description" 
            placeholder="请输入题库描述"
            :rows="4" 
          />
        </a-form-item>
        
        <a-form-item label="题库图片">
          <div class="upload-wrapper">
            <div class="upload-container" @click="triggerEditFileInput">
              <div v-if="editBankForm.picture" class="preview-container">
                <img :src="editBankForm.picture" alt="题库图片" />
                <div class="upload-mask">
                  <camera-outlined />
                  <span>点击更换图片</span>
                </div>
              </div>
              <div v-else class="upload-placeholder">
                <plus-outlined />
                <div class="upload-text">点击上传图片</div>
              </div>
            </div>
          </div>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 添加编辑用的文件输入框 -->
    <input
      type="file"
      ref="editFileInput"
      style="display: none"
      accept="image/*"
      @change="handleEditFileChange"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick, reactive } from 'vue'
import { h } from 'vue'
import { userApi } from '@/api/user'
import { questionApi } from '@/api/question'
import { questionBankApi } from '@/api/questionBank'
import { message, Button, Space, Tag, Popconfirm, Modal } from 'ant-design-vue'
import dayjs from 'dayjs'
import { PlusOutlined, CameraOutlined } from '@ant-design/icons-vue'
import AddQuestionModal from '@/components/AddQuestionModal.vue'
import { useRouter } from 'vue-router'
import { fileApi } from '@/api/file'

const activeTab = ref('users')
const loading = ref(false)
const users = ref([])

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
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
    width: 80
  },
  {
    title: '用户名',
    dataIndex: 'userName',
    key: 'userName',
    width: 120
  },
  {
    title: '账号',
    dataIndex: 'userAccount',
    key: 'userAccount',
    width: 120
  },
  {
    title: '角色',
    dataIndex: 'userRole',
    key: 'role',
    width: 100
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    key: 'createTime',
    width: 180
  },
  {
    title: '更新时间',
    dataIndex: 'updateTime',
    key: 'updateTime',
    width: 180
  }
]

// 格式化日期
const formatDate = (date) => {
  if (!date) return '暂无'
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

// 获取用户列表
const fetchUsers = async () => {
  loading.value = true
  try {
    const res = await userApi.queryPage({
      page: pagination.value.current,
      pageSize: pagination.value.pageSize
    })
    if (res.code === 200) {
      users.value = res.value.records || []
      pagination.value.total = res.value.total || 0
    } else {
      message.error(res.msg || '获取用户列表失败')
    }
  } catch (error) {
    console.error('获取用户列表失败:', error)
    message.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

// 处理表格变化（分页、排序等）
const handleTableChange = (pag) => {
  pagination.value.current = pag.current
  pagination.value.pageSize = pag.pageSize
  fetchUsers()
}

// 题目管理相关
const questionsLoading = ref(false)
const questions = ref([])
const selectedQuestionKeys = ref([])

// 题目分页配置
const questionsPagination = ref({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total) => `共 ${total} 条题目`
})

// 题目表格列定义
const questionColumns = [
  {
    title: '题目标题',
    dataIndex: 'title',
    key: 'title',
    width: '25%',
    ellipsis: true
  },
  {
    title: '标签',
    dataIndex: 'tags',
    key: 'tags',
    width: '20%',
    customRender: ({ text }) => {
      if (!text) return null
      try {
        const tags = JSON.parse(text)
        return h('div', {}, tags.map(tag => 
          h(Tag, { key: tag, color: 'blue' }, () => tag)
        ))
      } catch (e) {
        return null
      }
    }
  },
  {
    title: '所属题库',
    key: 'bankTitle',
    width: '15%',
    customRender: ({ record }) => {
      const bank = bankList.value.find(b => b.id === record.bankId)
      return bank ? h(Tag, { color: 'green' }, () => bank.title) : '-'
    }
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    key: 'createTime',
    width: '15%',
    customRender: ({ text }) => {
      return text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-'
    }
  },
  {
    title: '操作',
    key: 'action',
    width: '25%',
    customRender: ({ record }) => {
      return h(Space, {}, [
        h(Button, {
          type: 'link',
          onClick: () => handleView(record)
        }, () => '查看'),
        h(Button, {
          type: 'link',
          onClick: () => handleAddToBank(record)
        }, () => '添加到题库'),
        h(Button, {
          type: 'link',
          onClick: () => handleEdit(record)
        }, () => '编辑'),
        h(Popconfirm, {
          title: '确定要删除这道题目吗？',
          okText: '确定',
          cancelText: '取消',
          onConfirm: () => handleDelete(record)
        }, {
          default: () => h(Button, {
            type: 'link',
            danger: true
          }, () => '删除')
        })
      ])
    }
  }
]

// 获取题目列表
const fetchQuestions = async () => {
  questionsLoading.value = true
  try {
    const res = await questionApi.queryPage({
      page: questionsPagination.value.current,
      pageSize: questionsPagination.value.pageSize
    })
    if (res.code === 200) {
      questions.value = res.value.records || []
      questionsPagination.value.total = res.value.total || 0
    } else {
      message.error(res.msg || '获取题目列表失败')
    }
  } catch (error) {
    console.error('获取题目列表失败:', error)
    message.error('获取题目列表失败')
  } finally {
    questionsLoading.value = false
  }
}

// 处理题目表格变化
const handleQuestionsTableChange = (pag) => {
  questionsPagination.value.current = pag.current
  questionsPagination.value.pageSize = pag.pageSize
  fetchQuestions()
}

// 处理选择题目
const onSelectChange = (selectedKeys) => {
  selectedQuestionKeys.value = selectedKeys
}

// 添加题目相关
const addQuestionVisible = ref(false)

const router = useRouter()

const goToAddQuestion = () => {
  router.push('/home/question/add')
}

const handleAddSuccess = () => {
  fetchQuestions()  // 刷新题目列表
}

// 监听标签页切换
watch(
  () => activeTab.value,
  (newTab) => {
    if (newTab === 'questions') {
      fetchQuestions()
    } else if (newTab === 'banks') {
      fetchBanks()
    }
  }
)

// 查看题目
const handleView = (record) => {
  router.push(`/home/question/detail/${record.id}`)
}

// 编辑题目
const handleEdit = (record) => {
  router.push(`/home/question/edit/${record.id}`)
}

// 删除题目
const handleDelete = async (record) => {
  try {
    const res = await questionApi.delete({ id: record.id })
    if (res.code === 200) {
      message.success('删除成功')
      fetchQuestions()  // 重新加载题目列表
    } else {
      message.error(res.msg || '删除失败')
    }
  } catch (error) {
    console.error('删除失败:', error)
    message.error('删除失败')
  }
}

// 添加到题库
const bankModalVisible = ref(false)
const bankList = ref([])
const selectedBank = ref(null)
const currentQuestion = ref(null)
const bankModalLoading = ref(false)

const handleAddToBank = async (record) => {
  try {
    const res = await questionBankApi.queryBankList()
    if (res.code === 200) {
      console.log('题库列表:', res.value)  // 调试用
      bankList.value = res.value || []
      if (bankList.value.length === 0) {
        message.warning('暂无可用的题库')
        return
      }
      currentQuestion.value = record
      selectedBank.value = null  // 重置选择的题库ID
      bankModalVisible.value = true
    } else {
      message.error(res.msg || '获取题库列表失败')
    }
  } catch (error) {
    console.error('获取题库列表失败:', error)
    message.error('获取题库列表失败')
  }
}

// 确认添加到题库
const handleConfirmAddToBank = async () => {
  if (!selectedBank.value) {
    message.warning('请选择题库')
    return
  }
  
  bankModalLoading.value = true
  try {
    const res = await questionBankApi.addQuestionToBank({
      questionId: currentQuestion.value.id,
      bankId: selectedBank.value
    })
    
    if (res.code === 200) {
      message.success('添加到题库成功')
      bankModalVisible.value = false
      // 刷新题目列表
      fetchQuestions()
    } else {
      message.error(res.msg || '添加到题库失败')
    }
  } catch (error) {
    console.error('添加到题库失败:', error)
    message.error('添加到题库失败')
  } finally {
    bankModalLoading.value = false
  }
}

// 关闭弹窗时清除选择
const handleCloseModal = () => {
  bankModalVisible.value = false
  selectedBank.value = null
  currentQuestion.value = null
  questions.value = [...questions.value]
}

// 监听题库选择变化
watch(selectedBank, (newBank) => {
  if (newBank && currentQuestion.value) {
    // 强制更新表格视图
    questions.value = [...questions.value]
  }
})

// 监听弹窗显示状态
watch(bankModalVisible, async (visible) => {
  if (visible) {
    await nextTick()
    // 确保下拉框正确渲染
    bankList.value = [...bankList.value]
  }
})

// 添加题库管理相关的状态和方法
// 题库搜索表单
const bankSearchForm = ref({
  title: '',
  description: ''
})

// 题库列表相关
const banksLoading = ref(false)
const banks = ref([])

// 题库分页配置
const banksPagination = ref({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total) => `共 ${total} 个题库`
})

// 题库表格列定义
const bankColumns = [
  {
    title: '题库名称',
    dataIndex: 'title',
    key: 'title',
    width: '20%'
  },
  {
    title: '题库图片',
    dataIndex: 'picture',
    key: 'picture',
    width: 120
  },
  {
    title: '题库描述',
    dataIndex: 'description',
    key: 'description',
    width: '40%'
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    key: 'createTime',
    width: '20%',
    customRender: ({ text }) => formatDate(text)
  },
  {
    title: '操作',
    key: 'action',
    width: '20%',
    customRender: ({ record }) => {
      return h(Space, {}, [
        h(Button, {
          type: 'link',
          onClick: () => handleViewBank(record)
        }, () => '查看'),
        h(Button, {
          type: 'link',
          onClick: () => handleEditBank(record)
        }, () => '编辑'),
        h(Popconfirm, {
          title: '确定要删除这个题库吗？',
          okText: '确定',
          cancelText: '取消',
          onConfirm: () => handleDeleteBank(record)
        }, {
          default: () => h(Button, {
            type: 'link',
            danger: true
          }, () => '删除')
        })
      ])
    }
  }
]

// 获取题库列表
const fetchBanks = async () => {
  banksLoading.value = true
  try {
    const res = await questionBankApi.queryPage({
      page: banksPagination.value.current,
      pageSize: banksPagination.value.pageSize,
      title: bankSearchForm.value.title,
      description: bankSearchForm.value.description
    })
    if (res.code === 200) {
      banks.value = res.value.records || []
      banksPagination.value.total = res.value.total || 0
    } else {
      message.error(res.msg || '获取题库列表失败')
    }
  } catch (error) {
    console.error('获取题库列表失败:', error)
    message.error('获取题库列表失败')
  } finally {
    banksLoading.value = false
  }
}

// 处理题库表格变化
const handleBanksTableChange = (pag) => {
  banksPagination.value.current = pag.current
  banksPagination.value.pageSize = pag.pageSize
  fetchBanks()
}

// 处理题库搜索
const handleBankSearch = () => {
  banksPagination.value.current = 1
  fetchBanks()
}

// 重置题库搜索
const resetBankSearch = () => {
  bankSearchForm.value = {
    title: '',
    description: ''
  }
  banksPagination.value.current = 1
  fetchBanks()
}

// 查看题库
const handleViewBank = (record) => {
  router.push(`/home/bank/detail/${record.id}`)
}

// 编辑题库
const handleEditBank = (record) => {
  showEditBankModal(record)
}

// 删除题库
const handleDeleteBank = async (record) => {
  try {
    const res = await questionBankApi.delete({ id: record.id })
    if (res.code === 200) {
      message.success('删除题库成功')
      fetchBanks()  // 重新加载题库列表
    } else {
      message.error(res.msg || '删除题库失败')
    }
  } catch (error) {
    console.error('删除题库失败:', error)
    message.error('删除题库失败')
  }
}

// 添加新的响应式数据
const addBankModalVisible = ref(false)
const addingBank = ref(false)
const fileList = ref([])
const bankForm = reactive({
  title: '',
  description: '',
  picture: ''
})

// 显示添加题库模态框
const showAddBankModal = () => {
  bankForm.title = ''
  bankForm.description = ''
  bankForm.picture = ''
  fileList.value = []
  addBankModalVisible.value = true
}

// 处理文件选择
const handleFileChange = async (e) => {
  const file = e.target.files[0]
  if (!file) return

  try {
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      message.error('请选择图片文件')
      return
    }

    // 验证文件大小（限制为2MB）
    if (file.size > 2 * 1024 * 1024) {
      message.error('图片大小不能超过2MB')
      return
    }

    const res = await fileApi.upload(file)
    if (res.code === 200) {
      bankForm.picture = res.value
      message.success('图片上传成功')
    } else {
      message.error(res.msg || '图片上传失败')
    }
  } catch (error) {
    message.error('图片上传失败')
  } finally {
    // 清空文件输入框，允许重复选择同一文件
    e.target.value = ''
  }
}

// 触发文件选择
const triggerFileInput = () => {
  fileInput.value.click()
}

const fileInput = ref(null)

// 处理添加题库
const handleAddBank = async () => {
  if (!bankForm.title) {
    message.error('请输入题库名称')
    return
  }

  try {
    addingBank.value = true
    const res = await questionBankApi.add(bankForm)
    if (res.code === 200) {
      message.success('添加题库成功')
      addBankModalVisible.value = false
      // 刷新题库列表
      fetchBanks()
    } else {
      message.error(res.msg || '添加题库失败')
    }
  } catch (error) {
    console.error('添加题库失败:', error)
    message.error('添加题库失败')
  } finally {
    addingBank.value = false
  }
}

// 添加编辑相关的响应式数据
const editBankModalVisible = ref(false)
const updatingBank = ref(false)
const editFileInput = ref(null)
const editBankForm = reactive({
  id: null,
  title: '',
  description: '',
  picture: ''
})

// 显示编辑模态框
const showEditBankModal = (record) => {
  editBankForm.id = record.id
  editBankForm.title = record.title
  editBankForm.description = record.description
  editBankForm.picture = record.picture
  editBankModalVisible.value = true
}

// 触发编辑文件选择
const triggerEditFileInput = () => {
  editFileInput.value.click()
}

// 处理编辑文件选择
const handleEditFileChange = async (e) => {
  const file = e.target.files[0]
  if (!file) return

  try {
    if (!file.type.startsWith('image/')) {
      message.error('请选择图片文件')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      message.error('图片大小不能超过2MB')
      return
    }

    const res = await fileApi.upload(file)
    if (res.code === 200) {
      editBankForm.picture = res.value
      message.success('图片上传成功')
    } else {
      message.error(res.msg || '图片上传失败')
    }
  } catch (error) {
    message.error('图片上传失败')
  } finally {
    e.target.value = ''
  }
}

// 处理更新题库
const handleUpdateBank = async () => {
  if (!editBankForm.title) {
    message.error('请输入题库名称')
    return
  }

  try {
    updatingBank.value = true
    const res = await questionBankApi.update(editBankForm)
    if (res.code === 200) {
      message.success('更新题库成功')
      editBankModalVisible.value = false
      // 刷新题库列表
      fetchBanks()
    } else {
      message.error(res.msg || '更新题库失败')
    }
  } catch (error) {
    console.error('更新题库失败:', error)
    message.error('更新题库失败')
  } finally {
    updatingBank.value = false
  }
}

onMounted(() => {
  if (activeTab.value === 'users') {
    fetchUsers()
  } else if (activeTab.value === 'questions') {
    fetchQuestions()
  } else if (activeTab.value === 'banks') {
    fetchBanks()
  }
})
</script>

<style scoped>
.admin-container {
  padding: 24px;
  max-width: 1200px;  /* 限制最大宽度 */
  margin: 0 auto;     /* 水平居中 */
}

.admin-card {
  background: #fff;
  border-radius: 8px;  /* 圆角 */
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);  /* 轻微阴影 */
}

.admin-card :deep(.ant-card-head-title h2) {
  margin: 0;
  font-size: 20px;
  text-align: left;
}

.tab-content {
  padding: 24px;
  min-height: 300px;
  background: #fff;
  border-radius: 0 0 8px 8px;  /* 底部圆角 */
}

.tab-content h3 {
  margin: 0 0 16px;
  font-size: 16px;
  text-align: left;
}

.table-operations {
  margin-bottom: 24px;
  display: flex;
  justify-content: flex-end;
}

/* 搜索表单样式 */
.search-form {
  margin-bottom: 24px;
  padding: 24px;
  background: #fafafa;
  border-radius: 8px;
}

/* 表格样式优化 */
:deep(.ant-table-wrapper) {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

:deep(.ant-table-thead > tr > th) {
  background: #fafafa;
}

/* 按钮间距 */
:deep(.ant-space) {
  gap: 8px !important;
}

/* 弹窗样式 */
:deep(.ant-modal-content) {
  border-radius: 8px;
}

:deep(.ant-modal-header) {
  border-radius: 8px 8px 0 0;
}

/* 标签页样式 */
:deep(.ant-tabs-nav) {
  margin-bottom: 0;
  padding: 0 24px;
  background: #fff;
  border-radius: 8px 8px 0 0;
}

/* 表单项间距 */
:deep(.ant-form-item) {
  margin-bottom: 16px;
}

.bank-thumbnail {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
}

.upload-wrapper {
  text-align: center;
}

.preview-container {
  position: relative;
  width: 200px;
  height: 150px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid #d9d9d9;
}

.preview-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  opacity: 0;
  transition: opacity 0.3s;
}

.preview-container:hover .upload-mask {
  opacity: 1;
}

.upload-mask .anticon {
  font-size: 24px;
  margin-bottom: 8px;
}

.upload-placeholder {
  width: 200px;
  height: 150px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: #fafafa;
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.3s;
}

.upload-placeholder:hover {
  border-color: #1890ff;
}

.upload-placeholder .anticon {
  font-size: 32px;
  color: #999;
  margin-bottom: 8px;
}

.upload-text {
  color: #666;
  font-size: 14px;
}

.upload-container {
  display: inline-block;
  cursor: pointer;
}
</style> 