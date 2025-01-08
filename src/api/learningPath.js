import request from './config'

export const learningPathApi = {
  // 获取学习路线列表
  getLearningPaths: () => {
    return request({
      url: '/learning-path/list',
      method: 'get'
    })
  }
} 