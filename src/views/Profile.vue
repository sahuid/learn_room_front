<template>
  <div class="profile-container">
    <input
      type="file"
      ref="fileInput"
      style="display: none"
      accept="image/*"
      @change="handleFileChange"
    />
    <a-row :gutter="24">
      <!-- 左侧个人信息卡片 -->
      <a-col :span="8">
        <a-card class="profile-card user-info-card">
          <div class="user-info-header">
            <div class="edit-button">
              <a-tooltip title="编辑个人信息">
                <a-button type="link" @click="showEditModal">
                  <EditOutlined />
                </a-button>
              </a-tooltip>
            </div>
            <div class="user-avatar-wrapper">
              <div class="avatar-container">
                <a-avatar 
                  :size="120" 
                  :src="userInfo.avatarUrl"
                >
                  {{ userInfo.userName?.charAt(0) }}
                </a-avatar>
              </div>
            </div>
          </div>
          <div class="user-basic-info">
            <h2 class="user-name">{{ userInfo.userName }}</h2>
            <div class="user-id">
              <span class="label">用户ID：</span>
              <span class="value">{{ userInfo.id }}</span>
            </div>
            <div class="user-role">
              <a-tag :color="userInfo.userRole === 1 ? 'blue' : 'green'">
                {{ userInfo.userRole === 1 ? '管理员' : '普通用户' }}
              </a-tag>
            </div>
            <div class="user-stats">
              <div class="stat-item">
                <div class="stat-value">{{ collectPagination.total }}</div>
                <div class="stat-label">收藏题目</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ viewPagination.total }}</div>
                <div class="stat-label">浏览记录</div>
              </div>
            </div>
          </div>
        </a-card>
      </a-col>

      <!-- 右侧内容区域 -->
      <a-col :span="16">
        <!-- 签到热力图卡片 -->
        <a-card 
          class="calendar-card" 
          :bordered="false"
        >
          <template #title>
            <div class="card-title">
              <span>签到记录</span>
              <span class="sign-streak">连续签到：{{ signStreak }} 天</span>
            </div>
          </template>
          <div ref="chartRef" class="chart-container"></div>
        </a-card>

        <!-- 记录卡片 -->
        <a-card class="records-card">
          <a-tabs v-model:activeKey="activeTab" @change="handleTabChange">
            <a-tab-pane key="collect" tab="我的收藏">
              <div v-if="collectedQuestions.length === 0" class="empty-container">
                <a-empty
                  description="暂无收藏的题目"
                  :image="Empty.PRESENTED_IMAGE_SIMPLE"
                >
                  <a-button type="primary" @click="$router.push('/home/question-bank')">
                    去题库看看
                  </a-button>
                </a-empty>
              </div>
              <a-list v-else :data-source="collectedQuestions" :pagination="collectPagination">
                <template #renderItem="{ item }">
                  <a-list-item>
                    <a-list-item-meta>
                      <template #title>
                        <div class="history-title" @click="goToQuestion(item.id)">
                          {{ item.title }}
                          <span class="history-tags">
                            <a-tag 
                              v-for="tag in (item.tags ? JSON.parse(item.tags) : [])"
                              :key="tag"
                              color="blue"
                            >
                              {{ tag }}
                            </a-tag>
                          </span>
                        </div>
                      </template>
                      <template #description>
                        <span class="view-time">浏览时间：{{ formatDateTime(item.viewTime) }}</span>
                      </template>
                    </a-list-item-meta>
                  </a-list-item>
                </template>
              </a-list>
            </a-tab-pane>
            <a-tab-pane key="view" tab="浏览记录">
              <div v-if="viewedQuestions.length === 0" class="empty-container">
                <a-empty
                  description="暂无浏览记录"
                  :image="Empty.PRESENTED_IMAGE_SIMPLE"
                >
                  <a-button type="primary" @click="$router.push('/home/question-bank')">
                    去题库看看
                  </a-button>
                </a-empty>
              </div>
              <a-list v-else :data-source="viewedQuestions" :pagination="viewPagination">
                <template #renderItem="{ item }">
                  <a-list-item>
                    <a-list-item-meta>
                      <template #title>
                        <div class="history-title" @click="goToQuestion(item.id)">
                          {{ item.title }}
                          <span class="history-tags">
                            <a-tag 
                              v-for="tag in (item.tags ? JSON.parse(item.tags) : [])"
                              :key="tag"
                              color="blue"
                            >
                              {{ tag }}
                            </a-tag>
                          </span>
                        </div>
                      </template>
                      <template #description>
                        <div class="history-meta">
                          <span class="view-time">浏览时间：{{ formatDateTime(item.viewTime) }}</span>
                          <span class="view-count">
                            <EyeOutlined />
                            <span>{{ item.viewCount }}次浏览</span>
                          </span>
                        </div>
                      </template>
                    </a-list-item-meta>
                  </a-list-item>
                </template>
              </a-list>
            </a-tab-pane>
          </a-tabs>
        </a-card>
      </a-col>
    </a-row>

    <!-- 添加编辑模态框 -->
    <a-modal
      v-model:visible="editModalVisible"
      title="编辑个人信息"
      @ok="handleUpdate"
      @cancel="editModalVisible = false"
      :confirm-loading="updating"
    >
      <a-form layout="vertical">
        <a-form-item label="头像">
          <div class="avatar-uploader">
            <div class="avatar-upload" @click="triggerFileInput">
              <a-tooltip title="点击修改头像">
                <div class="avatar-wrapper">
                  <a-avatar :size="128" :src="editForm.picture">
                    {{ editForm.userName?.charAt(0) }}
                  </a-avatar>
                  <div class="avatar-hover-mask">
                    <camera-outlined />
                    <span>更换头像</span>
                  </div>
                </div>
              </a-tooltip>
            </div>
          </div>
        </a-form-item>

        <a-form-item label="用户名">
          <a-input v-model:value="editForm.userName" />
        </a-form-item>
        
        <a-form-item label="手机号">
          <a-input v-model:value="editForm.userPhone" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script>
