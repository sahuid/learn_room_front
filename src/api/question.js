import request from './config'

export const questionApi = {
  // 获取题目详情
  queryOne: (params) => {
    return request({
      url: '/question/queryOne',
      method: 'get',
      params
    })
  },
  // 分页查询题目列表
  queryPage: (params) => {
    return request({
      url: '/question/queryPage',
      method: 'get',
      params: {
        page: params.page || 1,
        pageSize: params.pageSize || 10
      }
    })
  },
  // 添加题目
  add: (data) => {
    return request({
      url: '/question/add',
      method: 'post',
      data,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  },
  // 删除题目
  delete: (params) => {
    return request({
      url: '/question/delete',
      method: 'delete',
      params
    })
  },
  // 点赞题目
  like: (params) => {
    return request({
      url: '/likes',
      method: 'post',
      data: {
        targetId: params.id,
        targetType: 0,
        userId: JSON.parse(localStorage.getItem('currentUser')).id
      }
    })
  },
  // 取消点赞
  unlike: (params) => {
    return request({
      url: '/likes/unlike',
      method: 'post',
      data: {
        targetId: params.id,
        targetType: 0,
        userId: JSON.parse(localStorage.getItem('currentUser')).id
      }
    })
  },
  // 获取点赞数量
  getLikeCount: (params) => {
    return request({
      url: '/likes/count',
      method: 'get',
      params: {
        targetId: params.id,
        targetType: 0
      }
    })
  },
  // 收藏题目
  collect: (params) => {
    return request({
      url: '/collect',
      method: 'post',
      data: {
        questionId: params.id,
        userId: JSON.parse(localStorage.getItem('currentUser')).id
      }
    })
  },
  // 取消收藏
  unCollect: (params) => {
    return request({
      url: '/collect/unCollect',
      method: 'post',
      data: {
        questionId: params.id,
        userId: JSON.parse(localStorage.getItem('currentUser')).id
      }
    })
  },
  // 判断是否点赞
  hasLike: (params) => {
    return request({
      url: '/likes/hasLike',
      method: 'get',
      params: {
        targetId: params.id,
        targetType: 0,
        userId: JSON.parse(localStorage.getItem('currentUser')).id
      }
    })
  },
  // 增加浏览量
  increaseView: (params) => {
    return request({
      url: '/question/view/increase',
      method: 'get',
      params: {
        questionId: params.questionId,
        userId: params.userId
      }
    })
  },
  // 获取浏览历史
  getViewHistory: (params) => {
    return request({
      url: '/question/view/history',
      method: 'get',
      params: {
        page: params.page || 1,
        pageSize: params.pageSize || 10,
        userId: params.userId
      }
    })
  },
  // 获取收藏数量
  getCollectCount: (params) => {
    return request({
      url: '/collect/get/count',
      method: 'get',
      params: {
        questionId: params.id
      }
    })
  },
  // 判断是否收藏
  hasCollect: (params) => {
    return request({
      url: '/collect/hasCollect',
      method: 'get',
      params: {
        questionId: params.id,
        userId: JSON.parse(localStorage.getItem('currentUser')).id
      }
    })
  },
  // 获取评论列表
  getComments: (params) => {
    return request({
      url: '/comment/list',
      method: 'get',
      params: {
        questionId: params.questionId,
        page: params.page || 1,
        pageSize: params.pageSize || 10
      }
    })
  },
  // 添加评论
  addComment: (data) => {
    return request({
      url: '/comment/add',
      method: 'post',
      data: {
        questionId: data.questionId,
        content: data.content,
        parentId: data.parentId,
        userId: JSON.parse(localStorage.getItem('currentUser')).id
      }
    })
  }
} 