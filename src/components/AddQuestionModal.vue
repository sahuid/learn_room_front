<template>
  <AModal
    v-model:open="visible"
    title="添加题目"
    width="800px"
    @ok="handleSubmit"
    @cancel="handleCancel"
    :confirmLoading="loading"
    :maskClosable="false"
    :destroyOnClose="true"
  >
    <AForm
      ref="formRef"
      :model="formState"
      :rules="rules"
      layout="vertical"
    >
      <AFormItem label="题目标题" name="title">
        <AInput
          v-model:value="formState.title"
          placeholder="请输入题目标题"
          allow-clear
        />
      </AFormItem>

      <AFormItem label="题目内容" name="context">
        <ATextarea
          v-model:value="formState.context"
          placeholder="请输入题目内容"
          :auto-size="{ minRows: 4, maxRows: 8 }"
          allow-clear
        />
      </AFormItem>

      <AFormItem label="推荐答案" name="answer">
        <ATextarea
          v-model:value="formState.answer"
          placeholder="请输入推荐答案"
          :auto-size="{ minRows: 4, maxRows: 8 }"
          allow-clear
        />
      </AFormItem>

      <AFormItem label="标签" name="tags">
        <ASelect
          v-model:value="formState.tags"
          mode="tags"
          placeholder="请输入标签"
          :token-separators="[',']"
        >
          <ASelectOption
            v-for="tag in commonTags"
            :key="tag"
            :value="tag"
          >
            {{ tag }}
          </ASelectOption>
        </ASelect>
      </AFormItem>
    </AForm>
  </AModal>
</template>

<script setup>
import { ref, reactive, defineProps, defineEmits, computed } from 'vue'
import { Modal, Form, Input, Select } from 'ant-design-vue'
import { questionApi } from '@/api/question'
import { message } from 'ant-design-vue'

const { TextArea: ATextarea } = Input
const { Option: ASelectOption } = Select
const AModal = Modal
const AForm = Form
const AFormItem = Form.Item
const AInput = Input
const ASelect = Select

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'success'])

// 使用计算属性处理 visible 状态
const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const formRef = ref()
const loading = ref(false)

// 表单数据
const formState = reactive({
  title: '',
  context: '',
  answer: '',
  tags: []
})

// 常用标签
const commonTags = [
  'JavaScript',
  'Vue',
  'React',
  'Node.js',
  'Java',
  'Python',
  'MySQL'
]

// 表单验证规则
const rules = {
  title: [
    { required: true, message: '请输入题目标题', trigger: 'blur' },
    { max: 100, message: '标题最多100个字符', trigger: 'blur' }
  ],
  context: [
    { required: true, message: '请输入题目内容', trigger: 'blur' }
  ],
  answer: [
    { required: true, message: '请输入推荐答案', trigger: 'blur' }
  ],
  tags: [
    { required: true, type: 'array', message: '请至少添加一个标签', trigger: 'change' }
  ]
}

// 提交表单
const handleSubmit = () => {
  formRef.value.validate().then(async () => {
    loading.value = true
    try {
      const res = await questionApi.add(formState)
      if (res.code === 200) {
        message.success('添加题目成功')
        emit('success')
        handleCancel()
      } else {
        message.error(res.msg || '添加题目失败')
      }
    } catch (error) {
      console.error('添加题目失败:', error)
      message.error('添加题目失败')
    } finally {
      loading.value = false
    }
  })
}

// 取消
const handleCancel = () => {
  formRef.value?.resetFields()
  visible.value = false
}
</script> 