<template>
  <div class="page-container">
    <div class="content-card">
      <h2 class="section-title">添加题目</h2>
      <a-form
        :model="formState"
        :rules="rules"
        @finish="handleSubmit"
        layout="vertical"
      >
        <!-- 标题 -->
        <a-form-item label="题目标题" name="title">
          <a-input 
            v-model:value="formState.title" 
            placeholder="请输入题目标题"
            :maxLength="100"
            show-count
          />
        </a-form-item>

        <!-- 标签 -->
        <a-form-item label="题目标签" name="tags">
          <div class="tag-input-container">
            <div class="tag-list">
              <a-tag
                v-for="(tag, index) in formState.tags"
                :key="index"
                closable
                color="blue"
                @close="removeTag(index)"
              >
                {{ tag }}
              </a-tag>
            </div>
            <a-input
              v-model:value="tagInputValue"
              placeholder="输入标签后按回车添加"
              @pressEnter="handleTagInputConfirm"
              :maxLength="20"
              :disabled="formState.tags.length >= 5"
            />
          </div>
          <div class="tag-hint">
            最多添加5个标签，按回车确认添加
          </div>
        </a-form-item>

        <!-- 题目描述 -->
        <a-form-item label="题目描述" name="context">
          <a-textarea
            v-model:value="formState.context"
            placeholder="请输入题目描述"
            :auto-size="{ minRows: 3, maxRows: 6 }"
            :maxLength="1000"
            show-count
          />
        </a-form-item>

        <!-- 答案内容 -->
        <a-form-item label="答案内容" name="answer">
          <QuillEditor
            v-model:content="formState.answer"
            contentType="html"
            theme="snow"
            :options="editorOptions"
            :style="{ height: '500px' }"
            @ready="onEditorReady"
          />
        </a-form-item>

        <!-- 提交按钮 -->
        <a-form-item>
          <a-space>
            <a-button type="primary" html-type="submit" :loading="submitting">
              提交
            </a-button>
            <a-button @click="handleReset">
              重置
            </a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { questionApi } from '@/api/question'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'

const router = useRouter()
const submitting = ref(false)
const tagInputValue = ref('')

// 表单状态
const formState = reactive({
  title: '',
  tags: [],
  context: '',
  answer: '',
})

// 表单校验规则
const rules = {
  title: [
    { required: true, message: '请输入题目标题', trigger: 'blur' },
    { min: 5, message: '标题至少 5 个字符', trigger: 'blur' }
  ],
  tags: [
    { required: true, message: '请至少选择一个标签', trigger: 'change' },
    { type: 'array', max: 5, message: '最多选择 5 个标签', trigger: 'change' }
  ],
  context: [
    { required: true, message: '请输入题目描述', trigger: 'blur' }
  ],
  answer: [
    { required: true, message: '请输入答案内容', trigger: 'change' }
  ]
}

// 编辑器配置
const editorOptions = {
  modules: {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ 'header': 1 }, { 'header': 2 }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'font': [] }],
      [{ 'align': [] }],
      ['clean'],
      ['link', 'image', 'video']
    ]
  },
  placeholder: '请输入答案内容...'
}

// 编辑器就绪回调
const onEditorReady = (quill) => {
  console.log('编辑器已就绪', quill)
}

// 提交表单
const handleSubmit = async (values) => {
  submitting.value = true
  try {
    const res = await questionApi.add({
      ...values,
      tags: JSON.stringify(values.tags)
    })
    if (res.code === 200) {
      message.success('添加成功')
      router.push('/home/question-bank')
    } else {
      message.error(res.msg || '添加失败')
    }
  } catch (error) {
    console.error('添加题目失败:', error)
    message.error('添加失败')
  } finally {
    submitting.value = false
  }
}

// 重置表单
const handleReset = () => {
  Object.assign(formState, {
    title: '',
    tags: [],
    context: '',
    answer: ''
  })
}

// 处理标签输入
const handleTagInputConfirm = () => {
  const value = tagInputValue.value.trim()
  if (value && formState.tags.length < 5) {
    if (!formState.tags.includes(value)) {
      formState.tags.push(value)
    }
    tagInputValue.value = ''
  }
}

// 移除标签
const removeTag = (index) => {
  formState.tags.splice(index, 1)
}
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
}

.section-title {
  font-size: 20px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.85);
  margin-bottom: 24px;
}

.tag-input-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 32px;
}

.tag-hint {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  margin-top: 4px;
}

:deep(.ant-form-item-label) {
  font-weight: 500;
}

:deep(.ant-select-selection-item-content) {
  color: #1890ff;
}

:deep(.ant-rate) {
  font-size: 20px;
}

/* Quill 编辑器样式 */
:deep(.ql-container) {
  border-radius: 4px;
  border: 1px solid #d9d9d9;
}

:deep(.ql-toolbar) {
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
  background-color: #fafafa;
}

:deep(.ql-editor) {
  padding: 16px;
  min-height: 300px;
}
</style> 