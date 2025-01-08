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
              {{ msg.content }}
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
import { ref, nextTick, onMounted } from 'vue'
import { message } from 'ant-design-vue'

const inputMessage = ref('')
const messages = ref([
  { role: 'ai', content: '你好！我是 AI 助手，有什么我可以帮你的吗？' }
])
const loading = ref(false)
const messagesRef = ref(null)

// 发送消息
const handleSend = async () => {
  if (!inputMessage.value.trim()) {
    return
  }

  // 添加用户消息
  messages.value.push({
    role: 'user',
    content: inputMessage.value
  })

  loading.value = true
  try {
    // TODO: 调用后端 AI 接口
    // const res = await aiApi.chat({
    //   message: inputMessage.value
    // })
    
    // 模拟 AI 回复
    await new Promise(resolve => setTimeout(resolve, 1000))
    messages.value.push({
      role: 'ai',
      content: '这是一个模拟的 AI 回复。'
    })

    inputMessage.value = ''
    
    // 滚动到底部
    await nextTick()
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    }
  } catch (error) {
    console.error('AI 回复失败:', error)
    message.error('AI 回复失败，请重试')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // 初始滚动到底部
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
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
</style> 