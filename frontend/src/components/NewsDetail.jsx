// frontend/src/components/NewsDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { formatDate } from '../utils/dateFormat';
import { fetchNewsDetail } from '../services/api';
import { getUser } from '../utils/auth';
import { addBrowseHistory } from '../services/api';
import './NewsDetail.css';

const NewsDetail = () => {
  const { id } = useParams();
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const loadNewsDetail = async () => {
      try {
        setLoading(true);
        const data = await fetchNewsDetail(id);
        setNews(data);
        // 新增：记录浏览历史
        const user = getUser();
        if (user && user.id) {
          addBrowseHistory(user.id, id).then(res => {
            console.log('[调试] addBrowseHistory 返回：', res, 'user_id:', user.id, 'news_id:', id);
          });
        }
      } catch (err) {
        setError('加载新闻详情失败，请稍后重试');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    loadNewsDetail();
  }, [id]);
  
  if (loading) {
    return <div className="loading-spinner detail-loading">加载中...</div>;
  }
  
  if (error) {
    return <div className="error-message">{error}</div>;
  }
  
  if (!news) {
    return <div className="not-found">未找到该新闻</div>;
  }
  
  return (
    <article className="news-detail">
      <header className="detail-header">
        <h1 className="detail-title">{news.title}</h1>
        
        <div className="detail-meta">
          <span className="detail-source">
            来源: {news.source}
          </span>
          <span className="detail-date">
            发布时间: {new Date(news.published_at).toLocaleString('zh-CN')}
          </span>
          <span className="detail-importance">
            重要性评分: {news.importance_score.toFixed(1)}/10
          </span>
        </div>
        
        <div className="detail-categories">
          {news.categories.map(cat => (
            <Link
              key={cat.id}
              to={`/category/${cat.name}`}
              className="category-tag"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </header>
      
      <div className="detail-summary">
        <strong>摘要: </strong> {news.summary}
      </div>
      
      <div className="detail-content">
        {news.content.split('\n').map((paragraph, index) => (
          paragraph ? <p key={index}>{paragraph}</p> : null
        ))}
      </div>
      
      <div className="detail-footer">
        <Link to="/" className="back-to-home">
          &larr; 返回新闻列表
        </Link>
        {news.url && (
          <a
            href={news.url}
            className="original-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            查看原文 &rarr;
          </a>
        )}
      </div>
    </article>
  );
};

export default NewsDetail;