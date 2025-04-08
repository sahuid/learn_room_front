import request from './config'

export const mockInterviewApi = {
  // 创建模拟面试
  create(data) {
    return request({
      url: '/mock_interview/create',
      method: 'post',
      data: {
        workExperience: data.experience,
        jobPosition: data.position,
        difficulty: data.difficulty
      }
    })
  },

  // 分页查询模拟面试列表
  queryPage(params) {
    return request({
      url: '/mock_interview/query/page',
      method: 'get',
      params: {
        page: params.page || 1,
        pageSize: params.pageSize || 10
      }
    })
  },

  // 处理面试事件
  handleEvent(data) {
    return request({
      url: '/mock_interview/handle/event',
      method: 'post',
      data: {
        id: data.id,
        event: data.event,
        content: data.content
      }
    })
  },

  // 查询单个模拟面试
  queryOne(id) {
    return request({
      url: '/mock_interview/queryOne',
      method: 'get',
      params: { id }
    })
  }
} 