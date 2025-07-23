// 获取用户浏览历史
export const fetchHistory = async (userId) => {
  const url = `${API_BASE_URL}/history?user_id=${userId}`;
  logApiCall('GET', url);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`获取浏览历史失败(${response.status}): ${response.statusText}`);
  }
  return await response.json();
};
// 信息源相关API
export const addSource = async (name, url, description) => {
  const apiUrl = `${API_BASE_URL}/source`;
  logApiCall('POST', apiUrl, { name, url, description });
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, url, description })
  });
  if (!response.ok) {
    throw new Error(`添加信息源失败(${response.status}): ${response.statusText}`);
  }
  return await response.json();
};

export const fetchSources = async () => {
  const apiUrl = `${API_BASE_URL}/sources`;
  logApiCall('GET', apiUrl);
  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error(`获取信息源失败(${response.status}): ${response.statusText}`);
  }
  return await response.json();
};

export const subscribeSource = async (userId, sourceId) => {
  const apiUrl = `${API_BASE_URL}/source/subscribe`;
  logApiCall('POST', apiUrl, { user_id: userId, source_id: sourceId });
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, source_id: sourceId })
  });
  if (!response.ok) {
    throw new Error(`订阅信息源失败(${response.status}): ${response.statusText}`);
  }
  return await response.json();
};

export const unsubscribeSource = async (userId, sourceId) => {
  const apiUrl = `${API_BASE_URL}/source/unsubscribe`;
  logApiCall('POST', apiUrl, { user_id: userId, source_id: sourceId });
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, source_id: sourceId })
  });
  if (!response.ok) {
    throw new Error(`取消订阅信息源失败(${response.status}): ${response.statusText}`);
  }
  return await response.json();
};

export const fetchUserSourceSubscriptions = async (userId) => {
  const apiUrl = `${API_BASE_URL}/source/subscriptions/${userId}`;
  logApiCall('GET', apiUrl);
  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error(`获取用户信息源订阅失败(${response.status}): ${response.statusText}`);
  }
  return await response.json();
};
// 订阅相关API
export const subscribeCategory = async (userId, categoryId) => {
  const url = `${API_BASE_URL}/subscribe`;
  logApiCall('POST', url, { user_id: userId, category_id: categoryId });
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, category_id: categoryId })
  });
  if (!response.ok) {
    throw new Error(`订阅失败(${response.status}): ${response.statusText}`);
  }
  return await response.json();
};

export const unsubscribeCategory = async (userId, categoryId) => {
  const url = `${API_BASE_URL}/unsubscribe`;
  logApiCall('POST', url, { user_id: userId, category_id: categoryId });
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, category_id: categoryId })
  });
  if (!response.ok) {
    throw new Error(`取消订阅失败(${response.status}): ${response.statusText}`);
  }
  return await response.json();
};

export const fetchUserSubscriptions = async (userId) => {
  const url = `${API_BASE_URL}/subscriptions/${userId}`;
  logApiCall('GET', url);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`获取订阅失败(${response.status}): ${response.statusText}`);
  }
  return await response.json();
};
// src/services/api.js
// 使用环境变量定义基础URL，注意这里不再包含 /api，因为环境变量里已经有了
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api'; 

// 添加调试日志
function logApiCall(method, url, params = null) {
  console.group(`🔄 API ${method}: ${url}`);
  if (params) console.log('请求参数:', params);
  console.groupEnd();
}

// 獲取存儲的token
function getAuthToken() {
  const user = localStorage.getItem('user');
  if (user) {
    const userData = JSON.parse(user);
    return userData.access_token;
  }
  return null;
}

