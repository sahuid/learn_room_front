// 用户信息管理
export const userStorage = {
  // 保存用户信息
  setUser(user) {
    localStorage.setItem('userInfo', JSON.stringify(user))
  },
  
  // 获取用户信息
  getUser() {
    const user = localStorage.getItem('userInfo')
    return user ? JSON.parse(user) : null
  },
  
  // 清除用户信息
  clearUser() {
    localStorage.removeItem('userInfo')
  }
} 