export default {
  name: 'Profile'
}
</script>

<script setup>
import { ref, onMounted, onUnmounted, reactive } from 'vue'
import { userStorage } from '@/utils/user'
import { userApi } from '@/api/user'
import { questionApi } from '@/api/question'
import * as echarts from 'echarts/core'
import {
  CalendarComponent,
  TooltipComponent,
  VisualMapComponent
} from 'echarts/components'
import { HeatmapChart } from 'echarts/charts'
import { CanvasRenderer } from 'echarts/renderers'
import dayjs from 'dayjs'
import { 
  EyeOutlined,
  EditOutlined,
  CameraOutlined
} from '@ant-design/icons-vue'
import { message, Empty } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import { fileApi } from '@/api/file'

// 注册必需的组件
echarts.use([
  CalendarComponent,
  TooltipComponent,
  VisualMapComponent,
  HeatmapChart,
  CanvasRenderer
])

const userInfo = ref({
  id: '',
  userName: '',
  userAccount: '',
  userRole: 0,
  createTime: '',
  updateTime: '',
  avatarUrl: ''
})

// 格式化日期时间
const formatDateTime = (dateString) => {
  if (!dateString) return '暂无'
  return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss')
}

// ECharts 实例
let chart = null
const chartRef = ref(null)

// 获取签到数据
async function getSignInData() {
  try {
    const currentYear = dayjs().year()
    const res = await userApi.getSignData(currentYear)
    if (res.code === 200 && Array.isArray(res.value)) {
      // 转换签到天数为日期数据
      return res.value.map(day => {
        const date = dayjs().startOf('year').add(day - 1, 'day')
        return [date.format('YYYY-MM-DD'), 1]
      })
    }
    return []
  } catch (error) {
    console.error('获取签到数据失败:', error)
    return []
  }
}

// 生成完整的年度数据（包含签到的日期）
function generateFullYearData(signedDays) {
  const data = []
  const startDate = dayjs().startOf('year')
  const endDate = dayjs().endOf('year')
  const signedDatesMap = new Map(signedDays)
  
  let currentDate = startDate
  while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
    const dateStr = currentDate.format('YYYY-MM-DD')
    data.push([
      dateStr,
      signedDatesMap.has(dateStr) ? 1 : 0
    ])
    currentDate = currentDate.add(1, 'day')
  }
  return data
}

