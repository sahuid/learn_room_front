<template>
  <div v-if="loading" class="loading-container">
    <ASpin size="large" />
  </div>
  <div v-else-if="question.id" class="question-detail">
    <!-- 题目内容卡片 -->
    <ACard class="question-card">
      <div class="question-content">
        <h1 class="question-title">{{ question.title }}</h1>
        <div class="interaction-bar">
          <div class="stats">
            <ASpace>
              <span class="stat-item">
                <EyeOutlined />
                <span>{{ question.viewCount || 0 }} 浏览</span>
              </span>
              <ADivider type="vertical" />
              <span 
                class="stat-item clickable"
                :class="{ active: question.isLiked }"
                @click="handleLike"
              >
                <LikeOutlined />
                <span>{{ question.likeNum || 0 }} 点赞</span>
              </span>
              <ADivider type="vertical" />
              <span 
                class="stat-item clickable"
                :class="{ active: question.isCollected }"
                @click="handleCollect"
              >
                <StarOutlined />
                <span>{{ question.collectNum || 0 }} 收藏</span>
              </span>
            </ASpace>
          </div>
        </div>
        <div v-if="question.context" class="question-context">
          <p>{{ question.context }}</p>
        </div>
        <div class="question-tags">
          <ATag 
            v-for="tag in (question.tags ? JSON.parse(question.tags) : [])"
            :key="tag"
            color="blue"
          >
            {{ tag }}
          </ATag>
        </div>
      </div>
    </ACard>

    <!-- 答案卡片 -->
    <ACard class="answer-card">
      <template #title>
        <div class="answer-header">
          <h2>推荐答案</h2>
        </div>
      </template>
      <div class="answer-content">
        <div v-if="showAnswer" class="answer-text">
          <div v-html="parsedAnswer"></div>
        </div>
        <div v-else class="answer-placeholder">
          <AButton 
            type="primary" 
            size="large"
            :loading="viewLoading"
            @click="handleViewAnswer"
          >
            点击显示答案
          </AButton>
        </div>
      </div>
    </ACard>

    <!-- 评论区 -->
    <ACard class="comment-section">
      <template #title>评论区</template>
      
      <!-- 评论输入框 -->
      <div class="comment-input">
        <ATextarea
          v-model:value="commentContent"
          placeholder="写下你的评论..."
          :rows="4"
          :maxLength="500"
        />
        <div class="comment-actions">
          <span class="comment-count">{{ commentContent.length }}/500</span>
          <AButton 
            type="primary" 
            @click="handlePublishComment"
            :loading="publishing"
          >
            发布评论
          </AButton>
        </div>
      </div>
      
      <!-- 评论列表 -->
      <div class="comment-list">
        <AList
          :loading="commentsLoading"
          :data-source="comments"
          :pagination="commentPagination"
        >
          <template #renderItem="{ item }">
            <AListItem>
              <AComment class="comment-item">
                <template #avatar>
                  <AAvatar>
                    {{ item.userName?.charAt(0) || 'U' }}
                  </AAvatar>
                </template>
                <template #author>
                  <span class="comment-author">{{ item.userName }}</span>
                </template>
                <template #content>
                  <div class="comment-content">{{ item.content }}</div>
                </template>
                <template #datetime>
                  <span class="comment-time">{{ formatDateTime(item.createTime) }}</span>
                </template>
                <template #actions>
                  <span class="comment-action" @click="handleReply(item)">回复</span>
                </template>
              </AComment>

              <!-- 子评论列表 -->
              <div v-if="item.subComment?.length" class="sub-comments">
                <a-list
                  :data-source="item.subComment"
                  size="small"
                >
                  <template #renderItem="{ item: reply }">
                    <AListItem>
                      <a-comment class="reply-item">
                        <template #avatar>
                          <a-avatar size="small">
                            {{ reply.userName?.charAt(0) || 'U' }}
                          </a-avatar>
                        </template>
                        <template #author>
                          <span class="reply-author">{{ reply.userName }}</span>
                        </template>
                        <template #content>
                          <div class="reply-content">{{ reply.content }}</div>
                        </template>
                        <template #datetime>
                          <span class="reply-time">{{ formatDateTime(reply.createTime) }}</span>
                        </template>
                      </a-comment>
                    </AListItem>
                  </template>
                </a-list>
              </div>
            </AListItem>
          </template>
        </AList>
      </div>
    </ACard>
    
    <!-- 回复对话框 -->
    <AModal
      v-model:visible="replyModalVisible"
      title="回复评论"
      @ok="handleSubmitReply"
      @cancel="handleModalClose"
      :confirmLoading="submitting"
    >
      <div class="reply-modal-content">
        <div class="reply-to-info">
          回复 {{ currentReplyTo?.userName }} 的评论：
          <div class="original-comment">{{ currentReplyTo?.content }}</div>
        </div>
        <ATextarea
          v-model:value="replyContent"
          placeholder="写下你的回复..."
          :rows="4"
          :maxLength="500"
        />
        <div class="reply-count">{{ replyContent.length }}/500</div>
      </div>
    </AModal>
  </div>
  <div v-else class="error-container">
    <AEmpty description="暂无数据" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { questionApi } from '@/api/question'
