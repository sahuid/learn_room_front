<template>
  <div class="page-container">
    <div class="content-card">
      <h2 class="section-title">AI 助手</h2>
      <div class="chat-container">
        <!-- 聊天记录 -->
        <div class="chat-messages" ref="messagesRef">
          <div 
            v-for="(msg, index) in messages" 
            :key="index"
            :class="['message', msg.role === 'user' ? 'user-message' : 'ai-message']"
          >
            <div class="message-content">
              <span v-if="msg.role === 'user'">{{ msg.content }}</span>
              <div v-else v-html="msg.content" class="markdown-content"></div>
            </div>
          </div>
        </div>

        <!-- 输入框 -->
        <div class="chat-input">
          <a-textarea
            v-model:value="inputMessage"
            placeholder="请输入你的问题..."
            :auto-size="{ minRows: 2, maxRows: 5 }"
            @keypress.enter.prevent="handleSend"
          />
          <a-button 
            type="primary" 
            :loading="loading"
            @click="handleSend"
          >
            发送
          </a-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, onUnmounted } from 'vue'
import { message } from 'ant-design-vue'
import { marked } from 'marked'
import 'highlight.js/styles/github.css'
import hljs from 'highlight.js'

// WebSocket 实例
let ws = null

const inputMessage = ref('')
const messages = ref([
  { role: 'ai', content: '你好！我是 AI 助手，有什么我可以帮你的吗？' }
])
const loading = ref(false)
const messagesRef = ref(null)

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

// 初始化 WebSocket 连接
const initWebSocket = () => {
  // 创建 WebSocket 连接
  ws = new WebSocket('ws://localhost:8080/api/chat')

  // 连接建立时的回调
  ws.onopen = () => {
    console.log('WebSocket 连接已建立')
    message.success('已连接到 AI 助手')
  }

  // 接收消息的回调
  ws.onmessage = (event) => {
    console.log('收到消息:', event.data)
    
    // 如果收到"生成结束"的消息，不显示这个消息
    if (event.data === '生成结束') {
      loading.value = false
      return
    }
    
    // 处理接收到的消息
    const lastMessage = messages.value[messages.value.length - 1]
    if (lastMessage.role === 'ai') {
      // 如果最后一条消息是 AI 的回答，则追加到内容中并转换 Markdown
      lastMessage.content = marked(lastMessage.content + event.data)
    } else {
      // 否则创建一个新的消息
      messages.value.push({
        role: 'ai',
        content: marked(event.data)
      })
    }
    scrollToBottom()
  }

  // 连接关闭的回调
  ws.onclose = () => {
    console.log('WebSocket 连接已关闭')
    message.warning('与 AI 助手的连接已断开')
  }

  // 发生错误时的回调
  ws.onerror = (error) => {
    console.error('WebSocket 错误:', error)
    message.error('连接发生错误')
  }
}

// 发送消息
const handleSend = async () => {
  if (!inputMessage.value.trim()) {
    return
  }

  if (!ws || ws.readyState !== WebSocket.OPEN) {
    message.error('未连接到服务器')
    return
  }

  // 添加用户消息
  messages.value.push({
    role: 'user',
    content: inputMessage.value
  })

  loading.value = true
  try {
    // 发送消息到服务器
    ws.send(inputMessage.value)
    inputMessage.value = ''
    
    // 滚动到底部
    await nextTick()
    scrollToBottom()
  } catch (error) {
    console.error('发送消息失败:', error)
    message.error('发送消息失败')
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

onMounted(() => {
  // 初始化 WebSocket 连接
  initWebSocket()
  // 初始滚动到底部
  scrollToBottom()
})

// 组件卸载时关闭 WebSocket 连接
onUnmounted(() => {
  if (ws) {
    ws.close()
    ws = null
  }
})
</script>

<style scoped>
.page-container {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.content-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 24px;
  height: calc(100vh - 112px);
  display: flex;
  flex-direction: column;

}

.section-title {
  font-size: 20px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.85);
  margin-bottom: 24px;
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message {
  max-width: 80%;
  padding: 12px 16px;
  border-radius: 8px;
  word-break: break-word;
}

.user-message {
  align-self: flex-end;
  background: #1890ff;
  color: #fff;
}

.ai-message {
  align-self: flex-start;
  background: #fff;
  border: 1px solid #e8e8e8;
}

.chat-input {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.chat-input :deep(.ant-input) {
  flex: 1;
  border-radius: 4px;
}

.chat-input .ant-btn {
  height: 54px;
  padding: 0 24px;
}

/* Markdown 内容样式 */
.markdown-content {
  line-height: 1.6;
}

.markdown-content :deep(pre) {
  background-color: #f6f8fa;
  border-radius: 6px;
  padding: 16px;
  overflow: auto;
}

.markdown-content :deep(code) {
  font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
  font-size: 14px;
}

.markdown-content :deep(p) {
  margin: 8px 0;
}

.markdown-content :deep(ul), 
.markdown-content :deep(ol) {
  padding-left: 20px;
  margin: 8px 0;
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4),
.markdown-content :deep(h5),
.markdown-content :deep(h6) {
  margin: 16px 0 8px;
  font-weight: 600;
}

.markdown-content :deep(blockquote) {
  margin: 8px 0;
  padding: 0 16px;
  color: #666;
  border-left: 4px solid #ddd;
}

.markdown-content :deep(table) {
  border-collapse: collapse;
  margin: 8px 0;
  width: 100%;
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
  border: 1px solid #ddd;
  padding: 8px;
}

.markdown-content :deep(th) {
  background-color: #f6f8fa;
}

/* 调整 AI 消息样式以适应 Markdown 内容 */
.ai-message .message-content {
  padding: 16px;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
}
</style> 