// 初始化图表
async function initChart() {
  if (chart) {
    chart.dispose()
  }

  const chartDom = chartRef.value
  chart = echarts.init(chartDom)

  // 获取签到数据并生成完整的年度数据
  const signedDays = await getSignInData()
  const fullYearData = generateFullYearData(signedDays)

  const option = {
    tooltip: {
      position: 'top',
      padding: [8, 12],
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderColor: '#e1e1e1',
      borderWidth: 1,
      textStyle: {
        color: '#666'
      },
      formatter: function (params) {
        const date = dayjs(params.value[0])
        return `<div style="font-weight: bold; margin-bottom: 4px;">
                  ${date.format('YYYY年MM月DD日')}
                </div>
                <div style="color: ${params.value[1] === 1 ? '#52c41a' : '#999'}">
                  ${params.value[1] === 1 ? '✓ 已签到' : '✗ 未签到'}
                </div>`
      }
    },
    visualMap: {
      min: 0,
      max: 1,
      calculable: false,
      orient: 'horizontal',
      left: 'center',
      bottom: 20,
      show: false,
      inRange: {
        color: ['#f0f0f0', '#95de64', '#52c41a']
      }
    },
    calendar: {
      top: 20,
      left: 30,
      right: 30,
      cellSize: ['auto', 16],
      splitLine: {
        show: true,
        lineStyle: {
          color: '#e8e8e8',
          width: 1.5,
          type: 'solid'
        }
      },
      range: [
        dayjs().startOf('year').format('YYYY-MM-DD'),
        dayjs().endOf('year').format('YYYY-MM-DD')
      ],
      itemStyle: {
        borderWidth: 1.5,
        borderColor: '#fff',
        borderRadius: 2,
        color: '#fafafa'
      },
      yearLabel: { show: false },
      monthLabel: {
        nameMap: 'cn',
        fontSize: 12,
        color: '#666',
        margin: 6,
        align: 'left'
      },
      dayLabel: {
        firstDay: 1,
        nameMap: 'cn',
        fontSize: 12,
        color: '#999',
        margin: 3
      }
    },
    series: {
      type: 'heatmap',
      coordinateSystem: 'calendar',
      emphasis: {
        itemStyle: {
          borderColor: '#1890ff',
          borderWidth: 1.5
        }
      },
      data: fullYearData
    }
  }

  chart.setOption(option)
}

// 处理窗口大小变化
function handleResize() {
  chart && chart.resize()
}

const router = useRouter()
const collectedQuestions = ref([])
const viewedQuestions = ref([])
const collectLoading = ref(false)
const viewLoading = ref(false)

// 分页配置
const collectPagination = ref({
  current: 1,
  pageSize: 10,
  total: 0,
  onChange: (page, pageSize) => {
    collectPagination.value.current = page
    collectPagination.value.pageSize = pageSize
    fetchCollectedQuestions()
  }
})

const viewPagination = ref({
  current: 1,
  pageSize: 10,
  total: 0,
  onChange: (page, pageSize) => {
    viewPagination.value.current = page
    viewPagination.value.pageSize = pageSize
    fetchViewedQuestions()
  }
})

// 获取收藏的题目
const fetchCollectedQuestions = async () => {
  collectLoading.value = true
  try {
    const userInfo = localStorage.getItem('userInfo')
    if (!userInfo) {
      message.warning('请先登录')
      return
    }

    const res = await userApi.getCollectedQuestions({
      page: collectPagination.value.current,
      pageSize: collectPagination.value.pageSize
    })
    if (res.code === 200) {
      collectedQuestions.value = res.value.data || []
      collectPagination.value.total = res.value.total || 0
    }
  } catch (error) {
    console.error('获取收藏题目失败:', error)
    message.error('获取收藏题目失败')
  } finally {
    collectLoading.value = false
  }
}

// 获取浏览记录
const fetchViewedQuestions = async () => {
  viewLoading.value = true
  try {
    const userInfo = localStorage.getItem('userInfo')
    if (!userInfo) {
      message.warning('请先登录')
      return
    }

    const res = await questionApi.getViewHistory({
      page: viewPagination.value.current,
      pageSize: viewPagination.value.pageSize,
      userId: JSON.parse(userInfo).id
    })
    if (res.code === 200) {
      viewedQuestions.value = res.value.data || []
      viewPagination.value.total = res.value.total || 0
    }
  } catch (error) {
    console.error('获取浏览记录失败:', error)
    message.error('获取浏览记录失败')
  } finally {
    viewLoading.value = false
  }
}

// 跳转到题目详情
const goToQuestion = (id) => {
  router.push(`/home/question-bank/question/${id}`)
}

// 当前激活的标签页
const activeTab = ref('collect')

// 处理标签页切换
const handleTabChange = (key) => {
  if (key === 'collect') {
    fetchCollectedQuestions()
  } else if (key === 'view') {
    fetchViewedQuestions()
  }
}

const signStreak = ref(0) // 添加连续签到天数

// 添加文件输入框的引用
const fileInput = ref(null)

// 添加新的响应式数据
const editModalVisible = ref(false)
const updating = ref(false)
const editForm = reactive({
  userName: '',
  userPhone: '',
  picture: ''
})

