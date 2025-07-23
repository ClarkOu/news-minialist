// frontend/src/components/Header.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css';

const Header = ({ categories = [] }) => {
  const navigate = useNavigate();
  
  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo">
            <h1>全球新闻聚合</h1>
          </Link>
          
          <nav className="navigation">
            <ul className="nav-menu">
              <li>
                <Link to="/" className="nav-link">首页</Link>
              </li>
              <li className="dropdown">
                <button className="dropdown-toggle">分类</button>
                <div className="dropdown-menu">
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      to={`/category/${category.name}`}
                      className="dropdown-item"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              </li>
              <li>
                <Link to="/crawler" className="nav-link">内容爬取</Link>
             </li>
              <li>
                <Link to="/admin" className="nav-link">管理面板</Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;