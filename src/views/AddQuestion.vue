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

        <!-- Markdown 编辑器 -->
        <a-form-item label="题目答案" name="answer">
          <div class="markdown-editor-container">
            <v-md-editor
              v-model="formState.answer"
              height="400px"
              :disabled-menus="[]"
              @upload-image="handleUploadImage"
              :toolbar="toolbars"
              :preview-theme="previewTheme"
              :code-theme="codeTheme"
            />
          </div>
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
import { fileApi } from '@/api/file'

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
const toolbars = [
  'bold', // 粗体
  'italic', // 斜体
  'strikethrough', // 删除线
  '|',
  'header1', // 一级标题
  'header2', // 二级标题
  'header3', // 三级标题
  '|',
  'quote', // 引用
  'code', // 代码
  'inline-code', // 行内代码
  '|',
  'ordered-list', // 有序列表
  'unordered-list', // 无序列表
  '|',
  'link', // 链接
  'image', // 图片
  'table', // 表格
  '|',
  'preview', // 预览
  'fullscreen', // 全屏
  'github-theme' // GitHub 主题
]

const previewTheme = 'github'
const codeTheme = 'github'

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

// 处理图片上传
const handleUploadImage = async (event, insertImage) => {
  const file = event.target.files[0]
  if (!file) return
  
  try {
    const formData = new FormData()
    formData.append('file', file)
    
    const res = await fileApi.upload(formData)
    if (res.code === 200) {
      insertImage({
        url: res.value,
        desc: file.name
      })
    } else {
      message.error('图片上传失败')
    }
  } catch (error) {
    console.error('图片上传失败:', error)
    message.error('图片上传失败')
  }
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

.markdown-editor-container {
  border: 1px solid #d9d9d9;
  border-radius: 4px;
}

.markdown-editor-container :deep(.v-md-editor) {
  border: none;
}

.markdown-editor-container :deep(.v-md-editor__toolbar) {
  border-bottom: 1px solid #e8e8e8;
}

.markdown-editor-container :deep(.v-md-editor__preview) {
  padding: 16px;
  background: #fff;
}

/* 代码块样式 */
.markdown-editor-container :deep(.v-md-editor__preview pre) {
  background: #f6f8fa;
  border-radius: 6px;
  padding: 16px;
}

/* 表格样式 */
.markdown-editor-container :deep(.v-md-editor__preview table) {
  border-collapse: collapse;
  margin: 16px 0;
  width: 100%;
}

.markdown-editor-container :deep(.v-md-editor__preview th),
.markdown-editor-container :deep(.v-md-editor__preview td) {
  border: 1px solid #e8e8e8;
  padding: 8px 16px;
}

.markdown-editor-container :deep(.v-md-editor__preview th) {
  background: #f6f8fa;
}
</style> 