import React, { useState } from 'react'; // 导入 useState
import { formatRelativeDate } from '../utils/dateFormat';
import { getUser } from '../utils/auth';
import { addBrowseHistory } from '../services/api';
import './NewsCard.css';

const NewsCard = ({ title, source, published_at, url, summary, importance_score, id }) => {
  const [isExpanded, setIsExpanded] = useState(false); // 添加状态管理摘要展开/折叠

  const scoreDisplay = importance_score ? importance_score.toFixed(1) : 'N/A';

  // 点击摘要时切换展开状态
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // 新增：点击标题时先记录浏览历史再跳转
  const handleTitleClick = (e) => {
    e.preventDefault();
    const user = getUser();
    if (user && user.id && id) {
      addBrowseHistory(user.id, id).finally(() => {
        window.open(url, '_blank');
      });
    } else if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="news-card">
      <div className="news-header">
        <span className="news-score-badge">{scoreDisplay}</span>
        <a
          href={url}
          // target="_blank"  // 移除，全部用window.open跳转
          rel="noopener noreferrer"
          className="news-link"
          onClick={handleTitleClick}
        >
          <h2 className="news-title">{title}</h2>
        </a>
      </div>
      {/* 仅当有摘要时才渲染 */}
      {summary && (
        <p
          // 根据 isExpanded 状态添加 'expanded' 类
          className={`news-summary-card ${isExpanded ? 'expanded' : ''}`}
          // 添加点击事件处理器
          onClick={toggleExpand}
          // 添加 title 属性，鼠标悬停时显示完整摘要（可选）
          title={!isExpanded ? "点击展开/折叠摘要" : ""}
        >
          {summary}
        </p>
      )}
      <div className="news-meta">
        <span className="news-source">{source}</span>
        {published_at && <span className="news-date">{formatRelativeDate(published_at)}</span>}
      </div>
    </div>
  );
};

export default NewsCard;