<template>
  <div class="register-container">
    <a-card class="register-card">
      <div class="register-header">
        <h2>用户注册</h2>
      </div>
      
      <a-form
        :model="formState"
        name="registerForm"
        @finish="handleFinish"
        @finishFailed="handleFinishFailed"
      >
        <a-form-item
          name="username"
          :rules="[
            { required: true, message: '请输入用户名!' },
            { min: 3, max: 20, message: '长度在 3 到 20 个字符' }
          ]"
        >
          <a-input
            v-model:value="formState.username"
            size="large"
            placeholder="用户名"
          >
            <template #prefix>
              <UserOutlined />
            </template>
          </a-input>
        </a-form-item>

        <a-form-item
          name="password"
          :rules="[
            { required: true, message: '请输入密码!' },
            { min: 6, message: '密码长度至少为 6 个字符' }
          ]"
        >
          <a-input-password
            v-model:value="formState.password"
            size="large"
            placeholder="密码"
          >
            <template #prefix>
              <LockOutlined />
            </template>
          </a-input-password>
        </a-form-item>

        <a-form-item>
          <a-button
            type="primary"
            html-type="submit"
            size="large"
            :block="true"
            :loading="loading"
          >
            注册
          </a-button>
          <a-button
            size="large"
            :block="true"
            style="margin-top: 10px"
            @click="goToLogin"
          >
            返回登录
          </a-button>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { UserOutlined, LockOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import { userApi } from '@/api/user'

const router = useRouter()
const loading = ref(false)

const formState = reactive({
  username: '',
  password: ''
})

const handleFinish = async (values) => {
  try {
    loading.value = true
    const res = await userApi.register(values)
    if (res.code === 200) {
      message.success('注册成功！')
      router.push('/login')
    } else {
      message.error(res.msg || '注册失败！')
    }
  } catch (error) {
    const errorMsg = error.response?.data?.msg || '注册失败，请重试！'
    message.error(errorMsg)
  } finally {
    loading.value = false
  }
}

const handleFinishFailed = (errorInfo) => {
  console.log('Failed:', errorInfo)
  message.error('请填写完整的注册信息！')
}

const goToLogin = () => {
  router.push('/login')
}
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f0f2f5;
}

.register-card {
  width: 100%;
  max-width: 400px;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.register-header {
  text-align: center;
  margin-bottom: 40px;
}

h2 {
  margin-bottom: 0;
  font-size: 24px;
  font-weight: 600;
}
</style> 