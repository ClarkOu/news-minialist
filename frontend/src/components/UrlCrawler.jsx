// frontend/src/components/UrlCrawler.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import NewsDiscoveryButton from './NewsDiscoveryButton'; 
import './UrlCrawler.css';

const UrlCrawler = () => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/crawler/url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });
      
      if (!response.ok) {
        throw new Error(`服务器返回错误: ${response.status}`);
      }
      
      const data = await response.json();
      setResult(data);
      setUrl(''); // 清空输入框
    } catch (err) {
      setError('提交URL失败: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="url-crawler">
      <h1 className="crawler-title">内容爬取工具</h1>
      <p className="crawler-description">
        输入任意新闻文章URL，系统将爬取内容并通过AI处理，创建简洁摘要。
      </p>
      
      <form onSubmit={handleSubmit} className="crawler-form">
        <div className="input-group">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="输入新闻文章URL (例如: https://www.bbc.com/news/world-asia-china-66186965)"
            required
            className="url-input"
          />
          <button 
            type="submit" 
            className="crawl-button"
            disabled={isLoading}
          >
            {isLoading ? '处理中...' : '提交'}
          </button>
        </div>
        
        {error && (
          <div className="crawler-error">
            {error}
          </div>
        )}
        
        {isLoading && (
          <div className="crawler-loading">
            <div className="loading-spinner"></div>
            <p>正在爬取和处理文章，这可能需要几秒钟...</p>
          </div>
        )}
        
        {result && !isLoading && (
          <div className="success-message" style={{
            padding: '1rem',
            backgroundColor: '#e8f5e9',
            borderRadius: '4px',
            marginTop: '1rem',
            textAlign: 'center'
          }}>
            <p>{result.message}</p>
            <p style={{fontSize: '0.9rem', marginTop: '0.5rem'}}>
              文章将在处理完成后出现在新闻列表中
            </p>
          </div>
        )}
      </form>

      <div className="discovery-section" style={{marginTop: '2rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '4px'}}>
        <h3>新闻自动发现</h3>
        <p>点击下面的按钮手动触发新闻发现流程：</p>
        <NewsDiscoveryButton />
      </div>
      
      <div className="ai-discovery-info" style={{marginTop: '2rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px'}}>
        <h3>AI自动发现功能</h3>
        <p>除了手动提交URL外，系统还会：</p>
        <ul style={{paddingLeft: '1.5rem'}}>
          <li>自动发现并爬取重要新闻文章</li>
          <li>每30分钟对主流新闻源进行扫描</li>
          <li>使用AI评估新闻重要性并生成摘要</li>
        </ul>
      </div>
      
      <div className="crawler-footer">
        <Link to="/" className="back-link">返回首页</Link>
      </div>
    </div>
  );
};

export default UrlCrawler;