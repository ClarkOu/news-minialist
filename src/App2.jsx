import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import NewsCard from './components/NewsCard';
import FilterPanel from './components/FilterPanel';
import ApiDebugTool from './components/ApiDebugTool';
import UrlCrawler from './components/UrlCrawler';
import AdminPanel from './components/AdminPanel';
import { fetchNews, fetchCategories } from './services/api'; // 确保导入
import './App.css';

// --- 1. 定义 MainContent 在 App 外部 ---
// 它现在接收 props
const MainContent = ({
  news,
  loading,
  error,
  category,
  availableCategories,
  hasMore,
  filters,
  handleFilterChange,
  handleCategoryChange,
  loadMore
}) => {
  return (
    <Layout>
      {/* 1. 恢复 FilterPanel 并传递必要的 props */}
      <FilterPanel 
         filters={filters} 
         onFilterChange={handleFilterChange} 
      />

      {/* 2. 恢复分类导航的原始类名 */}
      <div className="category-nav" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', display: 'flex', gap: '0.5rem' }}>
         <button 
           // 使用 category-btn
           className={`category-btn ${category === 'all' ? 'active' : ''}`}
           onClick={() => handleCategoryChange('all')}>
           全部
         </button>
         {availableCategories.map(cat => (
           <button 
             key={cat.id} 
             // 使用 category-btn
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
              title={item.title}
              source={item.source}
              published_at={item.published_at}
              url={item.url}
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
            className="load-more-button"
            style={{ 
              display: 'block', 
              width: '100%', 
              padding: '0.8rem', 
              marginTop: '1.5rem',
              backgroundColor: 'var(--accent)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.95rem' }}
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
}; // --- 结束 MainContent 定义 ---


// --- App 组件现在包含状态和逻辑 ---
function App() {
  // --- 2. 将状态和逻辑移到 App ---
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); 
  const [category, setCategory] = useState('all');
  const [availableCategories, setAvailableCategories] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState({
    minScore: 0,
    days: 7,
    limit: 20,
    skip: 0
  });
  
  const handleFilterChange = (newFilters) => {
    console.log("过滤器变化:", newFilters);
    setFilters({ ...newFilters, skip: 0 }); 
    setNews([]); 
    setLoading(true); 
  };

  const handleCategoryChange = (newCategory) => {
    setCategory(newCategory);
    setFilters(prev => ({ ...prev, skip: 0 })); 
    setNews([]); 
    setLoading(true); 
  }

  const loadMore = () => {
    setFilters(prevFilters => ({
      ...prevFilters,
      skip: prevFilters.skip + prevFilters.limit
    }));
    // 注意：加载状态由接下来的 useEffect 处理
  };

  // Effect for loading news
  useEffect(() => {
    console.log("开始获取新闻，分类:", category, "过滤器:", filters);
    let isMounted = true; // 防止在 unmounted 组件上更新状态
    const loadNews = async () => {
      setLoading(true); // 确保每次都设置加载状态
      try {
        setError(null); 
        const fetchedNews = await fetchNews({ 
          category: category === 'all' ? null : category,
          minScore: filters.minScore,
          days: filters.days,
          limit: filters.limit,
          skip: filters.skip
        });

        console.log("获取到的新闻:", fetchedNews);
        
        if (isMounted) {
            // let processedNews; // 不再需要这个变量
            if (filters.skip > 0) {
              // 加载更多：直接追加，不再重新排序
              setNews(prevNews => [...prevNews, ...fetchedNews]);
            } else {
              // 首次加载或筛选变化：设置新数据，并进行排序（如果需要）
              let initialNews = fetchedNews;
              if (filters.minScore === 0) {
                // 只在首次加载时排序
                initialNews.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
              }
              setNews(initialNews);
            }

          setHasMore(fetchedNews.length === filters.limit); 
        }

      } catch (err) {
        console.error("获取新闻失败:", err);
        if (isMounted) {
          setError("加载新闻失败，请稍后重试。"); 
        }
      } finally {
        if (isMounted) {
          setLoading(false); 
        }
      }
    };

    loadNews();

    return () => {
      isMounted = false; // 清理函数
    };
  // 移除依赖项中的 news
  }, [category, filters.minScore, filters.days, filters.limit, filters.skip]); // 依赖项

  // Effect for loading categories
  useEffect(() => {
    let isMounted = true;
    const loadCategories = async () => {
      try {
        const fetchedCategories = await fetchCategories();
        if (isMounted) {
          setAvailableCategories(fetchedCategories.filter(cat => cat && cat.name));
        }
      } catch (err) {
        console.error("获取分类失败:", err);
      }
    };
    loadCategories();
    return () => {
      isMounted = false;
    };
  }, []); // 空依赖，只运行一次

  // --- 结束移动状态和逻辑 ---

  // --- 3. App 的 return 保持不变，但在 Route 中传递 props ---
  return (
    <Router basename="/crazynews">
      <Routes>
        <Route 
          path="/" 
          element={
            <MainContent 
              news={news}
              loading={loading}
              error={error}
              category={category}
              availableCategories={availableCategories}
              hasMore={hasMore}
              filters={filters}
              handleFilterChange={handleFilterChange}
              handleCategoryChange={handleCategoryChange}
              loadMore={loadMore}
            />
          } 
        />
        <Route path="/debug-api" element={<ApiDebugTool />} />
        <Route path="/crawler" element={<UrlCrawler />} />
        <Route path="/submit-url" element={<UrlCrawler />} />
        <Route path="/admin" element={<AdminPanel />} /> 
      </Routes>
    </Router>
  );
}

export default App;
