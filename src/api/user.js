import request from './config'

export const userApi = {
  // 用户登录接口
  login(data) {
    return request({
      url: '/user/login',
      method: 'post',
      data: {
        userAccount: data.username,  // 用户账号
        userPassword: data.password  // 用户密码
      }
    })
  },
  // 获取当前登录用户信息接口
  getCurrentUser() {
    return request({
      url: '/user/me',
      method: 'get'
    })
  },
  // 获取用户签到数据
  getSignData(year) {
    return request.get('/user/getSignData', {
      params: { year }
    })
  },
  // 分页查询用户列表
  queryPage(params) {
    return request({
      url: '/user/queryPage',
      method: 'get',
      params: {
        page: params.page || 1,
        pageSize: params.pageSize || 10
      }
    })
  },
  // 签到
  sign: () => {
    return request({
      url: '/user/sign',
      method: 'get'
    })
  },
  // 获取收藏的题目
  getCollectedQuestions: (params) => {
    return request({
      url: '/collect/getCollectList',
      method: 'get',
      params: {
        page: params.page || 1,
        pageSize: params.pageSize || 10,
        userId: JSON.parse(localStorage.getItem('currentUser')).id
      }
    })
  },
  // 获取浏览记录
  getViewedQuestions: (params) => {
    return request({
      url: '/user/viewed',
      method: 'get',
      params
    })
  },
  // 注册
  register: (data) => {
    return request({
      url: '/user/register',
      method: 'post',
      data: {
        userAccount: data.username,
        userPassword: data.password
      }
    })
  }
} 