// 显示编辑模态框
const showEditModal = () => {
  Object.assign(editForm, {
    userName: userInfo.value.userName,
    userPhone: userInfo.value.userPhone,
    picture: userInfo.value.avatarUrl
  })
  editModalVisible.value = true
}

// 添加触发文件选择的方法
const triggerFileInput = () => {
  fileInput.value.click()
}

// 修改文件上传处理函数
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
      editForm.picture = res.value
      // 立即更新头像显示
      userInfo.value.avatarUrl = res.value
      // 更新本地存储
      const currentUser = JSON.parse(localStorage.getItem('userInfo'))
      currentUser.avatarUrl = res.value
      localStorage.setItem('userInfo', JSON.stringify(currentUser))
      // 触发全局事件
      window.dispatchEvent(new CustomEvent('avatar-updated'))
      message.success('头像上传成功')
    }
  } catch (error) {
    console.error('上传失败:', error)
    message.error('头像上传失败')
  } finally {
    // 清空文件输入框，允许重复选择同一文件
    e.target.value = ''
  }
}

// 修改更新处理函数，添加错误处理
const handleUpdate = async () => {
  try {
    updating.value = true
    const params = {
      id: userInfo.value.id,
      userName: editForm.userName,
      userPhone: editForm.userPhone,
      picture: editForm.picture
    }
    
    const res = await userApi.updateUserInfo(params)
    if (res.code === 200) {
      message.success('更新成功')
      // 更新本地信息
      Object.assign(userInfo.value, params)
      // 更新本地存储
      const currentUser = JSON.parse(localStorage.getItem('userInfo') || '{}')
      Object.assign(currentUser, params)
      localStorage.setItem('userInfo', JSON.stringify(currentUser))
      editModalVisible.value = false
    } else {
      message.error(res.msg || '更新失败')
    }
  } catch (error) {
    console.error('更新失败:', error)
    message.error(error.response?.data?.msg || '更新失败')
  } finally {
    updating.value = false
  }
}

onMounted(() => {
  const user = userStorage.getUser()
  if (user) {
    userInfo.value = user
  }
  
  // 初始化图表
  initChart()
  
  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
  // 获取收藏和浏览记录
  fetchCollectedQuestions()
  fetchViewedQuestions()
})

