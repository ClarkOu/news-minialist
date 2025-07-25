
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../services/api';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const Register = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    setSuccess('');
    try {
      await registerUser(values.username, values.email, values.password);
      setSuccess('注册成功，请登录！');
      message.success('注册成功，请登录！');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      message.error(err.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f6f8fa' }}>
      <Card style={{ width: 400, borderRadius: 12, boxShadow: '0 2px 16px #0001' }}>
        <Title level={2} style={{ textAlign: 'center', marginBottom: 28 }}>用户注册</Title>
        <Form name="register" onFinish={onFinish} layout="vertical" autoComplete="off">
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}> 
            <Input prefix={<UserOutlined />} placeholder="用户名" size="large" />
          </Form.Item>
          <Form.Item name="email" rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '邮箱格式不正确' }]}> 
            <Input prefix={<MailOutlined />} placeholder="邮箱" size="large" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}> 
            <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" block loading={loading} style={{ borderRadius: 6 }}>注册</Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <Text type="secondary">已有账号？</Text>
          <Link to="/login" style={{ marginLeft: 4 }}>登录</Link>
        </div>
      </Card>
    </div>
  );
};

export default Register;
