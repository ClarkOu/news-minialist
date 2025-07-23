// src/components/Layout.jsx 修改版
import React, { useEffect, useState } from 'react';
import { getUser, logout, isLoggedIn } from '../utils/auth';
import { useNavigate } from 'react-router-dom';
import './Layout.css';
import { setupDarkMode } from '../utils/darkMode';

const Layout = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const [user, setUserState] = useState(getUser());
  const navigate = useNavigate();
  // 监听本地存储变化（如登录/退出）
  useEffect(() => {
    const syncUser = () => {
      if (isLoggedIn()) {
        setUserState(getUser());
      } else {
        setUserState(null);
      }
    };
    
    // 初始檢查
    syncUser();
    
    // 監聽storage事件（跨標籤頁）
    window.addEventListener('storage', syncUser);
    
    // 監聽自定義事件（同一標籤頁內的登錄狀態變化）
    window.addEventListener('userStateChanged', syncUser);
    
    return () => {
      window.removeEventListener('storage', syncUser);
      window.removeEventListener('userStateChanged', syncUser);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setUserState(null);
    navigate('/login');
  };
  
  useEffect(() => {
    // 检查初始深色模式状态
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('theme');
    const initialDarkMode = savedTheme === 'dark' || (!savedTheme && prefersDarkMode);
    
    if (initialDarkMode) {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  }, []);
  
  const toggleDarkMode = () => {
    const isDarkMode = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    setIsDark(isDarkMode);
  };

  return (
    <div className="layout">
      <header className="header">
        <div className="container">
          <h1 className="site-title">News Minimalist</h1>
          <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {user ? (
              <>
                <span style={{ fontWeight: 500, cursor: 'pointer' }} onClick={() => navigate('/user')}>你好，{user.username}</span>
                <button onClick={handleLogout} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>退出登录</button>
              </>
            ) : (
              <>
                <a href="/login" className="nav-link">登录</a>
                <a href="/register" className="nav-link">注册</a>
              </>
            )}
            <button 
              className="theme-toggle" 
              aria-label="Toggle dark mode"
              onClick={toggleDarkMode}
            >
              {isDark ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5"></circle>
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>
      <main className="main">
        <div className="container">
          {children}
        </div>
      </main>
      <footer className="footer">
        <div className="container">
          <p>© {new Date().getFullYear()} - 简约新闻聚合</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;