import { userApi } from '@/api/user'
import { 
  message,
  Spin,
  Empty,
  Comment,
  List,
  Avatar,
  Card,
  Space,
  Divider,
  Tag,
  Button,
  Input,
  Modal
} from 'ant-design-vue'
import 'ant-design-vue/es/message/style'
import 'ant-design-vue/es/spin/style'
import 'ant-design-vue/es/empty/style'
import 'ant-design-vue/es/comment/style'
import 'ant-design-vue/es/list/style'
import 'ant-design-vue/es/avatar/style'
import 'ant-design-vue/es/card/style'
import 'ant-design-vue/es/space/style'
import 'ant-design-vue/es/divider/style'
import 'ant-design-vue/es/tag/style'
import 'ant-design-vue/es/button/style'
import 'ant-design-vue/es/input/style'
import 'ant-design-vue/es/modal/style'
import { marked } from 'marked'
import 'highlight.js/styles/github.css'
import hljs from 'highlight.js'
import { 
  EyeOutlined, 
  LikeOutlined, 
  StarOutlined 
} from '@ant-design/icons-vue'
import { commentApi } from '@/api/comment'
import dayjs from 'dayjs'

// 重命名组件
const ASpin = Spin
const AEmpty = Empty
const AComment = Comment
const AList = List
const AListItem = List.Item
const AAvatar = Avatar
const ACard = Card
const ASpace = Space
const ADivider = Divider
const ATag = Tag
const AButton = Button
const ATextarea = Input.TextArea
const AModal = Modal

// 配置 marked
marked.setOptions({
  highlight: function (code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value
    }
    return hljs.highlightAuto(code).value
  },
  breaks: true,
  gfm: true
})

const route = useRoute()
const router = useRouter()
const question = ref({})
const loading = ref(false)

// 添加状态
const showAnswer = ref(false)
const viewLoading = ref(false)

// 评论相关的状态
const commentContent = ref('')
const replyContent = ref('')
const comments = ref([])
const commentsLoading = ref(false)
const submitting = ref(false)
const replyModalVisible = ref(false)
const currentReplyTo = ref(null)
const publishing = ref(false)

// 评论分页配置
const commentPagination = ref({
  current: 1,
  pageSize: 10,
  total: 0,
  onChange: (page, pageSize) => {
    commentPagination.value.current = page
    commentPagination.value.pageSize = pageSize
    fetchComments()
  }
})

// 解析 Markdown
const parsedAnswer = computed(() => {
  if (!question.value.answer) return ''
  return marked(question.value.answer)
})

// 发送签到请求
const sendSignRequest = async () => {
  try {
    const res = await userApi.sign()
    if (res.code === 200) {
      //message.success('签到成功')
    } else {
      console.warn('签到失败:', res.msg)
    }
  } catch (error) {
    console.error('签到请求失败:', error)
  }
}

