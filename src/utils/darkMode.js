// src/utils/darkMode.js
export const setupDarkMode = () => {
    // 检查用户偏好
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // 获取保存的主题模式
    const savedTheme = localStorage.getItem('theme');
    
    // 设置初始主题
    if (savedTheme === 'dark' || (!savedTheme && prefersDarkMode)) {
      document.documentElement.classList.add('dark');
    }
    
    // 返回切换主题的函数
    return () => {
      const isDark = document.documentElement.classList.toggle('dark');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    };
  };