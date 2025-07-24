// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Layout from './components/Layout';
import NewsCard from './components/NewsCard';
import FilterPanel from './components/FilterPanel';
import ApiDebugTool from './components/ApiDebugTool';
import UrlCrawler from './components/UrlCrawler';
import AdminPanel from './components/AdminPanel';
import Login from './pages/Login';
import Register from './pages/Register';
import UserCenter from './pages/UserCenter';
import { fetchNews, fetchCategories } from './services/api';

const basename = process.env.NODE_ENV === 'production' ? '/news-minialist' : '';

function App() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); 
  const [category, setCategory] = useState('all');
  // 新增状态存储可用分类
  const [availableCategories, setAvailableCategories] = useState([]);
  // 新增状态，跟踪是否还有更多新闻可加载
  const [hasMore, setHasMore] = useState(true);

  // 过滤器设置
  const [filters, setFilters] = useState({
    minScore: 0,
    days: 7,
    limit: 20, // 可以设置每页加载数量
    skip: 0    // 用于分页或加载更多
  });
  
  // 处理过滤器变化
  const handleFilterChange = (newFilters) => {
    console.log("过滤器变化:", newFilters);
    // 重置 skip 为 0，因为筛选条件变了，要从第一页开始
    setFilters({ ...newFilters, skip: 0 }); 
    setNews([]); // 清空旧数据，准备加载新数据
    setLoading(true); // 开始加载
  };

  // 处理分类变化
  const handleCategoryChange = (newCategory) => {
    setCategory(newCategory);
    // 重置 skip 为 0，因为分类变了
    setFilters(prev => ({ ...prev, skip: 0 })); 
    setNews([]); // 清空旧数据
    setLoading(true); // 开始加载
  }

  useEffect(() => {
    console.log("开始获取新闻，分类:", category, "过滤器:", filters);
    
    const loadNews = async () => {
      try {
        setError(null); // 重置错误状态
        setLoading(true); // 确保每次都设置加载状态

        // 2. 调用 fetchNews 获取数据
        const fetchedNews = await fetchNews({ 
          category: category === 'all' ? null : category, // 'all' 时不传 category 参数
          minScore: filters.minScore,
          days: filters.days,
          limit: filters.limit,
          skip: filters.skip
        });

        console.log("获取到的新闻:", fetchedNews);
        
        // 如果是加载更多 (skip > 0)，则追加数据，否则替换数据
        setNews(prevNews => filters.skip > 0 ? [...prevNews, ...fetchedNews] : fetchedNews);

        // 更新 hasMore 状态
        setHasMore(fetchedNews.length === filters.limit);

      } catch (err) {
        console.error("获取新闻失败:", err);
        setError("加载新闻失败，请稍后重试。"); // 设置错误消息
      } finally {
        setLoading(false); // 结束加载
      }
    };

    loadNews();
  // 依赖项包含 category 和 filters，当它们变化时重新获取数据
  }, [category, filters]); 

  // 新增 useEffect 获取分类列表
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const fetchedCategories = await fetchCategories();
        // 过滤掉可能存在的 null 或无效分类
        setAvailableCategories(fetchedCategories.filter(cat => cat && cat.name));
      } catch (err) {
        console.error("获取分类失败:", err);
        // 可以选择设置一个错误状态或显示提示
      }
    };
    loadCategories();
  }, []); // 空依赖数组，表示只在组件挂载时运行一次

  // 新增加载更多函数
  const loadMore = () => {
    setFilters(prevFilters => ({
      ...prevFilters,
      skip: prevFilters.skip + prevFilters.limit
    }));
    // 注意：这里不需要手动设置 setLoading(true)，因为 filters 的变化会触发 useEffect
  };

  // MainContent组件需要包含在Router中，以便FilterPanel可以使用useSearchParams和useNavigate
  const MainContent = () => (
    <Layout>
        <FilterPanel 
           filters={filters} 
           onFilterChange={handleFilterChange} 
          />
          <div className="category-nav">
            {/* 使用 handleCategoryChange 更新分类 */}
            <button 
              className={`category-btn ${category === 'all' ? 'active' : ''}`}
              onClick={() => handleCategoryChange('all')}>
              全部
            </button>
            {/* 动态渲染从后端获取的分类按钮 */}
         {availableCategories.map((cat) => (
           <button
             key={cat.id} // 使用分类 ID 作为 key
             className={`category-btn ${category === cat.name ? 'active' : ''}`}
             onClick={() => handleCategoryChange(cat.name)}>
             {cat.name}
           </button>
         ))}
       </div>
          
          {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

          <div className="news-container">
            {/* 首次加载时显示骨架屏 */}
            {loading && news.length === 0 ? (
              <div className="loading-skeleton">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="skeleton-card">
                    <div className="skeleton-title"></div>
                    <div className="skeleton-meta"></div>
                  </div>
                ))}
              </div>
            ) : news.length > 0 ? (
              news.map((item) => (
                <NewsCard
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  source={item.source}
                  // 确保使用 published_at
                  published_at={item.published_at}
                  url={item.url}
                  // 传递 summary 和 importance_score
                  summary={item.summary}
                  importance_score={item.importance_score}
                />
              ))
            ) : (
              // 没有新闻且不在加载中
              !loading && news.length === 0 && <div>暂无新闻</div>
            )}
            {/* 加载更多按钮 */}
            {!loading && news.length > 0 && hasMore && (
              <button 
                onClick={loadMore} 
                className="load-more-button" // 添加一个类名方便样式化
                style={{ // 简单的内联样式，可以移到 CSS 文件
                  display: 'block', 
                  width: '100%', 
                  padding: '0.8rem', 
                  marginTop: '1.5rem',
                  backgroundColor: 'var(--accent)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.95rem'
                }}
              >
                加载更多
              </button>
            )}
            {/* 加载时在底部显示提示 */}
            {loading && filters.skip > 0 && (
              <div style={{textAlign: 'center', padding: '1rem', color: 'var(--text-secondary)'}}>
                正在加载更多新闻...
              </div>
            )}
          </div>
    </Layout>
  );
  
  return (
    <Router basename={basename}>
      <Routes>
        <Route path="/" element={<MainContent />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/user" element={<UserCenter />} />
        <Route path="/debug-api" element={<ApiDebugTool />} />
        <Route path="/crawler" element={<UrlCrawler />} />
        <Route path="/submit-url" element={<UrlCrawler />} />
        <Route path="/admin" element={<AdminPanel />} /> 
        {/* 添加其他路由 */}
      </Routes>
    </Router>
  );
}

export default App;