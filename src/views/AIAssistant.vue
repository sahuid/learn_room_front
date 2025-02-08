<template>
  <div class="page-container">
    <div class="content-card">
      <h2 class="section-title">AI 助手</h2>
      <div class="chat-container">
        <!-- 聊天记录 -->
        <div 
          class="chat-messages" 
          ref="messagesRef"
          @scroll="handleScroll"
        >
          <!-- 加载提示 -->
          <div v-if="loadingHistory" class="loading-indicator">
            <a-spin size="small" />
            <span>加载中...</span>
          </div>
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
            :disabled="loading"
            :class="{ 'input-disabled': loading }"
          />
          <a-button 
            type="primary" 
            :loading="loading"
            @click="handleSend"
            :disabled="loading"
          >
            {{ loading ? '正在回复...' : '发送' }}
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
import { onBeforeRouteLeave } from 'vue-router'
import { chatApi } from '@/api/chat'

// WebSocket 实例
let ws = null

const inputMessage = ref('')
const messages = ref([])
const loading = ref(false)
const messagesRef = ref(null)
const pendingMarkdown = ref('')

// 添加一个状态来跟踪是否是主动关闭
const isActivelyClosing = ref(false)

// 添加新的状态
const loadingHistory = ref(false)
const hasMore = ref(true)
const currentCursor = ref(null)
const scrollPosition = ref(0)

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

// 获取历史记录
const fetchHistory = async (cursor = null) => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'))
  if (!currentUser) return
  
  loadingHistory.value = true
  try {
    const res = await chatApi.getHistory({
      userId: currentUser.id,
      cursor: cursor ? new Date(cursor).getTime() : null,
      size: 10
    })
    
    if (res.code === 200 && Array.isArray(res.value)) {
      const historyMessages = res.value.map(item => ({
        role: item.role === 1 ? 'user' : 'ai',
        content: item.role === 0 ? marked(item.content) : item.content,
        createTime: item.createTime
      }))
      
      // 对消息按创建时间排序（从早到晚）
      historyMessages.sort((a, b) => new Date(a.createTime) - new Date(b.createTime))
      
      // 如果是第一次加载，直接设置消息
      if (!cursor) {
        messages.value = historyMessages
        if (historyMessages.length === 0) {
          // 如果没有历史记录，显示欢迎消息
          messages.value = [{ 
            role: 'ai', 
            content: '你好！我是 AI 助手，有什么我可以帮你的吗？' 
          }]
        }
      } else {
        // 如果是加载更多，将新消息添加到开头，并保持时间顺序
        messages.value = [...historyMessages, ...messages.value].sort(
          (a, b) => new Date(a.createTime) - new Date(b.createTime)
        )
      }
      
      // 更新游标和是否有更多数据
      hasMore.value = historyMessages.length === 10
      if (historyMessages.length > 0) {
        // 使用最早的消息时间作为下一个游标
        currentCursor.value = historyMessages[0].createTime
      }
    }
  } catch (error) {
    console.error('获取历史记录失败:', error)
    message.error('获取历史记录失败')
  } finally {
    loadingHistory.value = false
  }
}

// 处理滚动事件
const handleScroll = async (e) => {
  if (loadingHistory.value || !hasMore.value) return
  
  const { scrollTop } = e.target
  // 当滚动到顶部时（考虑一个小的阈值）
  if (scrollTop < 50) {
    // 记录当前滚动位置
    scrollPosition.value = e.target.scrollHeight
    await loadMoreHistory()
  }
}

