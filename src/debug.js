// src/debug.js
export function checkComponentsStatus() {
    console.log('=== 组件状态检查 ===');
    
    // 检查深色模式
    const isDarkMode = document.documentElement.classList.contains('dark');
    console.log('深色模式状态:', isDarkMode ? '启用' : '禁用');
    
    // 检查分类导航
    const categoryNav = document.querySelector('.category-nav');
    console.log('分类导航:', categoryNav ? '已渲染' : '未渲染');
    
    // 检查新闻卡片
    const newsCards = document.querySelectorAll('.news-card');
    console.log('新闻卡片数量:', newsCards.length);
    
    console.log('=== 检查完成 ===');
  }
  
  // 在App.jsx中使用:
  // import { checkComponentsStatus } from './debug';
  // useEffect(() => { checkComponentsStatus(); }, []);