onUnmounted(() => {
  // 清理图表实例和事件监听
  if (chart) {
    chart.dispose()
    chart = null
  }
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.profile-container {
  padding: 24px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 64px);
}

.profile-card {
  margin-bottom: 24px;
  height: 100%;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.user-info-card {
  text-align: center;
}

.user-avatar-container {
  margin: 20px 0;
}

.avatar-container {
  position: relative;
  cursor: pointer;
  border-radius: 50%;
  overflow: hidden;
  width: 120px;
  height: 120px;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  opacity: 0;
  transition: opacity 0.3s;
  cursor: pointer;
  z-index: 1;
}

.avatar-container:hover .avatar-overlay {
  opacity: 1;
}

.avatar-overlay .anticon {
  font-size: 24px;
  margin-bottom: 8px;
}

.user-avatar-wrapper {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto;
  border: 4px solid rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

:deep(.ant-avatar) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-basic-info {
  padding: 24px;
  text-align: center;
}

.user-name {
  margin: 16px 0;
  font-size: 24px;
  color: rgba(0, 0, 0, 0.85);
  font-weight: 600;
}

.user-id {
  margin: 8px 0;
  color: rgba(0, 0, 0, 0.45);
}

.user-role {
  margin: 16px 0;
}

.label {
  color: rgba(0, 0, 0, 0.45);
  margin-right: 8px;
}

.value {
  color: rgba(0, 0, 0, 0.65);
}

.detail-card {
  background: #fff;
}

:deep(.ant-descriptions-item-label) {
  width: 120px;
  background-color: #fafafa;
}

:deep(.ant-descriptions-item-content) {
  color: rgba(0, 0, 0, 0.65);
}

.calendar-card {
  margin-bottom: 16px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  :deep(.ant-card-head) {
    min-height: 48px;
    padding: 0 12px;
  }
  :deep(.ant-card-head-title) {
    padding: 8px 0;
    font-size: 14px;
  }
  :deep(.ant-card-body) {
    padding: 8px 12px;
  }
}

.chart-container {
  width: 100%;
  height: 160px;
  margin: 4px 0;
}

.question-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: rgba(0, 0, 0, 0.45);
}

:deep(.ant-list-item) {
  padding: 16px;
  transition: all 0.3s;
}

:deep(.ant-list-item:hover) {
  background: #f5f5f5;
}

:deep(.ant-list-item-meta-title) {
  margin-bottom: 8px;
}

:deep(.ant-list-item-meta-title a) {
  color: rgba(0, 0, 0, 0.85);
  font-size: 16px;
}

:deep(.ant-list-item-meta-description) {
  font-size: 14px;
}

/* 标签页样式 */
:deep(.ant-tabs-nav) {
  margin-bottom: 16px;
  padding: 0 24px;
}

:deep(.ant-tabs-tab) {
  padding: 12px 0;
  font-size: 16px;
  transition: all 0.3s;
}

:deep(.ant-tabs-tab + .ant-tabs-tab) {
  margin-left: 32px;
}

:deep(.ant-tabs-tab:hover) {
  color: #1890ff;
}

:deep(.ant-tabs-tab-active) {
  font-weight: 500;
}

:deep(.ant-tabs-ink-bar) {
  height: 3px;
  border-radius: 3px;
}

.user-info-header {
  padding: 24px 0;
  background: linear-gradient(135deg, #1890ff 0%, #36cfc9 100%);
  border-radius: 8px 8px 0 0;
}

.user-stats {
  display: flex;
  justify-content: center;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #f0f0f0;
}

.stat-item {
  padding: 0 24px;
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #1890ff;
}

.stat-label {
  margin-top: 4px;
  color: rgba(0, 0, 0, 0.45);
}

.card-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sign-streak {
  font-size: 14px;
  color: #52c41a;
}

.records-card {
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.custom-list {
  margin: 0 -24px;
}

.list-item-hover {
  padding: 16px 24px;
  transition: all 0.3s;
  cursor: pointer;
}

.list-item-hover:hover {
  background-color: #f5f7fa;
}

.stat-icon {
  color: rgba(0, 0, 0, 0.45);
  transition: color 0.3s;
}

.stat-icon:hover {
  color: #1890ff;
}

/* 浏览记录列表样式 */
.view-history-list {
  padding: 0 16px;
}

.history-item {
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
}

.history-content {
  width: 100%;
}

.history-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.history-title {
  cursor: pointer;
  color: rgba(0, 0, 0, 0.85);
  font-size: 16px;
  transition: color 0.3s;
}

.history-title:hover {
  color: #1890ff;
}

.history-footer {
  display: flex;
  align-items: center;
  gap: 24px;
}

.history-time {
  color: rgba(0, 0, 0, 0.45);
  font-size: 14px;
}

.history-view-count {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #52c41a;
}

.history-view-count :deep(.anticon) {
  font-size: 16px;
}

.history-tags {
  display: inline-flex;
  gap: 8px;
  margin-left: 12px;
}

.loading-container {
  display: flex;
  justify-content: center;
  padding: 32px 0;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 24px;
  padding: 16px 0;
}

.empty-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  background: #fff;
}

/* 自定义空状态图片大小 */
.empty-container :deep(.ant-empty-image) img {
  height: 100px;
}

.view-time {
  color: rgba(0, 0, 0, 0.45);
  font-size: 14px;
}

:deep(.ant-list-item) {
  padding: 16px 24px;
  transition: background-color 0.3s;
}

:deep(.ant-list-item:hover) {
  background-color: #fafafa;
}

:deep(.ant-list-item-meta-title) {
  margin-bottom: 8px;
}

:deep(.ant-list-item-meta-description) {
  margin-top: 8px;
}

.history-meta {
  display: flex;
  align-items: center;
  gap: 24px;
}

.view-count {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #8c8c8c;
}

.view-count .anticon {
  font-size: 14px;
}

/* 添加编辑按钮样式 */
.edit-button {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 2;
}

.edit-button :deep(.ant-btn) {
  color: rgba(0, 0, 0, 0.45);
}

.edit-button :deep(.ant-btn:hover) {
  color: #1890ff;
}

/* 添加头像上传样式 */
.avatar-uploader {
  text-align: center;
  margin-bottom: 24px;
}

.avatar-uploader :deep(.ant-upload) {
  cursor: pointer;
  transition: all 0.3s;
}

.avatar-uploader :deep(.ant-upload:hover) {
  transform: scale(1.05);
}

/* 添加上传提示样式 */
.avatar-wrapper {
  position: relative;
  cursor: pointer;
  border-radius: 50%;
  overflow: hidden;
  width: 128px;
  height: 128px;
  display: inline-block;
}

.avatar-hover-mask {
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

.avatar-wrapper:hover .avatar-hover-mask {
  opacity: 1;
}

.avatar-hover-mask .anticon {
  font-size: 24px;
  margin-bottom: 8px;
}

.avatar-upload {
  text-align: center;
}
</style> 