// 修改加载更多历史记录函数
const loadMoreHistory = async () => {
  if (loadingHistory.value || !hasMore.value) return
  
  try {
    await fetchHistory(currentCursor.value)
    
    // 在数据加载完成后，恢复滚动位置
    await nextTick()
    if (messagesRef.value && scrollPosition.value) {
      const newScrollTop = messagesRef.value.scrollHeight - scrollPosition.value
      messagesRef.value.scrollTop = newScrollTop
    }
  } catch (error) {
    console.error('加载更多历史记录失败:', error)
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
    
    // 检查消息是否包含"生成结束"字样
    if (event.data.includes('生成结束')) {
      const lastMessage = messages.value[messages.value.length - 1]
      if (lastMessage?.role === 'ai') {
        // 提取实际内容（去除"生成结束"字样）
        const actualContent = event.data.replace(/[,，]?\s*生成结束$/, '')
        
        // 如果这条消息本身包含内容（不仅仅是"生成结束"）
        if (actualContent && actualContent.trim() !== '') {
          // 将内容添加到现有消息中
          pendingMarkdown.value += actualContent
        }

        // 处理完整消息
        if (pendingMarkdown.value) {
          const result = processMarkdown(pendingMarkdown.value)
          lastMessage.content = result.complete
        }
      } else {
        // 如果最后一条不是 AI 消息，创建新消息
        const actualContent = event.data.replace(/[,，]?\s*生成结束$/, '')
        if (actualContent && actualContent.trim() !== '') {
          messages.value.push({
            role: 'ai',
            content: marked(actualContent)
          })
        }
      }
      
      // 重置状态
      pendingMarkdown.value = ''
      loading.value = false
      
      // 自动聚焦到输入框
      nextTick(() => {
        const textarea = document.querySelector('.chat-input .ant-input')
        if (textarea) {
          textarea.focus()
        }
      })
      return
    }

    // 处理普通消息
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
    // 只有在非主动关闭的情况下才显示提示
    if (!isActivelyClosing.value) {
      message.warning('与 AI 助手的连接已断开')
    }
  }

  // 发生错误时的回调
  ws.onerror = (error) => {
    console.error('WebSocket 错误:', error)
    message.error('连接发生错误')
  }
}

// 发送消息
const handleSend = async () => {
  // 检查消息是否为空或正在加载
  if (!inputMessage.value.trim() || loading.value) {
    return
  }

  // 检查 WebSocket 连接
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    message.error('未连接到服务器')
    return
  }

  // 保存消息内容并立即清空输入框
  const messageContent = inputMessage.value.trim()
  inputMessage.value = ''
  
  // 确保输入框立即更新
  await nextTick()

  // 设置加载状态
  loading.value = true

  try {
    // 添加用户消息
    messages.value.push({
      role: 'user',
      content: messageContent
    })

    // 发送消息到服务器
    ws.send(messageContent)
    
    // 滚动到底部
    await nextTick()
    scrollToBottom()
  } catch (error) {
    console.error('发送消息失败:', error)
    message.error('发送消息失败')
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
  // 初始化时先设置滚动位置到底部，然后再加载历史记录
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
  fetchHistory().then(() => {
    // 加载完成后再次确保滚动到底部
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    }
  })
})

// 组件卸载时清理
onUnmounted(() => {
  if (ws) {
    isActivelyClosing.value = true  // 标记为主动关闭
    ws.close()
    ws = null
  }
})

// 添加路由离开的处理
onBeforeRouteLeave((to, from, next) => {
  if (ws) {
    isActivelyClosing.value = true  // 标记为主动关闭
    ws.close()
    ws = null
  }
  next()
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

/* 禁用状态的输入框样式 */
.chat-input :deep(.input-disabled) {
  background-color: #f5f5f5;
  cursor: not-allowed;
  opacity: 0.8;
}

.chat-input :deep(.ant-input[disabled]) {
  background-color: #f5f5f5;
  cursor: not-allowed;
  color: rgba(0, 0, 0, 0.45);
}

/* 禁用状态的按钮样式 */
.chat-input :deep(.ant-btn[disabled]) {
  background-color: #f5f5f5;
  border-color: #d9d9d9;
  color: rgba(0, 0, 0, 0.45);
}

/* 加载提示样式 */
.loading-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  gap: 8px;
  color: #8c8c8c;
  font-size: 14px;
}

.loading-indicator :deep(.ant-spin) {
  margin-right: 8px;
}
</style> 