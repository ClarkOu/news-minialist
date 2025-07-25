// 用户登录信息本地存储工具

export function setUser(user) {
  localStorage.setItem('user', JSON.stringify(user));
  // 觸發自定義事件通知其他組件用戶狀態已變化
  window.dispatchEvent(new Event('userStateChanged'));
}

export function getUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

export function removeUser() {
  localStorage.removeItem('user');
}

// 獲取JWT token
export function getAuthToken() {
  const user = getUser();
  return user?.access_token || null;
}

// 檢查用戶是否已登錄
export function isLoggedIn() {
  const token = getAuthToken();
  if (!token) return false;
  
  try {
    // 簡單檢查token格式（JWT應該有3個部分）
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    // 解碼payload檢查過期時間
    const payload = JSON.parse(atob(parts[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    
    // 如果token已過期，清除用戶信息
    if (payload.exp && payload.exp < currentTime) {
      removeUser();
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Token驗證失敗:', error);
    removeUser();
    return false;
  }
}

// 登出用戶
export function logout() {
  removeUser();
  // 觸發自定義事件通知其他組件用戶狀態已變化
  window.dispatchEvent(new Event('userStateChanged'));
  // 可以在這裡添加其他登出邏輯，比如重定向到登錄頁面
}
