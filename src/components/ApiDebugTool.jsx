// src/components/ApiDebugTool.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const ApiDebugTool = () => {
  return (
    <div style={{padding: '20px', maxWidth: '800px', margin: '0 auto'}}>
      <h1>API调试工具</h1>
      
      <div style={{marginTop: '20px', marginBottom: '20px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px'}}>
        <p>API调试功能暂时关闭，正在进行爬虫服务配置。</p>
        <p>完成后将重新启用此功能。</p>
      </div>
      
      <Link to="/" style={{
        color: '#3498db',
        textDecoration: 'none',
        fontWeight: '500',
        display: 'inline-block',
        marginTop: '20px'
      }}>
        返回首页
      </Link>
    </div>
  );
};

export default ApiDebugTool;