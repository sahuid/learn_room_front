import axios from 'axios'
import router from '@/router'
import { message } from 'ant-design-vue'

// 创建 axios 实例
const request = axios.create({
  baseURL: '/api',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    // 统一处理 401 未登录情况
    const responseData = response.data
    if (responseData.code === 401) {
      localStorage.removeItem('userInfo')
      localStorage.removeItem('currentUser')
      
      message.error(responseData.msg || '登录已过期，请重新登录')
      
      router.push('/login')
      
      return Promise.reject(new Error('未登录或登录已过期'))
    }
    if (responseData.code === 200) {
      return responseData
    }
    // 其他错误情况
    message.error(responseData.msg || '请求失败')
    return Promise.reject(responseData)
  },
  error => {
    console.error('请求错误:', error)
    // 处理网络错误等其他错误
    message.error('网络请求失败，请稍后重试')
    return Promise.reject(error)
  }
)

export default request 