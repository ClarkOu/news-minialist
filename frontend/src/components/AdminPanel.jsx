import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';

const AdminPanel = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [schedulerStatus, setSchedulerStatus] = useState(null);
  const [lastCrawlResult, setLastCrawlResult] = useState(null);
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

  // 獲取調度器狀態
  const fetchSchedulerStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/crawler/status`);
      const data = await response.json();
      setSchedulerStatus(data.scheduler_status);
    } catch (error) {
      console.error('獲取調度器狀態失敗:', error);
    }
  }, [API_BASE_URL]);

  // 組件加載時獲取狀態
  useEffect(() => {
    fetchSchedulerStatus();
    // 每30秒更新一次狀態
    const interval = setInterval(fetchSchedulerStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchSchedulerStatus]);

  const triggerCrawl = async () => {
    setLoading(true);
    setMessage('');
    setLastCrawlResult(null);
    
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${API_BASE_URL}/admin/crawl-now`, {
        method: 'POST',
      });
      const data = await response.json();
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      if (response.ok) {
        setMessage(`✅ ${data.message}`);
        setLastCrawlResult({
          success: true,
          duration: data.duration || duration,
          newsCount: data.news_count || 0,
          timestamp: new Date().toLocaleString()
        });
      } else {
        setMessage(`❌ 操作失敗: ${data.detail || data.message}`);
        setLastCrawlResult({
          success: false,
          error: data.detail || data.message,
          timestamp: new Date().toLocaleString()
        });
      }
    } catch (error) {
      setMessage(`❌ 網絡錯誤: ${error.message}`);
      setLastCrawlResult({
        success: false,
        error: error.message,
        timestamp: new Date().toLocaleString()
      });
    } finally {
      setLoading(false);
      // 更新調度器狀態
      setTimeout(fetchSchedulerStatus, 1000);
    }
  };

  return (
    <div className="admin-panel" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: '#333', marginBottom: '30px' }}>🔧 管理面板</h1>
      
      {/* 調度器狀態 */}
      <div className="panel-section" style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        border: '1px solid #e9ecef'
      }}>
        <h2 style={{ color: '#495057', marginBottom: '15px' }}>📊 調度器狀態</h2>
        {schedulerStatus ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div style={{ padding: '10px', backgroundColor: 'white', borderRadius: '5px' }}>
              <strong>運行狀態:</strong> 
              <span style={{ 
                color: schedulerStatus.running ? '#28a745' : '#dc3545',
                marginLeft: '8px'
              }}>
                {schedulerStatus.running ? '🟢 運行中' : '🔴 已停止'}
              </span>
            </div>
            <div style={{ padding: '10px', backgroundColor: 'white', borderRadius: '5px' }}>
              <strong>總執行次數:</strong> 
              <span style={{ marginLeft: '8px', color: '#007bff' }}>
                {schedulerStatus.total_runs || 0}
              </span>
            </div>
            <div style={{ padding: '10px', backgroundColor: 'white', borderRadius: '5px' }}>
              <strong>成功次數:</strong> 
              <span style={{ marginLeft: '8px', color: '#28a745' }}>
                {schedulerStatus.successful_runs || 0}
              </span>
            </div>
            <div style={{ padding: '10px', backgroundColor: 'white', borderRadius: '5px' }}>
              <strong>失敗次數:</strong> 
              <span style={{ marginLeft: '8px', color: '#dc3545' }}>
                {schedulerStatus.failed_runs || 0}
              </span>
            </div>
            {schedulerStatus.last_run && (
              <div style={{ padding: '10px', backgroundColor: 'white', borderRadius: '5px', gridColumn: '1 / -1' }}>
                <strong>上次執行:</strong> 
                <span style={{ marginLeft: '8px' }}>
                  {new Date(schedulerStatus.last_run).toLocaleString()}
                </span>
              </div>
            )}
            {schedulerStatus.next_run && (
              <div style={{ padding: '10px', backgroundColor: 'white', borderRadius: '5px', gridColumn: '1 / -1' }}>
                <strong>下次執行:</strong> 
                <span style={{ marginLeft: '8px' }}>
                  {new Date(schedulerStatus.next_run).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        ) : (
          <p style={{ color: '#6c757d' }}>正在加載調度器狀態...</p>
        )}
      </div>

      {/* 手動執行 */}
      <div className="panel-section" style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        border: '1px solid #e9ecef'
      }}>
        <h2 style={{ color: '#495057', marginBottom: '15px' }}>🚀 手動執行</h2>
        <button 
          onClick={triggerCrawl} 
          disabled={loading}
          style={{
            backgroundColor: loading ? '#6c757d' : '#007bff',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '5px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.3s'
          }}
        >
          {loading ? '⏳ 執行中...' : '▶️ 立即執行爬蟲任務'}
        </button>
        
        {message && (
          <div style={{ 
            marginTop: '15px', 
            padding: '10px', 
            borderRadius: '5px',
            backgroundColor: message.includes('✅') ? '#d4edda' : '#f8d7da',
            border: `1px solid ${message.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`,
            color: message.includes('✅') ? '#155724' : '#721c24'
          }}>
            {message}
          </div>
        )}
        
        {lastCrawlResult && (
          <div style={{ 
            marginTop: '15px', 
            padding: '15px', 
            backgroundColor: 'white', 
            borderRadius: '5px',
            border: '1px solid #dee2e6'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>📈 執行結果</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
              <div>
                <strong>狀態:</strong> 
                <span style={{ 
                  color: lastCrawlResult.success ? '#28a745' : '#dc3545',
                  marginLeft: '5px'
                }}>
                  {lastCrawlResult.success ? '✅ 成功' : '❌ 失敗'}
                </span>
              </div>
              {lastCrawlResult.success && (
                <>
                  <div>
                    <strong>新聞數量:</strong> 
                    <span style={{ marginLeft: '5px', color: '#007bff' }}>
                      {lastCrawlResult.newsCount}
                    </span>
                  </div>
                  <div>
                    <strong>執行時間:</strong> 
                    <span style={{ marginLeft: '5px' }}>
                      {lastCrawlResult.duration}s
                    </span>
                  </div>
                </>
              )}
              <div style={{ gridColumn: '1 / -1' }}>
                <strong>時間:</strong> 
                <span style={{ marginLeft: '5px' }}>
                  {lastCrawlResult.timestamp}
                </span>
              </div>
              {lastCrawlResult.error && (
                <div style={{ gridColumn: '1 / -1', color: '#dc3545' }}>
                  <strong>錯誤:</strong> 
                  <span style={{ marginLeft: '5px' }}>
                    {lastCrawlResult.error}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      <Link 
        to="/" 
        className="back-link"
        style={{
          display: 'inline-block',
          padding: '10px 20px',
          backgroundColor: '#6c757d',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '5px',
          transition: 'background-color 0.3s'
        }}
      >
        ← 返回首頁
      </Link>
    </div>
  );
};

export default AdminPanel;