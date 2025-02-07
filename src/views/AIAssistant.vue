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
const pendingMarkdown = ref('')

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

// 处理 markdown 内容的函数
const processMarkdown = (text) => {
  try {
    const incompleteMarkdown = checkIncompleteMarkdown(text)
    if (incompleteMarkdown.isIncomplete) {
      return {
        complete: marked(incompleteMarkdown.completePart || ''),
        pending: incompleteMarkdown.pendingPart || ''
      }
    }
    return {
      complete: marked(text),
      pending: ''
    }
  } catch (e) {
    console.error('Markdown 处理错误:', e)
    return {
      complete: marked(text),
      pending: ''
    }
  }
}

// 检查未完成的 Markdown 标记
const checkIncompleteMarkdown = (text) => {
  const patterns = [
    { start: '```', end: '```' },
    { start: '`', end: '`' },
    { start: '**', end: '**' },
    { start: '*', end: '*' },
    { start: '__', end: '__' },
    { start: '_', end: '_' },
    { start: '[', end: ']' }
  ]

  let lastCompleteIndex = text.length
  let isIncomplete = false

  for (const pattern of patterns) {
    const segments = findIncompleteSegments(text, pattern.start, pattern.end)
    if (segments.isIncomplete) {
      isIncomplete = true
      lastCompleteIndex = Math.min(lastCompleteIndex, segments.lastCompleteIndex)
    }
  }

  if (isIncomplete) {
    return {
      isIncomplete: true,
      completePart: text.substring(0, lastCompleteIndex),
      pendingPart: text.substring(lastCompleteIndex)
    }
  }

  return {
    isIncomplete: false,
    completePart: text,
    pendingPart: ''
  }
}

// 查找未完成的段落
const findIncompleteSegments = (text, startMark, endMark) => {
  const indices = []
  let pos = 0
  let isStart = true

  while (pos < text.length) {
    const index = text.indexOf(isStart ? startMark : endMark, pos)
    if (index === -1) break
    
    indices.push({ index, isStart })
    pos = index + (isStart ? startMark : endMark).length
    isStart = !isStart
  }

  // 如果标记数量为奇数，说明有未闭合的标记
  if (indices.length % 2 !== 0) {
    // 返回最后一个完整标记的位置
    const lastCompleteIndex = indices.length > 1 
      ? indices[indices.length - 2].index 
      : 0
    return {
      isIncomplete: true,
      lastCompleteIndex
    }
  }

  return {
    isIncomplete: false,
    lastCompleteIndex: text.length
  }
}

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
    
    if (event.data === '生成结束') {
      const lastMessage = messages.value[messages.value.length - 1]
      if (lastMessage.role === 'ai' && pendingMarkdown.value) {
        const result = processMarkdown(pendingMarkdown.value)
        lastMessage.content = result.complete
      }
      pendingMarkdown.value = ''
      loading.value = false
      return
    }

    const lastMessage = messages.value[messages.value.length - 1]
    if (lastMessage?.role === 'ai') {
      // 更新现有消息
      pendingMarkdown.value += event.data
      const result = processMarkdown(pendingMarkdown.value)
      lastMessage.content = result.complete + 
        (result.pending ? marked(result.pending) : '')
    } else {
      // 创建新消息
      pendingMarkdown.value = event.data
      const result = processMarkdown(event.data)
      messages.value.push({
        role: 'ai',
        content: result.complete + 
          (result.pending ? marked(result.pending) : '')
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

// 组件卸载时清理
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
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.content-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 24px;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.section-title {
  font-size: 20px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.85);
  margin-bottom: 24px;
  flex-shrink: 0;
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-height: 0;
  overflow: hidden;
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
  min-height: 200px;
  max-height: calc(100vh - 250px);
}

.message {
  max-width: 85%;
  padding: 12px 16px;
  border-radius: 8px;
  word-break: break-word;
}

.user-message {
  align-self: flex-end;
  background: #1890ff;
  color: #fff;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.15);
}

.ai-message {
  align-self: flex-start;
  background: #fff;
  border: 1px solid #e8e8e8;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.chat-input {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
}

.chat-input :deep(.ant-input) {
  flex: 1;
  border-radius: 4px;
  resize: none;
}

.chat-input .ant-btn {
  height: 54px;
  padding: 0 24px;
  min-width: 100px;
}

/* Markdown 内容样式优化 */
.markdown-content {
  line-height: 1.6;
  font-size: 15px;
  color: rgba(0, 0, 0, 0.85);
}

.markdown-content :deep(pre) {
  background-color: #f6f8fa;
  border-radius: 6px;
  padding: 16px;
  overflow: auto;
  margin: 12px 0;
  border: 1px solid #e8e8e8;
}

.markdown-content :deep(code) {
  font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
  font-size: 14px;
  background-color: rgba(0, 0, 0, 0.04);
  padding: 2px 6px;
  border-radius: 3px;
}

.markdown-content :deep(pre code) {
  background-color: transparent;
  padding: 0;
}

/* AI 消息样式优化 */
.ai-message .message-content {
  padding: 16px;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  overflow-x: auto;
  max-width: 100%;
}

/* 滚动条样式优化 */
.chat-messages::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-track {
  background: transparent;
}

/* 代码块滚动条样式 */
.markdown-content :deep(pre)::-webkit-scrollbar {
  height: 6px;
}

.markdown-content :deep(pre)::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.markdown-content :deep(pre)::-webkit-scrollbar-track {
  background: transparent;
}

.message-content {
  transition: all 0.3s ease;
}

/* 保持必要的样式 */
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

.pending-content {
  color: #666;
  margin-top: 4px;
  font-style: italic;
}

/* 添加未完成文本的样式 */
:deep(.pending-text) {
  color: #666;
  margin-top: 4px;
  font-family: inherit;
  white-space: pre-wrap;
}

/* 添加原始文本的样式 */
:deep(.raw-content) {
  font-family: inherit;
  white-space: pre-wrap;
  line-height: 1.6;
  transition: opacity 0.2s ease;
}

/* 优化过渡效果 */
.message-content {
  position: relative;
  transition: all 0.3s ease;
}

:deep(.pending-text) {
  color: #666;
  margin-top: 4px;
  font-family: inherit;
  white-space: pre-wrap;
  opacity: 0.8;
  transition: opacity 0.2s ease;
}

/* 添加平滑过渡效果 */
.message {
  transition: all 0.3s ease-in-out;
}

.ai-message .message-content {
  transition: all 0.3s ease-in-out;
}
</style> 