<template>
  <div class="mock-interview-chat">
    <div class="content-card">
      <div class="header-section">
        <div class="header-info">
          <h2 class="section-title">模拟面试</h2>
          <div class="interview-status" v-if="isEnded">
            <a-tag color="red">已结束</a-tag>
          </div>
          <div class="interview-info">
            <span class="info-item">
              <UserOutlined />
              {{ interviewInfo.jobPosition || '职位未设置' }}
            </span>
            <a-divider type="vertical" />
            <span class="info-item">
              <ClockCircleOutlined />
              {{ interviewInfo.workExperience || '年限未设置' }}
            </span>
            <a-divider type="vertical" />
            <span class="info-item">
              <DashboardOutlined />
              {{ interviewInfo.difficulty || '难度未设置' }}
            </span>
          </div>
        </div>
        <div class="action-buttons">
          <a-button 
            type="primary" 
            :disabled="interviewStarted || isEnded"
            @click="handleStart"
            :loading="loading"
            class="start-btn"
            v-if="!isEnded"
          >
            <PlayCircleOutlined />
            开始面试
          </a-button>
          <a-button 
            danger
            :disabled="!interviewStarted"
            @click="handleEnd"
            class="end-btn"
            v-if="!isEnded"
          >
            <StopOutlined />
            结束面试
          </a-button>
        </div>
      </div>

      <!-- 聊天记录 -->
      <div class="chat-messages" ref="messagesRef">
        <div v-if="messages.length === 0" class="empty-message">
          <RobotOutlined class="empty-icon" />
          <p>点击"开始面试"按钮开始模拟面试</p>
          <p class="empty-tips">AI面试官将根据你的职位和经验进行针对性提问</p>
        </div>
        <div v-else class="messages-wrapper">
          <div 
            v-for="(msg, index) in messages" 
            :key="index"
            :class="['message', msg.role === 'user' ? 'user-message' : 'ai-message']"
          >
            <div class="message-avatar">
              <a-avatar :size="36">
                {{ msg.role === 'user' ? 'U' : 'AI' }}
              </a-avatar>
            </div>
            <div class="message-content">
              <div v-html="msg.role === 'ai' ? marked(msg.content) : msg.content"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 输入框 -->
      <div class="chat-input">
        <a-textarea
          v-model:value="inputMessage"
          placeholder="请输入你的回答..."
          :auto-size="{ minRows: 3, maxRows: 6 }"
          @keypress.enter.prevent="handleSend"
          :disabled="!interviewStarted || loading || isEnded"
          class="input-area"
          v-if="!isEnded"
          allow-clear
        />
        <a-button 
          type="primary" 
          :loading="loading"
          @click="handleSend"
          :disabled="!interviewStarted || loading || isEnded"
          class="send-btn"
          v-if="!isEnded"
        >
          <SendOutlined />
          发送
        </a-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { marked } from 'marked'
import { 
  UserOutlined, 
  ClockCircleOutlined, 
  DashboardOutlined,
  PlayCircleOutlined,
  StopOutlined,
  RobotOutlined,
  SendOutlined
} from '@ant-design/icons-vue'
import { mockInterviewApi } from '@/api/mockInterview'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const messages = ref([])
const inputMessage = ref('')
const interviewStarted = ref(false)
const messagesRef = ref(null)
const isEnded = ref(false)

// 面试信息
const interviewInfo = ref({
  jobPosition: '',
  workExperience: '',
  difficulty: ''
})

// 配置 marked
marked.setOptions({
  breaks: true, // 支持 GitHub 风格的换行符
  gfm: true,    // 启用 GitHub 风格的 Markdown
})

// 开始面试
const handleStart = async () => {
  try {
    loading.value = true
    const res = await mockInterviewApi.handleEvent({
      id: route.params.id,
      event: 'start',
      content: ''
    })
    
    if (res.code === 200) {
      messages.value.push({
        role: 'ai',
        content: res.value
      })
      interviewStarted.value = true
      message.success('面试开始')
      scrollToBottom()
    } else {
      message.error(res.msg || '开始面试失败')
    }
  } catch (error) {
    message.error('开始面试失败')
  } finally {
    loading.value = false
  }
}

// 结束面试
const handleEnd = async () => {
  try {
    const res = await mockInterviewApi.handleEvent({
      id: route.params.id,
      event: 'end',
      content: ''
    })
    
    if (res.code === 200) {
      messages.value.push({
        role: 'ai',
        content: res.value
      })
      scrollToBottom()
      interviewStarted.value = false
      isEnded.value = true
      message.success('面试结束')
    } else {
      message.error(res.msg || '结束面试失败')
    }
  } catch (error) {
    message.error('结束面试失败')
  }
}