// 获取题目详情
const fetchQuestionDetail = async () => {
  loading.value = true
  try {
    const res = await questionApi.queryOne({
      id: route.params.id.toString()
    })
    if (res.code === 200) {
      question.value = res.value || {}
      
      // 如果用户已登录，获取点赞和收藏状态
      const currentUser = localStorage.getItem('currentUser')
      if (currentUser) {
        const hasLikeRes = await questionApi.hasLike({
          id: question.value.id
        })
        if (hasLikeRes.code === 200) {
          question.value.isLiked = hasLikeRes.value
        }
        
        // 获取收藏状态
        const hasCollectRes = await questionApi.hasCollect({
          id: question.value.id
        })
        if (hasCollectRes.code === 200) {
          question.value.isCollected = hasCollectRes.value
        }
      }
      
      // 获取点赞数量
      const likeRes = await questionApi.getLikeCount({
        id: question.value.id
      })
      if (likeRes.code === 200) {
        question.value.likeNum = likeRes.value || 0
      }
      
      // 获取收藏数量
      const collectRes = await questionApi.getCollectCount({
        id: question.value.id
      })
      if (collectRes.code === 200) {
        question.value.collectNum = collectRes.value || 0
      }
    } else {
      message.error(res.msg || '获取题目详情失败')
    }
  } catch (error) {
    console.error('获取题目详情失败:', error)
    message.error('获取题目详情失败')
  } finally {
    loading.value = false
  }
}

// 处理点赞
const handleLike = async () => {
  try {
    // 检查是否登录
    const currentUser = localStorage.getItem('currentUser')
    if (!currentUser) {
      message.warning('请先登录')
      router.push('/login')
      return
    }

    // 根据当前状态决定是点赞还是取消点赞
    const res = await (question.value.isLiked 
      ? questionApi.unlike({ id: question.value.id })
      : questionApi.like({ id: question.value.id }))

    if (res.code === 200) {
      question.value.isLiked = !question.value.isLiked
      // 重新获取点赞数量
      const likeRes = await questionApi.getLikeCount({
        id: question.value.id
      })
      if (likeRes.code === 200) {
        question.value.likeNum = likeRes.value || 0
      }
      message.success(question.value.isLiked ? '点赞成功' : '已取消点赞')
    } else {
      message.error(res.msg || '操作失败')
    }
  } catch (error) {
    console.error('点赞失败:', error)
    message.error('操作失败')
  }
}

// 处理收藏
const handleCollect = async () => {
  try {
    // 检查是否登录
    const currentUser = localStorage.getItem('currentUser')
    if (!currentUser) {
      message.warning('请先登录')
      router.push('/login')
      return
    }

    // 根据当前状态决定是收藏还是取消收藏
    const res = await (question.value.isCollected
      ? questionApi.unCollect({
          id: question.value.id
        })
      : questionApi.collect({
        id: question.value.id
      }))

    if (res.code === 200) {
      question.value.isCollected = !question.value.isCollected
      // 重新获取收藏数量
      const collectRes = await questionApi.getCollectCount({
        id: question.value.id
      })
      if (collectRes.code === 200) {
        question.value.collectNum = collectRes.value || 0
      }
      message.success(question.value.isCollected ? '收藏成功' : '已取消收藏')
    } else {
      message.error(res.msg || '操作失败')
    }
  } catch (error) {
    console.error('收藏失败:', error)
    message.error('操作失败')
  }
}

// 处理查看答案
const handleViewAnswer = async () => {
  try {
    // 检查是否登录
    const currentUser = localStorage.getItem('currentUser')
    if (!currentUser) {
      message.warning('请先登录')
      router.push('/login')
      return
    }
    
    viewLoading.value = true
    const res = await questionApi.increaseView({
      questionId: question.value.id,
      userId: JSON.parse(currentUser).id
    })
    
    if (res.code === 200) {
      showAnswer.value = true
      // 更新浏览量显示
      question.value.viewCount = (question.value.viewCount || 0) + 1
    } else {
      message.error(res.msg || '操作失败')
    }
  } catch (error) {
    console.error('查看答案失败:', error)
    message.error('操作失败')
  } finally {
    viewLoading.value = false
  }
}

// 获取评论列表
const fetchComments = async () => {
  commentsLoading.value = true
  try {
    const res = await commentApi.queryByPage({
      targetId: route.params.id,
      page: commentPagination.value.current,
      pageSize: commentPagination.value.pageSize
    })
    
    console.log('评论数据:', res)
    
    if (res.code === 200) {
      comments.value = res.value.data || []
      commentPagination.value.total = res.value.total || 0
      console.log('处理后的评论数据:', comments.value)
    } else {
      message.error(res.msg || '获取评论失败')
    }
  } catch (error) {
    console.error('获取评论失败:', error)
    message.error('获取评论失败')
  } finally {
    commentsLoading.value = false
  }
}

