<template>
  <div class="page-container">
    <div class="content-card">
      <h2 class="section-title">用户管理</h2>
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { userApi } from '@/api/user'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'

// 用户列表数据和分页配置
const loading = ref(false)
const users = ref([])
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
    title: '用户ID',
    dataIndex: 'id',
    key: 'id',
    width: 80
  },
  {
    title: '用户名',
    dataIndex: 'userName',
    key: 'userName'
  },
  {
    title: '账号',
    dataIndex: 'userAccount',
    key: 'userAccount'
  },
  {
    title: '角色',
    key: 'role',
    width: 100
  },
  {
    title: '创建时间',
    key: 'createTime',
    width: 180
  },
  {
    title: '更新时间',
    key: 'updateTime',
    width: 180
  }
]

// 获取用户列表
const fetchUsers = async () => {
  try {
    loading.value = true
    const res = await userApi.queryPage({
      page: pagination.value.current,
      pageSize: pagination.value.pageSize
    })
    if (res.code === 200) {
      users.value = res.value.records
      pagination.value.total = res.value.total
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

// 处理表格变化
const handleTableChange = (pag) => {
  pagination.value.current = pag.current
  pagination.value.pageSize = pag.pageSize
  fetchUsers()
}

// 格式化日期
const formatDate = (date) => {
  if (!date) return ''
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

onMounted(() => {
  fetchUsers()
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
</style> 