// 发送消息
const handleSend = async () => {
  if (!inputMessage.value.trim() || loading.value) return
  
  const messageContent = inputMessage.value.trim()
  inputMessage.value = ''
  
  try {
    loading.value = true
    messages.value.push({
      role: 'user',
      content: messageContent
    })
    
    const res = await mockInterviewApi.handleEvent({
      id: route.params.id,
      event: 'chat',
      content: messageContent
    })
    
    if (res.code === 200) {
      messages.value.push({
        role: 'ai',
        content: res.value
      })
      scrollToBottom()
      
      if (res.value.includes('面试结束') || res.value.includes('结束面试')) {
        message.success('面试即将结束')
        interviewStarted.value = false
        isEnded.value = true
      }
    } else {
      message.error(res.msg || '发送失败')
    }
    
  } catch (error) {
    message.error('发送失败')
  } finally {
    loading.value = false
  }
}

// 滚动到底部
const scrollToBottom = () => {
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
}

onMounted(async () => {
  const interviewId = route.params.id
  if (!interviewId) {
    message.error('面试ID不存在')
    router.push('/home/mock-interview')
    return
  }
  
  try {
    // 获取面试详情
    const res = await mockInterviewApi.queryOne(interviewId)
    if (res.code === 200) {
      const info = res.value
      interviewInfo.value = {
        jobPosition: info.jobPosition,
        workExperience: info.workExperience,
        difficulty: info.difficulty
      }
      // 如果有历史消息，加载历史消息
      if (info.messages) {
        const messageList = JSON.parse(info.messages)
        // 过滤掉 system 消息，并转换消息格式
        messages.value = messageList
          .filter(msg => msg.role !== 'system')
          .map(msg => ({
            role: msg.role === 'assistant' ? 'ai' : msg.role,
            content: msg.message
          }))
      }
      // 如果面试已经开始或已结束，设置状态
      if (info.status === 1) {
        interviewStarted.value = true
      }
      // 如果面试已结束，禁用输入
      if (info.status === 2) {
        isEnded.value = true
        interviewStarted.value = false
      }
    }
  } catch (error) {
    message.error('获取面试信息失败')
  }
})
</script>

<style scoped>
.mock-interview-chat {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  height: calc(100vh - 88px);
}

.content-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  padding: 24px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.header-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-title {
  font-size: 24px;
  font-weight: 600;
  color: #1f1f1f;
  margin: 0;
}

.interview-info {
  display: flex;
  align-items: center;
  gap: 16px;
  color: #666;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.start-btn {
  font-weight: 500;
  height: 40px;
  padding: 0 24px;
  border-radius: 20px;
}

.end-btn {
  font-weight: 500;
  height: 40px;
  padding: 0 24px;
  border-radius: 20px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background: #f8fafc;
  border-radius: 12px;
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.empty-message {
  text-align: center;
  color: #666;
  padding: 60px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-top: auto;
}

.empty-icon {
  font-size: 48px;
  color: #1890ff;
  margin-bottom: 8px;
}

.empty-tips {
  font-size: 14px;
  color: #999;
}

.message {
  max-width: 85%;
  margin-bottom: 24px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.message-avatar {
  flex-shrink: 0;
}

.message-content {
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.user-message {
  margin-left: auto;
  flex-direction: row-reverse;
}

.user-message .message-content {
  background: #1890ff;
  color: #fff;
}

.ai-message .message-content {
  background: #fff;
}

.chat-input {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  background: #f8fafc;
  padding: 16px;
  border-radius: 12px;
}

.input-area {
  flex: 1;
}

.input-area :deep(.ant-input) {
  border-radius: 8px;
  resize: none;
  font-size: 15px;
  padding: 12px;
}

.send-btn {
  height: 88px;
  width: 88px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.send-btn :deep(.anticon) {
  font-size: 20px;
}

/* Markdown 样式 */
.ai-message .message-content :deep(p) {
  margin: 0 0 1em;
  line-height: 1.6;
}

.ai-message .message-content :deep(p:last-child) {
  margin-bottom: 0;
}

.ai-message .message-content :deep(code) {
  background: #f1f1f1;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
}

.ai-message .message-content :deep(pre) {
  background: #f6f8fa;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 1em 0;
}

.ai-message .message-content :deep(pre code) {
  background: none;
  padding: 0;
}

.ai-message .message-content :deep(ul), 
.ai-message .message-content :deep(ol) {
  padding-left: 20px;
  margin: 1em 0;
}

.ai-message .message-content :deep(li) {
  margin-bottom: 0.5em;
}

.ai-message .message-content :deep(blockquote) {
  border-left: 4px solid #ddd;
  padding-left: 16px;
  margin: 1em 0;
  color: #666;
}

.interview-status {
  margin-top: 4px;
}

.interview-status :deep(.ant-tag) {
  margin: 0;
  font-size: 14px;
  padding: 2px 8px;
}

/* 添加一个消息容器来包裹所有消息 */
.messages-wrapper {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  min-height: min-content;
}
</style> 