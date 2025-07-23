
import React, { useEffect, useState } from 'react';
import { Card, Spin, message, Button, List, Input, DatePicker } from 'antd';
import { getUser } from '../utils/auth';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  fetchCategories, fetchUserSubscriptions, subscribeCategory, unsubscribeCategory,
  fetchSources, addSource, subscribeSource, unsubscribeSource, fetchUserSourceSubscriptions, fetchHistory,
  fetchNews, fetchCurrentUser
} from '../services/api';
import './UserCenter.css';


const UserCenter = () => {
  // 信息源相关
  const [sources, setSources] = useState([]);
  const [userSourceSubs, setUserSourceSubs] = useState([]);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [addSourceForm, setAddSourceForm] = useState({ name: '', url: '', description: '' });
  const [addSourceLoading, setAddSourceLoading] = useState(false);

  // 订阅相关
  const [categories, setCategories] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [subLoading, setSubLoading] = useState(false);

  // 用户信息和历史
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [filterKeyword, setFilterKeyword] = useState('');
  const [filterDateRange, setFilterDateRange] = useState([]);

  // 訂閱內容新聞
  const [subscribedNews, setSubscribedNews] = useState([]);
  const [subscribedNewsLoading, setSubscribedNewsLoading] = useState(false);
  // 拉取訂閱內容新聞
  useEffect(() => {
    if (!subscriptions.length || !userInfo?.id) {
      setSubscribedNews([]);
      return;
    }
    setSubscribedNewsLoading(true);
    const params = { category: subscriptions.join(','), limit: 20 };
    fetchNews(params)
      .then(res => setSubscribedNews(res))
      .catch(() => setSubscribedNews([]))
      .finally(() => setSubscribedNewsLoading(false));
  }, [subscriptions, userInfo?.id]);

  const navigate = useNavigate();

  // 统一用 /api/me 获取的 userInfo.id 拉取所有数据
  useEffect(() => {
    if (!userInfo?.id) return;
    // 频道订阅
    (async () => {
      try {
        const [cats, subs] = await Promise.all([
          fetchCategories(),
          fetchUserSubscriptions(userInfo.id)
        ]);
        setCategories(cats);
        setSubscriptions(subs.map(s => s.category_id));
      } catch {}
    })();
    // 信息源订阅
    (async () => {
      setSourceLoading(true);
      try {
        const [srcs, subs] = await Promise.all([
          fetchSources(),
          fetchUserSourceSubscriptions(userInfo.id)
        ]);
        setSources(srcs);
        setUserSourceSubs(subs.map(s => s.source_id));
      } catch {} finally {
        setSourceLoading(false);
      }
    })();
    // 浏览历史
    (async () => {
      setHistoryLoading(true);
      try {
        const his = await fetchHistory(userInfo.id);
        setHistory(his);
      } catch {}
      setHistoryLoading(false);
    })();
  }, [userInfo?.id]);


  // 订阅/取消订阅操作
  const handleSubscribe = async (categoryId, isSubscribed) => {
    const localUser = getUser();
    if (!localUser?.id) return message.error('请先登录');
    setSubLoading(true);
    try {
      if (isSubscribed) {
        await unsubscribeCategory(localUser.id, categoryId);
        setSubscriptions(subscriptions.filter(cid => cid !== categoryId));
        message.success('取消订阅成功');
      } else {
        await subscribeCategory(localUser.id, categoryId);
        setSubscriptions([...subscriptions, categoryId]);
        message.success('订阅成功');
      }
    } catch (e) {
      message.error(e.message || '操作失败');
    } finally {
      setSubLoading(false);
    }
  };

  // 订阅/取消订阅信息源
  const handleSourceSubscribe = async (sourceId, isSubscribed) => {
    const localUser = getUser();
    if (!localUser?.id) return message.error('请先登录');
    setSourceLoading(true);
    try {
      if (isSubscribed) {
        await unsubscribeSource(localUser.id, sourceId);
        setUserSourceSubs(userSourceSubs.filter(id => id !== sourceId));
        message.success('取消订阅成功');
      } else {
        await subscribeSource(localUser.id, sourceId);
        setUserSourceSubs([...userSourceSubs, sourceId]);
        message.success('订阅成功');
      }
    } catch (e) {
      message.error(e.message || '操作失败');
    } finally {
      setSourceLoading(false);
    }
  };

  // 获取用户信息
  useEffect(() => {
    const fetchUser = async () => {
      try {
        // 总是从后端拉取最新用户信息
        const userData = await fetchCurrentUser();
        setUserInfo(userData);
        // 可选：同步到本地存储
        // localStorage.setItem('user', JSON.stringify(userData));
      } catch (err) {
        message.error('获取用户信息失败');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  // 添加信息源
  const handleAddSource = async () => {
    if (!addSourceForm.name || !addSourceForm.url) {
      return message.error('请填写名称和URL');
    }
    setAddSourceLoading(true);
    try {
      await addSource(addSourceForm.name, addSourceForm.url, addSourceForm.description);
      message.success('添加成功');
      setAddSourceForm({ name: '', url: '', description: '' });
      // 刷新信息源列表
      const srcs = await fetchSources();
      setSources(srcs);
    } catch (e) {
      message.error(e.message || '添加失败');
    } finally {
      setAddSourceLoading(false);
    }
  };

  // 浏览历史筛选逻辑
  const filteredHistory = history.filter(item => {
    const matchKeyword =
      !filterKeyword ||
      item.title.includes(filterKeyword) ||
      (item.summary && item.summary.includes(filterKeyword));
    const matchDate =
      !filterDateRange.length ||
      (item.viewed_at &&
        dayjs(item.viewed_at).isAfter(filterDateRange[0], 'day') &&
        dayjs(item.viewed_at).isBefore(filterDateRange[1], 'day'));
    return matchKeyword && matchDate;
  });

  // 头像首字母
  const getAvatar = () => {
    if (userInfo?.username) return userInfo.username[0].toUpperCase();
    if (userInfo?.email) return userInfo.email[0].toUpperCase();
    return '?';
  };

  return (
    <div className="user-center-bg">
      <div className="uc-main">
        <div className="uc-left">
          <Card className="uc-card">
            <div className="uc-user">
              <div className="uc-avatar">{getAvatar()}</div>
              <div className="uc-user-info">
                <div className="name">{userInfo?.username || '-'}</div>
                <div className="email">{userInfo?.email || '-'}</div>
                <div className="date">注册时间：{userInfo?.created_at ? new Date(userInfo.created_at).toLocaleString() : '-'}</div>
              </div>
              <Button type="link" onClick={() => navigate('/')} style={{ marginLeft: 'auto', fontWeight: 500 }}>返回首页</Button>
            </div>
          </Card>

          <Card className="uc-card">
            <div className="uc-section-title">我的订阅频道</div>
            {categories.length === 0 ? (
              <Spin />
            ) : (
              <div className="uc-tags">
                {categories.map(cat => {
                  const isSubscribed = subscriptions.includes(cat.id);
                  return (
                    <div
                      key={cat.id}
                      className={`uc-tag${isSubscribed ? ' subscribed' : ''}`}
                      style={{ cursor: subLoading ? 'not-allowed' : 'pointer' }}
                      onClick={() => !subLoading && handleSubscribe(cat.id, isSubscribed)}
                    >
                      {cat.name} {isSubscribed ? '✓' : ''}
                    </div>
                  );
                })}
              </div>
            )}
            <div className="uc-feedback">点击频道标签可订阅/取消订阅</div>
          </Card>

          <Card className="uc-card">
            <div className="uc-section-title">我的信息源</div>
            <div className="uc-add-source-row">
              <Input
                placeholder="信息源名称"
                value={addSourceForm.name}
                onChange={e => setAddSourceForm(f => ({ ...f, name: e.target.value }))}
                disabled={addSourceLoading}
              />
              <Input
                placeholder="信息源URL"
                value={addSourceForm.url}
                onChange={e => setAddSourceForm(f => ({ ...f, url: e.target.value }))}
                disabled={addSourceLoading}
              />
              <Input
                placeholder="描述(可选)"
                value={addSourceForm.description}
                onChange={e => setAddSourceForm(f => ({ ...f, description: e.target.value }))}
                disabled={addSourceLoading}
              />
              <Button type="primary" loading={addSourceLoading} onClick={handleAddSource}>添加</Button>
            </div>
            {sourceLoading ? (
              <Spin />
            ) : (
              <div className="uc-tags">
                {sources.map(src => {
                  const isSubscribed = userSourceSubs.includes(src.id);
                  return (
                    <div
                      key={src.id}
                      className={`uc-tag${isSubscribed ? ' subscribed-success' : ''}`}
                      style={{ cursor: sourceLoading ? 'not-allowed' : 'pointer' }}
                      onClick={() => !sourceLoading && handleSourceSubscribe(src.id, isSubscribed)}
                    >
                      {src.name} {isSubscribed ? '✓' : ''}
                    </div>
                  );
                })}
              </div>
            )}
            <div className="uc-feedback">点击信息源标签可订阅/取消订阅</div>
          </Card>
        </div>
        <div className="uc-right">
          <Card className="uc-card">
            <div className="uc-section-title">我的訂閱內容</div>
            <div className="uc-feedback" style={{marginBottom:8}}>來自你訂閱的頻道和信息源</div>
            <div className="uc-history-list">
              {subscribedNewsLoading ? (
                <Spin size="large" style={{ display: 'block', margin: '40px auto' }} />
              ) : subscribedNews.length === 0 ? (
                <div className="uc-feedback">暫無內容</div>
              ) : (
                <List
                  itemLayout="vertical"
                  dataSource={subscribedNews}
                  renderItem={item => (
                    <div className="uc-history-item" key={item.id}>
                      <div className="uc-history-title">{item.title}
                        {item.published_at && <span className="uc-history-date">發布於 {new Date(item.published_at).toLocaleString()}</span>}
                      </div>
                      <div className="uc-history-summary">{item.summary}</div>
                    </div>
                  )}
                />
              )}
            </div>
          </Card>
          <Card className="uc-card">
            <div className="uc-section-title">浏览历史</div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
              <Input
                placeholder="搜索标题/摘要"
                allowClear
                value={filterKeyword}
                onChange={e => setFilterKeyword(e.target.value)}
                style={{ width: 180 }}
              />
              <DatePicker.RangePicker
                value={filterDateRange}
                onChange={setFilterDateRange}
                style={{ width: 220 }}
                allowClear
              />
            </div>
            <div className="uc-history-list">
              {historyLoading ? (
                <Spin size="large" style={{ display: 'block', margin: '40px auto' }} />
              ) : filteredHistory.length === 0 ? (
                <div className="uc-feedback">暂无浏览历史</div>
              ) : (
                <List
                  itemLayout="vertical"
                  dataSource={filteredHistory}
                  renderItem={item => (
                    <div className="uc-history-item" key={item.news_id}>
                      <div className="uc-history-title">{item.title}
                        <span className="uc-history-date">{item.viewed_at ? `浏览于 ${new Date(item.viewed_at).toLocaleString()}` : ''}</span>
                      </div>
                      <div className="uc-history-summary">{item.summary}</div>
                    </div>
                  )}
                />
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserCenter;
