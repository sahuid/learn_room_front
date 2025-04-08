import request from './config'

export const commentApi = {
  // 发布评论
  publish(data) {
    return request({
      url: '/comment/publish',
      method: 'post',
      data: {
        content: data.content,
        userId: data.userId,
        targetId: data.targetId,
        parentId: data.parentId || null,
        rootId: data.rootId || null
      }
    })
  },
  
  // 查询根评论
  queryByPage(params) {
    return request({
      url: '/comment/queryByPage',
      method: 'get',
      params: {
        targetId: params.targetId,
        page: params.page || 1,
        pageSize: params.pageSize || 10
      }
    })
  },

  // 查询评论的回复
  queryReplyComment(commentId) {
    return request({
      url: '/comment/queryReplyComment',
      method: 'get',
      params: {
        commentId
      }
    })
  },

  // 删除评论
  delete(commentId) {
    return request({
      url: '/comment/delete',
      method: 'get',
      params: {
        commentId
      }
    })
  }
} 