// 提交评论
const handleSubmitComment = async () => {
  if (!commentContent.value.trim()) {
    message.warning('请输入评论内容')
    return
  }

  submitting.value = true
  try {
    const res = await questionApi.addComment({
      questionId: route.params.id,
      content: commentContent.value,
      parentId: 0
    })
    if (res.code === 200) {
      message.success('评论成功')
      commentContent.value = ''
      fetchComments()
    }
  } catch (error) {
    console.error('评论失败:', error)
    message.error('评论失败')
  } finally {
    submitting.value = false
  }
}

// 处理点击回复按钮
const handleReply = (comment) => {
  currentReplyTo.value = comment
  replyModalVisible.value = true
}

// 处理提交回复
const handleSubmitReply = async () => {
  if (!replyContent.value.trim()) {
    message.warning('请输入回复内容')
    return
  }

  const currentUser = localStorage.getItem('currentUser')
  if (!currentUser) {
    message.warning('请先登录')
    return
  }

  const userId = JSON.parse(currentUser).id
  
  try {
    submitting.value = true
    const res = await commentApi.publish({
      content: replyContent.value.trim(),
      userId: userId,
      targetId: route.params.id,
      parentId: currentReplyTo.value.id,  // 父评论 ID
      rootId: currentReplyTo.value.rootId || currentReplyTo.value.id  // 如果没有 rootId，说明回复的就是根评论
    })

    if (res.code === 200) {
      message.success('回复成功')
      replyContent.value = ''  // 清空回复内容
      replyModalVisible.value = false  // 关闭对话框
      fetchComments()  // 刷新评论列表
    } else {
      message.error(res.msg || '回复失败')
    }
  } catch (error) {
    console.error('回复失败:', error)
    message.error('回复失败，请重试')
  } finally {
    submitting.value = false
  }
}

// 处理对话框关闭
const handleModalClose = () => {
  replyContent.value = ''  // 清空回复内容
  currentReplyTo.value = null  // 清空当前回复对象
}

// 格式化日期时间
const formatDateTime = (date) => {
  if (!date) return ''
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

// 发布评论
const handlePublishComment = async () => {
  if (!commentContent.value.trim()) {
    message.warning('请输入评论内容')
    return
  }

  const currentUser = localStorage.getItem('currentUser')
  if (!currentUser) {
    message.warning('请先登录')
    return
  }

  const userId = JSON.parse(currentUser).id
  
  try {
    publishing.value = true
    const res = await commentApi.publish({
      content: commentContent.value.trim(),
      userId: userId,
      targetId: route.params.id,
      parentId: null,
      rootId: null
    })

    if (res.code === 200) {
      message.success('评论发布成功')
      commentContent.value = ''
      fetchComments()
    } else {
      message.error(res.msg || '评论发布失败')
    }
  } catch (error) {
    console.error('发布评论失败:', error)
    message.error('评论发布失败，请重试')
  } finally {
    publishing.value = false
  }
}

onMounted(async () => {
  await fetchQuestionDetail()
  // 发送签到请求
  await sendSignRequest()
  // 初始化时获取评论列表
  fetchComments()
})
</script>

<style scoped>
.loading-container,
.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.question-detail {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.question-card,
.answer-card {
  background: #fff;
  margin-bottom: 24px;
}

.question-content {
  padding: 32px;
}

.question-title {
  margin: 0 0 16px;
  font-size: 24px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.85);
  text-align: left;
}

.question-context {
  margin-bottom: 24px;
  color: rgba(0, 0, 0, 0.65);
  font-size: 16px;
  line-height: 1.8;
  text-align: left;
}

.question-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-start;
}

.answer-header h2 {
  margin: 0;
  font-size: 18px;
  color: rgba(0, 0, 0, 0.85);
  text-align: left;
}

.answer-content {
  padding: 24px 32px;
}

.answer-text {
  color: rgba(0, 0, 0, 0.65);
  font-size: 16px;
  line-height: 1.8;
  text-align: left;
}