// 創建帶認證的請求頭
function getAuthHeaders() {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// 創建基礎請求頭（包含 ngrok 跳過警告）
function getBaseHeaders() {
  return {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true'
  };
}

// 用戶認證相關API
export const loginUser = async (username, password) => {
  const url = `${API_BASE_URL}/login`;
  logApiCall('POST', url, { username });
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getBaseHeaders(),
      body: JSON.stringify({ username, password })
    });
    
    if (!response.ok) {
      throw new Error(`登錄失敗(${response.status}): ${response.statusText}`);
    }
    
    const data = await response.json();
    // 存儲完整的認證信息
    localStorage.setItem('user', JSON.stringify({
      ...data.user,
      access_token: data.access_token,
      token_type: data.token_type
    }));
    
    return data;
  } catch (err) {
    console.error('❌ 登錄失敗:', err);
    throw err;
  }
};

export const registerUser = async (username, email, password) => {
  const url = `${API_BASE_URL}/register`;
  logApiCall('POST', url, { username, email });
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getBaseHeaders(),
      body: JSON.stringify({ username, email, password })
    });
    
    if (!response.ok) {
      throw new Error(`註冊失敗(${response.status}): ${response.statusText}`);
    }
    
    return await response.json();
  } catch (err) {
    console.error('❌ 註冊失敗:', err);
    throw err;
  }
};

export const fetchCurrentUser = async () => {
  const url = `${API_BASE_URL}/me`;
  logApiCall('GET', url);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`獲取用戶信息失敗(${response.status}): ${response.statusText}`);
    }
    
    return await response.json();
  } catch (err) {
    console.error('❌ 獲取用戶信息失敗:', err);
    throw err;
  }
};

export const fetchNews = async (params = {}) => {
  // 路径现在相对于 API_BASE_URL
  const path = '/news'; 
  
  const queryParams = new URLSearchParams();
  
  if (params.category) queryParams.append('category', params.category);
  if (params.minScore) queryParams.append('min_score', params.minScore); 
  if (params.days) queryParams.append('days', params.days);
  if (params.skip) queryParams.append('skip', params.skip);
  if (params.limit) queryParams.append('limit', params.limit);
  
  // 拼接完整的URL
  const url = `${API_BASE_URL}${path}?${queryParams.toString()}`;
  logApiCall('GET', url, params);
  
  try {
    const response = await fetch(url, {
      headers: getBaseHeaders()
    });
    console.log('📡 API响应状态:', response.status);
    
    if (!response.ok) {
      throw new Error(`API错误(${response.status}): ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('📦 API返回数据:', data);
    
    return data;
  } catch (err) {
    console.error('❌ API请求失败:', err);
    throw err;
  }
};

export const fetchNewsDetail = async (id) => {
  // 路径现在相对于 API_BASE_URL
  const path = `/news/${id}`;
  const url = `${API_BASE_URL}${path}`;
  logApiCall('GET', url);
  
  try {
    const response = await fetch(url, {
      headers: getBaseHeaders()
    });
    console.log('📡 API响应状态:', response.status);
    
    if (!response.ok) {
      throw new Error(`API错误(${response.status}): ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('📦 API返回数据:', data);
    
    return data;
  } catch (err) {
    console.error('❌ API请求失败:', err);
    throw err;
  }
};

export const fetchCategories = async () => {
  // 路径现在相对于 API_BASE_URL
  const path = '/categories';
  const url = `${API_BASE_URL}${path}`;
  logApiCall('GET', url);
  
  try {
    const response = await fetch(url, {
      headers: getBaseHeaders()
    });
    console.log('📡 API响应状态:', response.status);
    
    if (!response.ok) {
      throw new Error(`API错误(${response.status}): ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('📦 API返回数据:', data);
    
    return data;
  } catch (err) {
    console.error('❌ API请求失败:', err);
    throw err;
  }
};

export const addBrowseHistory = async (userId, newsId) => {
  const path = `/history/add`;
  const url = `${API_BASE_URL}${path}`;
  logApiCall('POST', url, { user_id: userId, news_id: newsId });
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getBaseHeaders(),
      body: JSON.stringify({ user_id: userId, news_id: newsId }),
    });
    if (!response.ok) {
      throw new Error(`API错误(${response.status}): ${response.statusText}`);
    }
    return await response.json();
  } catch (err) {
    console.error('❌ 添加浏览历史失败:', err);
    // 不抛出，避免影响用户体验
  }
};