// frontend/src/components/NewsItem.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { formatDistance } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import './NewsItem.css';

const NewsItem = ({ news }) => {
  const {
    id,
    title,
    summary,
    source,
    published_at,
    importance_score,
    categories = []
  } = news;
  
  // 根据重要性分数设置样式
  const getImportanceClass = (score) => {
    if (score >= 8) return 'importance-high';
    if (score >= 5) return 'importance-medium';
    return 'importance-normal';
  };
  
  // 格式化日期
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return formatDistance(date, new Date(), {
        addSuffix: true,
        locale: zhCN
      });
    } catch (e) {
      return '未知时间';
    }
  };
  
  return (
    <div className={`news-item ${getImportanceClass(importance_score)}`}>
      <div className="news-content">
        <h3 className="news-title">{title}</h3>
        <p className="news-summary">{summary}</p>
        <div className="news-meta">
          <span className="news-source">{source}</span>
          <span className="news-date">{formatDate(published_at)}</span>
          <span className="news-score">
            重要性: {importance_score.toFixed(1)}
          </span>
          <div className="news-categories">
            {categories.map(cat => (
              <Link
                key={cat.id}
                to={`/category/${cat.name}`}
                className="category-tag"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsItem;