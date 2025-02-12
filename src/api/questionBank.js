import request from './config'

export const questionBankApi = {
  // 分页查询题库列表
  queryPage(params) {
    return request({
      url: '/questionBank/queryPage',
      method: 'get',
      params: {
        page: params.page || 1,
        pageSize: params.pageSize || 10
      }
    })
  },
  // 查询题库详情及题目
  queryOne(params) {
    return request({
      url: '/questionBank/queryOne',
      method: 'get',
      params
    })
  },
  // 获取题库列表
  queryBankList: () => {
    return request({
      url: '/questionBank/queryBankList',
      method: 'get'
    })
  },
  // 添加题目到题库
  addQuestionToBank: (data) => {
    return request({
      url: '/questionAndBank/addQuestion',
      method: 'post',
      data: {
        questionBankId: data.bankId,
        questId: data.questionId
      }
    })
  },
  // 删除题库
  delete: (params) => {
    return request({
      url: '/questionBank/delete',
      method: 'delete',
      params
    })
  },
  // 添加题库
  add(data) {
    return request({
      url: '/questionBank/add',
      method: 'post',
      data: {
        title: data.title,
        description: data.description,
        picture: data.picture
      }
    })
  }
} 