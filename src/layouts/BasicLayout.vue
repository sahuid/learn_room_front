<template>
  <div class="basic-layout">
    <a-layout>
      <!-- 导航栏 -->
      <a-layout-header class="header">
        <div class="logo">LearnRoom</div>
        <a-menu
          v-model:selectedKeys="selectedKeys"
          mode="horizontal"
          theme="light"
          class="menu"
        >
          <a-menu-item key="home" @click="router.push('/home')">
            <template #icon>
              <HomeOutlined />
            </template>
            <span>主页</span>
          </a-menu-item>
          <a-menu-item key="question-bank" @click="router.push('/home/question-bank')">
            <template #icon>
              <BookOutlined />
            </template>
            <span>题库</span>
          </a-menu-item>
          <a-menu-item key="learning-path" @click="router.push('/home/learning-path')">
            <template #icon>
              <RoadMapOutlined />
            </template>
            <span>刷题路线</span>
          </a-menu-item>
          <a-menu-item key="hot-questions" @click="router.push('/home/hot-questions')">
            <template #icon>
              <FireOutlined />
            </template>
            <span>招聘热题</span>
          </a-menu-item>
          <a-menu-item key="interview" @click="router.push('/home/interview')">
            <template #icon>
              <SolutionOutlined />
            </template>
            <span>真实面经</span>
          </a-menu-item>
          <a-menu-item key="ai-assistant" @click="router.push('/home/ai-assistant')">
            <template #icon>
              <RobotOutlined />
            </template>
            <span>AI助手</span>
          </a-menu-item>
          <a-menu-item v-if="isAdmin" key="admin" @click="router.push('/home/admin')">
            <template #icon>
              <SettingOutlined />
            </template>
            <span>管理后台</span>
          </a-menu-item>
        </a-menu>
        <div class="user-info">
          <a-dropdown>
            <a-space class="user-dropdown-link">
              <a-avatar v-if="userInfo?.userName" :src="userInfo.avatarUrl">
                {{ !userInfo.avatarUrl ? userInfo.userName.charAt(0) : '' }}
              </a-avatar>
              <span class="username">{{ userInfo.userName }}</span>
              <DownOutlined />
            </a-space>
            <template #overlay>
              <a-menu>
                <a-menu-item key="profile" @click="goToProfile">
                  <UserOutlined />
                  <span>个人中心</span>
                </a-menu-item>
                <a-menu-divider />
                <a-menu-item key="logout" @click="handleLogout">
                  <LogoutOutlined />
                  <span>退出登录</span>
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </a-layout-header>
      
      <!-- 内容区域 -->
      <a-layout-content class="content">
        <router-view></router-view>
      </a-layout-content>
    </a-layout>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed, onUnmounted } from 'vue'
import { userApi } from '@/api/user'
import { message } from 'ant-design-vue'
import { useRouter, useRoute } from 'vue-router'
import { userStorage } from '@/utils/user'
import {
  HomeOutlined,
  BookOutlined,
  RoadMapOutlined,
  FireOutlined,
  SolutionOutlined,
  UserOutlined,
  LogoutOutlined,
  DownOutlined,
  SettingOutlined,
  RobotOutlined
} from '@ant-design/icons-vue'

const router = useRouter()
const route = useRoute()

// 当前选中的菜单项
const selectedKeys = ref(['home'])

// 监听路由变化，更新选中的菜单项
watch(
  () => route.path,
  (path) => {
    const key = path === '/home' ? 'home' : path.split('/').pop()
    selectedKeys.value = [key]
  },
  { immediate: true }
)

// 用户信息
const userInfo = ref({
  id: null,
  userName: '',
  userAccount: '',
  userRole: 0,
  userPicture: '',
  createTime: '',
  updateTime: '',
  avatarUrl: ''
})

// 获取用户信息
const fetchUserInfo = async () => {
  try {
    const loginInfo = localStorage.getItem('userInfo')
    if (!loginInfo) {
      router.push('/login')
      return
    }
    
    const cachedUser = userStorage.getUser()
    if (cachedUser) {
      if (cachedUser.userPicture && !cachedUser.avatarUrl) {
        cachedUser.avatarUrl = cachedUser.userPicture
      }
      userInfo.value = cachedUser
      return
    }

    const res = await userApi.getuserInfo()
    if (res.code === 200) {
      const userData = res.value || {}
      userInfo.value = {
        id: userData.id || null,
        userName: userData.userName || '',
        userAccount: userData.userAccount || '',
        userRole: userData.userRole || 0,
        userPicture: userData.userPicture || '',
        createTime: userData.createTime || '',
        updateTime: userData.updateTime || '',
        avatarUrl: userData.userPicture || userData.avatarUrl || ''
      }
      userStorage.setUser(userInfo.value)
    } else {
      message.error(res.msg || '获取用户信息失败')
      router.push('/login')
    }
  } catch (error) {
    message.error(error.response?.data?.msg || '获取用户信息失败')
    router.push('/login')
  }
}

// 只在有登录信息时才获取用户信息
onMounted(() => {
  if (localStorage.getItem('userInfo')) {
    fetchUserInfo()
  }

  // 添加头像更新事件监听
  window.addEventListener('avatar-updated', handleAvatarUpdate)
})

onUnmounted(() => {
  // 移除事件监听
  window.removeEventListener('avatar-updated', handleAvatarUpdate)
})

// 跳转到个人中心
const goToProfile = () => {
  router.push('/home/profile')
}

// 退出登录
const handleLogout = () => {
  // 清除用户信息
  localStorage.removeItem('userInfo')
  userStorage.clearUser()
  // 跳转到登录页
  router.push('/login')
  message.success('已退出登录')
}

// 判断是否为管理员
const isAdmin = computed(() => userInfo.value?.userRole === 1)

// 修改头像更新事件处理函数
const handleAvatarUpdate = () => {
  try {
    const storedUserInfo = JSON.parse(localStorage.getItem('userInfo'))
    if (storedUserInfo) {
      // 直接更新整个userInfo对象
      userInfo.value = storedUserInfo
    }
  } catch (error) {
    console.error('更新头像失败:', error)
  }
}
</script>

<style scoped>
.basic-layout {
  min-height: 100vh;
  background-color: #f0f2f5;
}

.header {
  display: flex;
  align-items: center;
  padding: 0 24px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}

.logo {
  font-size: 20px;
  font-weight: 600;
  color: #1890ff;
  margin-right: 48px;
}

.menu {
  flex: 1;
  line-height: 64px;
}

:deep(.ant-menu-item) {
  display: flex;
  align-items: center;
  gap: 4px;
}

:deep(.ant-menu-item .anticon) {
  font-size: 16px;
}

:deep(.ant-menu-item a) {
  color: rgba(0, 0, 0, 0.85);
  text-decoration: none;
}

:deep(.ant-menu-item-selected a) {
  color: #1890ff;
}

.user-info {
  margin-left: 24px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.username {
  font-size: 16px;
  color: rgba(0, 0, 0, 0.85);
}

:deep(.ant-avatar) {
  background-color: #1890ff;
  cursor: pointer;
  width: 32px;
  height: 32px;
  line-height: 32px;
}

:deep(.ant-avatar img) {
  object-fit: cover;
  width: 100%;
  height: 100%;
}

.user-dropdown-link {
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.3s;
}

.user-dropdown-link:hover {
  background: rgba(0, 0, 0, 0.025);
}

.content {
  margin-top: 64px;
  min-height: calc(100vh - 64px);
}
</style> 