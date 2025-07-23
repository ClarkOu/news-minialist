import React, { useState } from 'react';

function NewsDiscoveryButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

  const handleDiscovery = async () => {
    setIsLoading(true);
    setMessage('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/crawler/discover`, {
        method: 'POST',
      });
      
      const data = await response.json();
      setMessage(data.message);
    } catch (error) {
      setMessage('启动新闻发现失败: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="discovery-button-container">
      <button 
        onClick={handleDiscovery} 
        disabled={isLoading}
        className="discovery-button"
      >
        {isLoading ? '处理中...' : '发现新闻'}
      </button>
      {message && <p className="discovery-message">{message}</p>}
    </div>
  );
}

export default NewsDiscoveryButton;