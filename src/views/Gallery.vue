<template>
  <div class="gallery-container">
    <a-layout>
      <a-layout-header class="header">
        <div class="user-info">
          <span class="username">{{ userInfo.userName }}</span>
          <a-tag :color="userInfo.userRole === 1 ? 'blue' : 'green'">
            {{ userInfo.userRole === 1 ? '管理员' : '普通用户' }}
          </a-tag>
        </div>
      </a-layout-header>
      
      <a-layout-content class="content">
        <!-- 这里添加图库内容 -->
      </a-layout-content>
    </a-layout>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { userApi } from '@/api/user'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const userInfo = ref({
  id: null,
  userName: '',
  userAccount: '',
  userRole: 0,
  createTime: '',
  updateTime: ''
})

const fetchUserInfo = async () => {
  try {
    const res = await userApi.getCurrentUser()
    if (res.code === 200) {
      userInfo.value = res.data
      // 将用户信息保存到 localStorage
      localStorage.setItem('currentUser', JSON.stringify(res.data))
    } else {
      message.error(res.msg || '获取用户信息失败')
      // 如果获取用户信息失败，可能是未登录，跳转到登录页
      router.push('/login')
    }
  } catch (error) {
    message.error(error.response?.data?.msg || '获取用户信息失败')
    router.push('/login')
  }
}

onMounted(() => {
  fetchUserInfo()
})
</script>

<style scoped>
.gallery-container {
  min-height: 100vh;
}

.header {
  background: #fff;
  padding: 0 24px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.username {
  font-size: 16px;
  color: rgba(0, 0, 0, 0.85);
}

.content {
  padding: 24px;
  background: #fff;
  margin: 24px;
  min-height: 280px;
}
</style> 