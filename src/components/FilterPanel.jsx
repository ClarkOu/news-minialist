// src/components/FilterPanel.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './FilterPanel.css';

const FilterPanel = ({ filters, onFilterChange }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [localFilters, setLocalFilters] = useState({
    minScore: filters.minScore || 0,
    days: filters.days || 7
  });
  
  // 从URL初始化筛选参数
  useEffect(() => {
    const minScoreParam = searchParams.get('min_score');
    const daysParam = searchParams.get('days');
    
    if (minScoreParam || daysParam) {
      const updatedFilters = { ...localFilters };
      if (minScoreParam) updatedFilters.minScore = parseFloat(minScoreParam);
      if (daysParam) updatedFilters.days = parseInt(daysParam, 10);
      setLocalFilters(updatedFilters);
    }
  }, []);

  // 更新分数
  const handleScoreChange = (value) => {
    const newFilters = { ...localFilters, minScore: value };
    setLocalFilters(newFilters);
    updateFilters(newFilters, true);
  };

  // 更新时间范围
  const handleDaysChange = (days) => {
    const newFilters = { ...localFilters, days };
    setLocalFilters(newFilters);
    updateFilters(newFilters, true);
  };
  
  // 更新过滤器和URL
  const updateFilters = (newFilters, resetPage = false) => {
    const newSearchParams = new URLSearchParams();
    if (newFilters.minScore > 0) {
      newSearchParams.set('min_score', newFilters.minScore);
    }
    if (newFilters.days !== 7) {
      newSearchParams.set('days', newFilters.days);
    }
    setSearchParams(newSearchParams);
    // 保证传递完整结构，重置分页参数
    onFilterChange({
      minScore: newFilters.minScore,
      days: newFilters.days,
      limit: filters.limit || 20,
      skip: 0 // 切换筛选条件时重置分页
    });
  };
  
  return (
    <div className="filter-panel-horizontal">
      <div className="filter-row">
        <div className="filter-group score-group">
          <label className="filter-label">重要性: {localFilters.minScore > 0 ? localFilters.minScore : '全部'}</label>
          <input
            type="range"
            className="score-slider"
            min="0"
            max="10"
            step="0.5"
            value={localFilters.minScore}
            onChange={(e) => handleScoreChange(parseFloat(e.target.value))}
          />
        </div> 
        
        <div className="filter-group time-group">
          <label className="filter-label">时间范围:</label>
          <div className="time-buttons">
            <button 
              className={`time-button ${localFilters.days === 1 ? 'active' : ''}`} 
              onClick={() => handleDaysChange(1)}>
              今天
            </button>
            <button 
              className={`time-button ${localFilters.days === 3 ? 'active' : ''}`}
              onClick={() => handleDaysChange(3)}>
              3天
            </button>
            <button 
              className={`time-button ${localFilters.days === 7 ? 'active' : ''}`}
              onClick={() => handleDaysChange(7)}>
              7天
            </button>
            <button 
              className={`time-button ${localFilters.days === 30 ? 'active' : ''}`}
              onClick={() => handleDaysChange(30)}>
              30天
            </button>
          </div>
        </div>
        
        {(localFilters.minScore > 0 || localFilters.days !== 7) && (
          <button 
            className="reset-button"
            onClick={() => {
              setLocalFilters({ minScore: 0, days: 7 });
              setSearchParams({});
              onFilterChange({ minScore: 0, days: 7 });
            }}>
            重置
          </button>
        )}
      </div>
    </div>
  );
};

export default FilterPanel;