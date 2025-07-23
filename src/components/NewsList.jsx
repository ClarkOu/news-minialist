// frontend/src/components/NewsList.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import NewsItem from './NewsItem';
import FilterPanel from './FilterPanel';
import { fetchNews } from '../services/api';
import './NewsList.css';

const NewsList = () => {
  const { category } = useParams();
  const [searchParams] = useSearchParams();
  
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 筛选参数
  const [filters, setFilters] = useState({
    minScore: searchParams.get('min_score') || 0,
    days: searchParams.get('days') || 7,
    limit: 20,
    skip: 0,
    category
  });
  
  // 加载更多功能
  const [hasMore, setHasMore] = useState(true);
  
  useEffect(() => {
    // 当分类变化时，重置新闻列表
    setNews([]);
    setFilters(prev => ({ ...prev, category, skip: 0 }));
    setHasMore(true);
  }, [category]);
  
  useEffect(() => {
    const loadNews = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const fetchParams = { ...filters };
        if (category) {
          fetchParams.category = category;
        }
        
        const data = await fetchNews(fetchParams);
        
        if (filters.skip === 0) {
          // 首次加载或筛选条件变化
          setNews(data);
        } else {
          // 加载更多
          setNews(prev => [...prev, ...data]);
        }
        
        // 如果返回的新闻少于请求的数量，表示没有更多了
        setHasMore(data.length === filters.limit);
      } catch (err) {
        setError('加载新闻失败，请稍后重试');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    loadNews();
  }, [filters]);
  
  // 更新筛选条件
  const handleFilterChange = (newFilters) => {
    setFilters({ ...newFilters, skip: 0 });
    setNews([]);
    setHasMore(true);
  };
  
  // 加载更多
  const handleLoadMore = () => {
    setFilters(prev => ({
      ...prev,
      skip: prev.skip + prev.limit
    }));
  };
  
  return (
    <div className="news-page">
      <div className="news-container">
        <FilterPanel 
          filters={filters} 
          onFilterChange={handleFilterChange} 
        />
        
        <div className="news-list">
          <h2 className="page-title">
            {category ? `${category}相关新闻` : '最新重要新闻'}
          </h2>
          
          {error && <div className="error-message">{error}</div>}
          
          {news.length > 0 ? (
            <>
              <div className="news-items">
                {news.map(item => (
                  <NewsItem key={item.id} news={item} />
                ))}
              </div>
              
              {hasMore && (
                <button
                  className="load-more-btn"
                  onClick={handleLoadMore}
                  disabled={loading}
                >
                  {loading ? '加载中...' : '加载更多'}
                </button>
              )}
            </>
          ) : !loading ? (
            <div className="empty-state">暂无相关新闻</div>
          ) : null}
          
          {loading && news.length === 0 && (
            <div className="loading-spinner">加载中...</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewsList;