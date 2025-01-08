// 用户信息管理
export const userStorage = {
  // 保存用户信息
  setUser(user) {
    localStorage.setItem('currentUser', JSON.stringify(user))
  },
  
  // 获取用户信息
  getUser() {
    const user = localStorage.getItem('currentUser')
    return user ? JSON.parse(user) : null
  },
  
  // 清除用户信息
  clearUser() {
    localStorage.removeItem('currentUser')
  }
} 