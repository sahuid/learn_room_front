import { createRouter, createWebHistory } from 'vue-router'
import Login from '@/views/Login.vue'
import BasicLayout from '@/layouts/BasicLayout.vue'
import Home from '@/views/Home.vue'
import { message } from 'ant-design-vue'
import Interview from '@/views/Interview.vue'
import AIAssistant from '@/views/AIAssistant.vue'
import Admin from '@/views/Admin.vue'
import Register from '@/views/Register.vue'

// 路由配置
const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/home',
    component: BasicLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        component: Home
      },
      {
        path: 'profile',
        component: () => import('@/views/Profile.vue'),
        name: 'Profile'
      },
      {
        path: 'question-bank',
        component: () => import('@/views/QuestionBank.vue'),
        name: 'QuestionBank'
      },
      {
        path: 'learning-path',
        component: () => import('@/views/LearningPath.vue'),
        name: 'LearningPath'
      },
      {
        path: 'hot-questions',
        component: () => import('@/views/HotQuestions.vue'),
        name: 'HotQuestions'
      },
      {
        path: 'interview',
        component: Interview
      },
      {
        path: 'ai-assistant',
        component: AIAssistant
      },
      {
        path: 'admin',
        component: Admin
      },
      {
        path: 'question-bank/detail/:id',
        component: () => import('@/views/QuestionBankDetail.vue'),
        name: 'QuestionBankDetail',
        props: true
      },
      {
        path: 'question-bank/question/:id',
        component: () => import('@/views/QuestionDetail.vue'),
        name: 'QuestionDetail'
      },
      {
        path: 'admin',
        component: () => import('@/views/Admin.vue'),
        name: 'Admin',
        meta: { 
          requiresAuth: true,
          requiresAdmin: true
        }
      },
      {
        path: 'question/add',
        component: () => import('@/views/AddQuestion.vue'),
        name: 'AddQuestion',
        meta: { 
          requiresAuth: true,
          requiresAdmin: true
        }
      },
      {
        path: 'bank/detail/:id',
        component: () => import('@/views/QuestionBankDetail.vue'),
        props: true
      }
    ]
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/register',
    name: 'Register',
    component: Register
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 全局路由守卫
router.beforeEach((to, from, next) => {
  // 如果是访问登录页，直接放行
  if (to.path === '/login') {
    next()
    return
  }

  const tokenValue = localStorage.getItem('tokenValue')
  const userInfo = localStorage.getItem('userInfo')
  const userRole = userInfo ? JSON.parse(userInfo).userRole : null

  // 检查是否需要认证且未登录
  if (to.meta.requiresAuth && !tokenValue) {
    // 清除可能存在的过期数据
    localStorage.removeItem('tokenName')
    localStorage.removeItem('tokenValue')
    localStorage.removeItem('userInfo')
    next('/login')  // 未登录跳转到登录页
  } 
  // 检查是否需要管理员权限
  else if (to.meta.requiresAdmin && userRole !== 1) {
    message.error('需要管理员权限')
    next(from.path)  // 返回之前的页面
  } else {
    next()  // 其他情况正常跳转
  }
})

export default router 