.answer-text :deep(h1),
.answer-text :deep(h2),
.answer-text :deep(h3),
.answer-text :deep(h4),
.answer-text :deep(h5),
.answer-text :deep(h6) {
  margin: 16px 0;
  font-weight: 600;
  line-height: 1.25;
}

.answer-text :deep(p) {
  margin: 16px 0;
}

.answer-text :deep(ul),
.answer-text :deep(ol) {
  padding-left: 24px;
  margin: 16px 0;
}

.answer-text :deep(code) {
  padding: 0.2em 0.4em;
  margin: 0;
  font-size: 85%;
  background-color: rgba(27, 31, 35, 0.05);
  border-radius: 3px;
}

.answer-text :deep(pre) {
  padding: 16px;
  overflow: auto;
  font-size: 85%;
  line-height: 1.45;
  background-color: #f6f8fa;
  border-radius: 3px;
}

.answer-text :deep(pre code) {
  padding: 0;
  margin: 0;
  background-color: transparent;
}

.answer-text :deep(blockquote) {
  margin: 16px 0;
  padding: 0 1em;
  color: #6a737d;
  border-left: 0.25em solid #dfe2e5;
}

.answer-text :deep(table) {
  border-spacing: 0;
  border-collapse: collapse;
  margin: 16px 0;
  width: 100%;
}

.answer-text :deep(table th),
.answer-text :deep(table td) {
  padding: 6px 13px;
  border: 1px solid #dfe2e5;
}

.answer-text :deep(table tr:nth-child(2n)) {
  background-color: #f6f8fa;
}

/* 互动功能区域样式 */
.interaction-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 16px 0;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.stats {
  display: flex;
  align-items: center;
  color: #8c8c8c;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
}

.clickable {
  cursor: pointer;
  transition: color 0.3s;
}

.clickable:hover {
  color: #1890ff;
}

.active {
  color: #1890ff;
}

:deep(.anticon) {
  font-size: 16px;
}

:deep(.ant-divider) {
  margin: 0 16px;
}

.answer-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  background-color: #fafafa;
  border-radius: 4px;
}

.comment-input {
  margin-bottom: 24px;
}

.comment-actions {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.comment-list {
  margin-top: 24px;
}

.comment-item {
  width: 100%;
}

.comment-author {
  font-weight: 500;
  color: rgba(0, 0, 0, 0.85);
}

.comment-content {
  margin: 8px 0;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.85);
  line-height: 1.5;
}

.comment-time {
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
}

.comment-action {
  color: #1890ff;
  cursor: pointer;
  font-size: 14px;
  margin-right: 16px;
}

.comment-action:hover {
  color: #40a9ff;
}

.sub-comments {
  margin-left: 44px;
  margin-top: 16px;
  padding-left: 16px;
  border-left: 1px solid #f0f0f0;
}

.reply-item {
  width: 100%;
}

.reply-author {
  font-size: 13px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.85);
}

.reply-content {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.65);
}

.reply-time {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
}

:deep(.ant-list-item) {
  padding: 16px 24px;
}

:deep(.ant-comment) {
  width: 100%;
}

:deep(.ant-comment-inner) {
  padding: 12px 0;
}

:deep(.ant-comment-content) {
  width: 100%;
}

:deep(.ant-comment-actions) {
  margin-top: 8px;
}

:deep(.ant-avatar) {
  background-color: #1890ff;
  color: #fff;
}

:deep(.ant-list-split .ant-list-item) {
  border-bottom: 1px solid #f0f0f0;
}

:deep(.ant-list-split .ant-list-item:last-child) {
  border-bottom: none;
}

:deep(.ant-list-pagination) {
  margin-top: 24px;
  text-align: center;
}

.comment-section {
  margin-top: 24px;
}

.comment-input {
  margin: 24px 0;
}

.comment-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.comment-count {
  color: rgba(0, 0, 0, 0.45);
}

/* 回复对话框样式 */
.reply-modal-content {
  padding: 8px 0;
}

.reply-to-info {
  margin-bottom: 16px;
  color: rgba(0, 0, 0, 0.65);
}

.original-comment {
  margin-top: 8px;
  padding: 8px 12px;
  background-color: #f5f5f5;
  border-radius: 4px;
  font-size: 14px;
}

.reply-count {
  margin-top: 8px;
  text-align: right;
  color: rgba(0, 0, 0, 0.45);
}
</style> 