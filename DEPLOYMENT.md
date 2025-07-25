# News Minimalist 云服务器部署指南

## 🚀 快速部署

### 前置条件
1. 一台云服务器（推荐配置：2核4G内存，至少20GB磁盘空间）
2. 已安装 Docker 和 Docker Compose
3. 开放端口：80（前端）、8000（后端API）、6379（Redis，可选）

### 步骤1: 准备服务器环境

```bash
# 更新系统包
sudo apt update && sudo apt upgrade -y

# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.21.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 将用户添加到 docker 组
sudo usermod -aG docker $USER
```

### 步骤2: 上传项目文件

将整个项目文件夹上传到服务器，或使用 git clone：

```bash
# 使用 git 克隆（推荐）
git clone https://github.com/ClarkOu/news-minialist.git
cd news-minialist

# 或者直接上传项目文件夹
scp -r news_minialist_副本2/ user@your-server-ip:/path/to/deployment/
```

### 步骤3: 配置环境变量

```bash
# 复制环境变量模板
cp .env.production .env

# 编辑环境变量文件
nano .env
```

**重要配置项：**
- `OPENROUTER_API_KEY`: 你的 OpenRouter API 密钥
- `SECRET_KEY`: 应用程序密钥（随机生成）
- `JWT_SECRET_KEY`: JWT 签名密钥（随机生成）

### 步骤4: 运行部署脚本

```bash
# 给脚本执行权限
chmod +x deploy.sh

# 执行部署
./deploy.sh
```

### 步骤5: 配置防火墙

```bash
# Ubuntu/Debian
sudo ufw allow 80
sudo ufw allow 8000
sudo ufw enable

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=8000/tcp
sudo firewall-cmd --reload
```

## 🔧 高级配置

### SSL/HTTPS 配置

如果需要 HTTPS，可以使用 Let's Encrypt：

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取 SSL 证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo crontab -e
# 添加: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 域名配置

1. 将域名 A 记录指向服务器 IP
2. 更新 nginx 配置中的 `server_name`
3. 重启前端容器

### 数据库持久化

项目已配置数据持久化：
- 数据库文件：`./data/news.db`
- Redis 数据：Docker volume `redis_data`
- 日志文件：`./logs/`

### 性能优化

1. **增加内存限制：**
```yaml
# docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
```

2. **配置日志轮转：**
```bash
# /etc/logrotate.d/news-minialist
/path/to/project/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    notifempty
    create 644 root root
}
```

## 📋 常用操作命令

### 服务管理
```bash
# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
docker-compose logs -f backend
docker-compose logs -f frontend

# 重启服务
docker-compose restart
docker-compose restart backend

# 停止服务
docker-compose down

# 重新构建并启动
docker-compose up -d --build
```

### 数据库操作
```bash
# 进入后端容器
docker-compose exec backend bash

# 备份数据库
cp data/news.db backups/news_backup_$(date +%Y%m%d).db

# 查看数据库
sqlite3 data/news.db
```

### 监控和维护
```bash
# 查看系统资源使用
docker stats

# 清理无用的 Docker 镜像
docker system prune -a

# 查看磁盘使用
df -h
du -sh data/ logs/ backups/
```

## 🚨 故障排除

### 常见问题

1. **前端无法访问后端API**
   - 检查防火墙设置
   - 确认容器间网络连接
   - 查看 nginx 配置

2. **数据库连接失败**
   - 检查数据目录权限
   - 确认数据库文件路径
   - 查看后端日志

3. **OpenRouter API 错误**
   - 验证 API 密钥
   - 检查配额和余额
   - 查看请求频率限制

4. **内存不足**
   - 监控容器内存使用
   - 考虑增加交换空间
   - 优化爬虫并发数

### 日志查看
```bash
# 查看应用日志
docker-compose logs -f --tail=100 backend

# 查看 nginx 日志
docker-compose exec frontend tail -f /var/log/nginx/access.log
docker-compose exec frontend tail -f /var/log/nginx/error.log

# 查看系统日志
sudo journalctl -u docker.service
```

## 🔐 安全建议

1. **更改默认密码和密钥**
2. **定期更新 Docker 镜像**
3. **配置防火墙规则**
4. **启用日志监控**
5. **定期备份数据**

## 📞 技术支持

如果遇到部署问题，请：

1. 查看本指南的故障排除部分
2. 检查 Docker 容器日志
3. 确认环境变量配置
4. 验证网络连接和防火墙设置

部署成功后，访问 `http://your-server-ip` 即可使用 News Minimalist！
