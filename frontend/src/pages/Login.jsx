
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { setUser } from '../utils/auth';
import { loginUser } from '../services/api';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';


const { Title, Text } = Typography;

const Login = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await loginUser(values.username, values.password);
      // loginUser已經在api.js中處理了token存儲，這裡只需要觸發狀態更新
      const userWithToken = {
        ...res.user,
        access_token: res.access_token,
        token_type: res.token_type
      };
      setUser(userWithToken);
      if (onLogin) onLogin(userWithToken);
      message.success('登录成功！');
      navigate('/');
    } catch (err) {
      message.error(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f6f8fa' }}>
      <Card style={{ width: 380, borderRadius: 12, boxShadow: '0 2px 16px #0001' }}>
        <Title level={2} style={{ textAlign: 'center', marginBottom: 28 }}>用户登录</Title>
        <Form name="login" onFinish={onFinish} layout="vertical" autoComplete="off">
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}> 
            <Input prefix={<UserOutlined />} placeholder="用户名" size="large" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}> 
            <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" block loading={loading} style={{ borderRadius: 6 }}>登录</Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <Text type="secondary">没有账号？</Text>
          <Link to="/register" style={{ marginLeft: 4 }}>注册</Link>
        </div>
      </Card>
    </div>
  );
};

export default Login;
