import request from './config'

export const chatApi = {
  // 获取聊天历史记录
  getHistory(params) {
    return request({
      url: '/chat/getHistory',
      method: 'get',
      params: {
        userId: params.userId,
        cursor: params.cursor,
        size: params.size || 10
      }
    })
  },
  // 清空聊天记录
  clearHistory(userId) {
    return request({
      url: '/chat/clearHistory',
      method: 'get',
      params: { userId }
    })
  }
} 