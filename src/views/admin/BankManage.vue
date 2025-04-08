<template>
  <div class="page-container">
    <div class="content-card">
      <div class="header-section">
        <h2 class="section-title">题库管理</h2>
        <div class="header-right">
          <a-button type="primary" class="add-button" @click="showAddModal">
            <template #icon><plus-outlined /></template>
            添加题库
          </a-button>
        </div>
      </div>

      <!-- 题库列表 -->
      <a-table
        :loading="loading"
        :columns="columns"
        :data-source="banks"
        :pagination="pagination"
        @change="handleTableChange"
        :rowClassName="() => 'table-row'"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'picture'">
            <div class="image-wrapper">
              <img
                v-if="record.picture"
                :src="record.picture"
                alt="题库图片"
                class="bank-image"
              />
              <div v-else class="no-image">
                <picture-outlined />
              </div>
            </div>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" class="edit-button" @click="handleEdit(record)">
                <template #icon><edit-outlined /></template>
                编辑
              </a-button>
              <a-popconfirm
                title="确定要删除这个题库吗？"
                @confirm="() => handleDelete(record)"
                placement="topRight"
              >
                <a-button type="link" class="delete-button" danger>
                  <template #icon><delete-outlined /></template>
                  删除
                </a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </div>

    <!-- 添加/编辑题库的模态框 -->
    <a-modal
      v-model:visible="modalVisible"
      :title="isEdit ? '编辑题库' : '添加题库'"
      @ok="handleSubmit"
      :confirm-loading="submitting"
      :maskClosable="false"
      :width="520"
    >
      <a-form :model="formState" layout="vertical">
        <a-form-item label="题库名称" required>
          <a-input v-model:value="formState.title" placeholder="请输入题库名称" />
        </a-form-item>
        
        <a-form-item label="题库描述">
          <a-textarea 
            v-model:value="formState.description" 
            placeholder="请输入题库描述"
            :rows="4" 
          />
        </a-form-item>
        
        <a-form-item label="题库图片">
          <div class="upload-wrapper">
            <div class="upload-container" @click="triggerFileInput">
              <div v-if="formState.picture" class="preview-container">
                <img :src="formState.picture" alt="题库图片" />
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

    <!-- 隐藏的文件输入框 -->
    <input
      type="file"
      ref="fileInput"
      style="display: none"
      accept="image/*"
      @change="handleFileChange"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { questionBankApi } from '@/api/questionBank'
import { fileApi } from '@/api/file'
import { 
  PlusOutlined, 
  CameraOutlined,
  EditOutlined,
  DeleteOutlined,
  PictureOutlined
} from '@ant-design/icons-vue'

const loading = ref(false)
const banks = ref([])
const modalVisible = ref(false)
const submitting = ref(false)
const isEdit = ref(false)
const fileInput = ref(null)

// 表单状态
const formState = ref({
  id: null,
  title: '',
  description: '',
  picture: ''
})

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
    title: '题库名称',
    dataIndex: 'title',
    key: 'title',
    width: '25%'
  },
  {
    title: '描述',
    dataIndex: 'description',
    key: 'description',
    ellipsis: true,
    width: '45%'
  },
  {
    title: '图片',
    key: 'picture',
    width: '15%',
    align: 'center'
  },
  {
    title: '操作',
    key: 'action',
    width: '15%',
    align: 'center',
    fixed: 'right'
  }
]

// 获取题库列表
const fetchBanks = async () => {
  try {
    loading.value = true
    const res = await questionBankApi.queryPage({
      page: pagination.value.current,
      pageSize: pagination.value.pageSize
    })
    if (res.code === 200) {
      banks.value = res.value.records
      pagination.value.total = res.value.total
    }
  } catch (error) {
    message.error('获取题库列表失败')
  } finally {
    loading.value = false
  }
}

// 显示添加模态框
const showAddModal = () => {
  isEdit.value = false
  formState.value = {
    id: null,
    title: '',
    description: '',
    picture: ''
  }
  modalVisible.value = true
}

// 处理编辑
const handleEdit = (record) => {
  isEdit.value = true
  formState.value = { ...record }
  modalVisible.value = true
}

// 处理删除
const handleDelete = async (record) => {
  try {
    const res = await questionBankApi.delete({ id: record.id })
    if (res.code === 200) {
      message.success('删除成功')
      fetchBanks()
    }
  } catch (error) {
    message.error('删除失败')
  }
}

// 处理表格变化
const handleTableChange = (pag) => {
  pagination.value.current = pag.current
  pagination.value.pageSize = pag.pageSize
  fetchBanks()
}

// 触发文件选择
const triggerFileInput = () => {
  fileInput.value.click()
}

// 处理文件选择
const handleFileChange = async (e) => {
  const file = e.target.files[0]
  if (!file) return

  try {
    const res = await fileApi.upload(file)
    if (res.code === 200) {
      formState.value.picture = res.value
    } else {
      message.error(res.msg || '上传失败')
    }
  } catch (error) {
    message.error('上传失败')
  }
  
  // 清空文件输入框
  e.target.value = ''
}

// 处理提交
const handleSubmit = async () => {
  if (!formState.value.title) {
    message.error('请输入题库名称')
    return
  }

  try {
    submitting.value = true
    const api = isEdit.value ? questionBankApi.update : questionBankApi.add
    const res = await api(formState.value)
    
    if (res.code === 200) {
      message.success(isEdit.value ? '更新成功' : '添加成功')
      modalVisible.value = false
      fetchBanks()
    } else {
      message.error(res.msg || (isEdit.value ? '更新失败' : '添加失败'))
    }
  } catch (error) {
    message.error(isEdit.value ? '更新失败' : '添加失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchBanks()
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 24px;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.section-title {
  font-size: 20px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.85);
  margin: 0;
}

.add-button {
  font-weight: 500;
  height: 36px;
  padding: 0 20px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(24, 144, 255, 0.1);
}

.table-row {
  transition: all 0.3s;
}

.table-row:hover {
  background-color: #fafafa;
}

.image-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 60px;
  height: 60px;
  border-radius: 6px;
  overflow: hidden;
  background-color: #f5f5f5;
}

.bank-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.bank-image:hover {
  transform: scale(1.1);
}

.no-image {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  color: #bfbfbf;
}

.no-image .anticon {
  font-size: 24px;
}

.edit-button,
.delete-button {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.3s;
}

.edit-button:hover {
  background-color: #e6f7ff;
  color: #1890ff;
}

.delete-button:hover {
  background-color: #fff1f0;
  color: #ff4d4f;
}

.edit-button .anticon,
.delete-button .anticon {
  margin-right: 4px;
  font-size: 14px;
}

.upload-wrapper {
  width: 100%;
}

.upload-container {
  cursor: pointer;
  transition: all 0.3s;
}

.preview-container {
  position: relative;
  width: 160px;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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

.upload-placeholder {
  width: 160px;
  height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: #fafafa;
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
  transition: all 0.3s;
}

.upload-placeholder:hover {
  border-color: #1890ff;
  background-color: #e6f7ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
}

.upload-placeholder .anticon {
  font-size: 24px;
  color: #bfbfbf;
  margin-bottom: 8px;
  transition: all 0.3s;
}

.upload-placeholder:hover .anticon {
  color: #1890ff;
  transform: scale(1.1);
}

.upload-text {
  margin-top: 8px;
  color: #666;
  font-size: 14px;
}
</style> 