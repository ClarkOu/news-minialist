# 🚀 阿里云服务器部署指南（自定义端口版本）

**端口配置：**
- 前端：8001（避免与现有服务冲突）
- 后端：8005（避免与现有服务冲突）  
- Redis：6380（避免与现有服务冲突）

## 📦 步骤1：上传部署包

你现在有一个 **831KB** 的部署包：`news_minialist_deploy.tar.gz`

### 方法1：使用scp上传
```bash
# 在你的本地电脑运行
scp news_minialist_deploy.tar.gz root@你的阿里云IP:/root/
```

### 方法2：使用阿里云控制台上传
1. 登录阿里云控制台
2. 进入ECS实例
3. 使用"远程连接"功能
4. 上传文件到服务器

## 🛠️ 步骤2：登录阿里云服务器

```bash
# 替换为你的阿里云IP地址
ssh root@你的阿里云IP地址
```

## 📥 步骤3：解压和准备

```bash
# 解压部署包
cd /root
tar -xzf news_minialist_deploy.tar.gz

# 查看文件
ls -la

# 你应该看到这些文件：
# - docker-compose.yml
# - Dockerfile.backend
# - Dockerfile.frontend  
# - deploy.sh
# - backend/ 目录
# - frontend/ 目录
```

## 🐳 步骤4：安装Docker（如果还没安装）

```bash
# 安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.21.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version
```

## ⚙️ 步骤5：配置环境变量

```bash
# 编辑环境变量文件
nano .env

# 设置这些重要变量：
DATABASE_URL=sqlite:///./data/news.db
REDIS_URL=redis://redis:6379
OPENROUTER_API_KEY=你的OpenRouter_API密钥
OPENROUTER_MODEL_NAME=qwen/qwen2.5-vl-72b-instruct:free
SECRET_KEY=your_very_secure_secret_key_here
JWT_SECRET_KEY=your_jwt_secret_key_here
```

## 🚀 步骤6：一键部署

```bash
# 给部署脚本执行权限
chmod +x deploy.sh

# 运行部署脚本
./deploy.sh
```

## 🔍 步骤7：验证部署

```bash
# 检查容器状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 测试访问
curl http://localhost:8001
curl http://localhost:8005/api/health
```

## 🌐 步骤8：开放防火墙端口

### Ubuntu/Debian系统：
```bash
sudo ufw allow 8001
sudo ufw allow 8005
sudo ufw enable
```

### CentOS/RHEL系统：
```bash
sudo firewall-cmd --permanent --add-port=8001/tcp
sudo firewall-cmd --permanent --add-port=8005/tcp
sudo firewall-cmd --reload
```

### 阿里云安全组：
1. 登录阿里云控制台
2. 进入ECS实例详情
3. 点击"安全组" → "管理规则"
4. 添加入方向规则：
   - 端口范围：8001/8001，授权对象：0.0.0.0/0
   - 端口范围：8005/8005，授权对象：0.0.0.0/0

## 🎉 步骤9：访问你的网站

```
前端地址：http://你的阿里云IP:8001
后端API：http://你的阿里云IP:8005
```

## 🔧 常用管理命令

```bash
# 查看服务状态
docker-compose ps

# 重启服务
docker-compose restart

# 停止服务
docker-compose down

# 查看日志
docker-compose logs -f backend
docker-compose logs -f frontend

# 更新代码（如果有更新）
git pull
docker-compose up -d --build
```

## 📋 快速检查清单

- [ ] 阿里云服务器已准备
- [ ] Docker和Docker Compose已安装
- [ ] 部署包已上传并解压
- [ ] 环境变量已配置（特别是OPENROUTER_API_KEY）
- [ ] 防火墙端口已开放
- [ ] 阿里云安全组已配置
- [ ] 部署脚本已执行
- [ ] 前端和后端都可以访问

## ⚠️ 注意事项

1. **OpenRouter API密钥**：这是必须的，否则AI功能无法工作
2. **端口冲突**：确保8001和8005端口没有被其他服务占用
3. **内存要求**：建议至少2GB内存
4. **备份数据**：定期备份`data/`目录下的数据库

## 🚨 故障排除

### 如果部署失败：
```bash
# 查看详细错误日志
docker-compose logs

# 检查端口占用
netstat -tlnp | grep :8001
netstat -tlnp | grep :8005

# 重新构建
docker-compose down
docker-compose up -d --build
```

### 如果无法访问网站：
1. 检查阿里云安全组设置
2. 检查服务器防火墙
3. 确认服务正在运行：`docker-compose ps`

部署成功后，你的新闻聚合网站就在线了！🎉
