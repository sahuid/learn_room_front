<template>
  <div class="login-container">
    <a-card class="login-card">
      <div class="login-header">
        <img src="@/assets/logo.png" alt="Logo" class="logo" />
        <h1>欢迎登录</h1>
      </div>
      
      <a-form
        :model="formState"
        name="loginForm"
        @finish="handleFinish"
        @finishFailed="handleFinishFailed"
      >
        <a-form-item
          name="username"
          :rules="[{ required: true, message: '请输入用户名!' }]"
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
          :rules="[{ required: true, message: '请输入密码!' }]"
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
          <a-row :style="{ width: '100%' }">
            <a-col :span="12">
              <a-checkbox
                v-model:checked="formState.remember"
              >
                记住密码
              </a-checkbox>
            </a-col>
            <a-col :span="12" style="text-align: right">
              <a href="#">忘记密码？</a>
            </a-col>
          </a-row>
        </a-form-item>

        <a-form-item>
          <a-button
            type="primary"
            html-type="submit"
            size="large"
            :block="true"
            :loading="loading"
          >
            登录
          </a-button>
        </a-form-item>

        <div class="register-link">
          还没有账号？
          <a-button type="link" @click="$router.push('/register')">立即注册</a-button>
        </div>

        <div class="other-login">
          <div class="divider">
            <span>其他登录方式</span>
          </div>
          <div class="social-login">
            <a-button shape="circle" class="social-icon">
              <WechatOutlined />
            </a-button>
            <a-button shape="circle" class="social-icon">
              <QqOutlined />
            </a-button>
            <a-button shape="circle" class="social-icon">
              <WeiboOutlined />
            </a-button>
          </div>
        </div>
      </a-form>
    </a-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { UserOutlined, LockOutlined, WechatOutlined, QqOutlined, WeiboOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import { userApi } from '@/api/user'

const router = useRouter()
const loading = ref(false)

const formState = reactive({
  username: '',
  password: '',
  remember: true
})

const handleFinish = async (values) => {
  try {
    loading.value = true
    const res = await userApi.login(values)
    if (res.code === 200) {
      message.success(res.msg || '登录成功！')
      const tokenInfo = res.value
      localStorage.setItem('tokenName', tokenInfo.tokenName)
      localStorage.setItem('tokenValue', tokenInfo.tokenValue)
      try {
        const userRes = await userApi.getuserInfo()
        if (userRes.code === 200) {
          const userData = userRes.value
          if (userData.userPicture) {
            userData.avatarUrl = userData.userPicture
          }
          localStorage.setItem('userInfo', JSON.stringify(userRes.value))
          router.push('/home')
        } else {
          message.error(userRes.msg || '获取用户信息失败')
        }
      } catch (error) {
        message.error('获取用户信息失败')
      }
    } else {
      message.error(res.msg || '登录失败！')
    }
  } catch (error) {
    const errorMsg = error.response?.data?.msg || '登录失败，请重试！'
    message.error(errorMsg)
  } finally {
    loading.value = false
  }
}

const handleFinishFailed = (errorInfo) => {
  console.log('Failed:', errorInfo)
  message.error('请填写完整的登录信息！')
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f0f2f5;
}

.login-card {
  width: 100%;
  max-width: 400px;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.logo {
  height: 44px;
  margin-bottom: 20px;
}

.register-link {
  text-align: center;
  margin-top: 16px;
}

.other-login {
  margin-top: 24px;
}

.divider {
  position: relative;
  text-align: center;
  margin: 16px 0;
}

.divider::before,
.divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 40%;
  height: 1px;
  background: #e8e8e8;
}

.divider::before {
  left: 0;
}

.divider::after {
  right: 0;
}

.divider span {
  color: #999;
  padding: 0 8px;
  background: #fff;
}

.social-login {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 16px;
}

.social-icon {
  color: #999;
  transition: all 0.3s;
}

.social-icon:hover {
  color: #1890ff;
  background: #e6f7ff;
}
</style> 