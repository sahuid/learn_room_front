<template>
  <div v-if="loading" class="loading-container">
    <a-spin size="large" />
  </div>
  <div v-else-if="question.id" class="question-detail">
    <!-- 题目内容卡片 -->
    <a-card class="question-card">
      <div class="question-content">
        <h1 class="question-title">{{ question.title }}</h1>
        <div class="interaction-bar">
          <div class="stats">
            <a-space>
              <span class="stat-item">
                <EyeOutlined />
                <span>{{ question.viewCount || 0 }} 浏览</span>
              </span>
              <a-divider type="vertical" />
              <span 
                class="stat-item clickable"
                :class="{ active: question.isLiked }"
                @click="handleLike"
              >
                <LikeOutlined />
                <span>{{ question.likeNum || 0 }} 点赞</span>
              </span>
              <a-divider type="vertical" />
              <span 
                class="stat-item clickable"
                :class="{ active: question.isCollected }"
                @click="handleCollect"
              >
                <StarOutlined />
                <span>{{ question.collectNum || 0 }} 收藏</span>
              </span>
            </a-space>
          </div>
        </div>
        <div v-if="question.context" class="question-context">
          <p>{{ question.context }}</p>
        </div>
        <div class="question-tags">
          <a-tag 
            v-for="tag in (question.tags ? JSON.parse(question.tags) : [])"
            :key="tag"
            color="blue"
          >
            {{ tag }}
          </a-tag>
        </div>
      </div>
    </a-card>

    <!-- 答案卡片 -->
    <a-card class="answer-card">
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
          <a-button 
            type="primary" 
            size="large"
            :loading="viewLoading"
            @click="handleViewAnswer"
          >
            点击显示答案
          </a-button>
        </div>
      </div>
    </a-card>

    <!-- 评论区 -->
    <div class="content-card">
      <h2 class="section-title">评论区</h2>
      
      <!-- 评论输入框 -->
      <div class="comment-input">
        <a-textarea
          v-model:value="commentContent"
          placeholder="写下你的评论..."
          :auto-size="{ minRows: 2, maxRows: 5 }"
        />
        <div class="comment-actions">
          <a-button 
            type="primary"
            :loading="submitting"
            @click="handleSubmitComment"
          >
            发表评论
          </a-button>
        </div>
      </div>
      
      <!-- 评论列表 -->
      <div class="comment-list">
        <a-list
          :loading="commentsLoading"
          :data-source="comments"
          :pagination="commentPagination"
        >
          <template #renderItem="{ item }">
            <a-list-item>
              <a-comment>
                <template #avatar>
                  <a-avatar>
                    {{ item.userName?.charAt(0) }}
                  </a-avatar>
                </template>
                <template #author>
                  <a>{{ item.userName }}</a>
                </template>
                <template #content>
                  <p>{{ item.content }}</p>
                </template>
                <template #datetime>
                  <span>{{ formatDate(item.createTime) }}</span>
                </template>
                <template #actions>
                  <span @click="handleReply(item)">回复</span>
                </template>
              </a-comment>
              
              <!-- 回复列表 -->
              <div v-if="item.replies?.length" class="reply-list">
                <a-list
                  :data-source="item.replies"
                  size="small"
                >
                  <template #renderItem="{ item: reply }">
                    <a-list-item>
                      <a-comment>
                        <template #avatar>
                          <a-avatar>
                            {{ reply.userName?.charAt(0) }}
                          </a-avatar>
                        </template>
                        <template #author>
                          <a>{{ reply.userName }}</a>
                        </template>
                        <template #content>
                          <p>{{ reply.content }}</p>
                        </template>
                        <template #datetime>
                          <span>{{ formatDate(reply.createTime) }}</span>
                        </template>
                      </a-comment>
                    </a-list-item>
                  </template>
                </a-list>
              </div>
            </a-list-item>
          </template>
        </a-list>
      </div>
    </div>
    
    <!-- 回复对话框 -->
    <a-modal
      v-model:visible="replyModalVisible"
      title="回复评论"
      @ok="handleSubmitReply"
      :confirmLoading="submitting"
    >
      <a-textarea
        v-model:value="replyContent"
        placeholder="写下你的回复..."
        :auto-size="{ minRows: 2, maxRows: 5 }"
      />
    </a-modal>
  </div>
  <div v-else class="error-container">
    <a-empty description="暂无数据" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { questionApi } from '@/api/question'
import { userApi } from '@/api/user'
import { message, Spin, Empty } from 'ant-design-vue'
import { marked } from 'marked'
import 'highlight.js/styles/github.css'
import hljs from 'highlight.js'
import { 
  EyeOutlined, 
  LikeOutlined, 
  StarOutlined 
} from '@ant-design/icons-vue'
import { Comment } from 'ant-design-vue'

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
    const res = await questionApi.getComments({
      questionId: route.params.id,
      page: commentPagination.value.current,
      pageSize: commentPagination.value.pageSize
    })
    if (res.code === 200) {
      comments.value = res.value.records || []
      commentPagination.value.total = res.value.total || 0
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

// 打开回复对话框
const handleReply = (comment) => {
  currentReplyTo.value = comment
  replyModalVisible.value = true
}

// 提交回复
const handleSubmitReply = async () => {
  if (!replyContent.value.trim()) {
    message.warning('请输入回复内容')
    return
  }

  submitting.value = true
  try {
    const res = await questionApi.addComment({
      questionId: route.params.id,
      content: replyContent.value,
      parentId: currentReplyTo.value.id
    })
    if (res.code === 200) {
      message.success('回复成功')
      replyContent.value = ''
      replyModalVisible.value = false
      fetchComments()
    }
  } catch (error) {
    console.error('回复失败:', error)
    message.error('回复失败')
  } finally {
    submitting.value = false
  }
}

// 格式化日期
const formatDate = (date) => {
  return new Date(date).toLocaleString()
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

.reply-list {
  margin-left: 44px;
  margin-top: 16px;
  border-left: 2px solid #f0f0f0;
  padding-left: 16px;
}

:deep(.ant-comment-content-detail) {
  font-size: 14px;
}

:deep(.ant-comment-actions) {
  margin-top: 8px;
}

:deep(.ant-comment-actions) span {
  color: #1890ff;
  cursor: pointer;
}

:deep(.ant-comment-actions) span:hover {
  color: #40a9ff;
}
</style> 