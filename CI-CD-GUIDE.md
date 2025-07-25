# CI/CD 自动部署指南

## 🎯 什么是CI/CD？

**CI/CD**是现代软件开发的自动化流程：

- **CI (持续集成)**：自动测试代码、检查质量
- **CD (持续部署)**：自动构建、部署到服务器

## 📊 传统部署 vs CI/CD对比

### 传统方式（繁琐）：
```bash
1. 本地修改代码
2. 手动上传到服务器
3. 登录服务器
4. 手动停止服务
5. 手动构建项目
6. 手动启动服务
7. 手动测试是否正常
```
**问题**：容易出错、耗时、重复劳动

### CI/CD方式（智能）：
```bash
1. 本地修改代码
2. git push （推送代码）
3. 🤖 自动测试
4. 🤖 自动构建  
5. 🤖 自动部署
6. 🤖 自动检查
7. 📧 通知结果
```
**优势**：快速、可靠、无人值守

## 🛠️ 为你的项目配置CI/CD

### 步骤1：在GitHub仓库设置密钥

1. 进入你的GitHub仓库
2. 点击 `Settings` → `Secrets and variables` → `Actions`
3. 添加以下密钥：

```
ALIYUN_HOST = 你的阿里云服务器IP地址
ALIYUN_USERNAME = 服务器用户名 (通常是root或ubuntu)
ALIYUN_SSH_KEY = 你的SSH私钥内容
ALIYUN_PORT = SSH端口 (通常是22)
```

### 步骤2：获取SSH私钥

**如果你还没有SSH密钥，创建一个：**

```bash
# 在你的本地电脑执行
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# 查看公钥（要添加到服务器）
cat ~/.ssh/id_rsa.pub

# 查看私钥（要添加到GitHub Secrets）
cat ~/.ssh/id_rsa
```

**将公钥添加到阿里云服务器：**

```bash
# 在阿里云服务器执行
mkdir -p ~/.ssh
echo "你的公钥内容" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

### 步骤3：推送代码触发部署

有两种方式触发自动部署：

#### 方式1：标签部署（推荐）
```bash
# 创建并推送标签
git tag aliyun-v1.0.0
git push origin aliyun-v1.0.0
```

#### 方式2：手动触发
1. 进入GitHub仓库
2. 点击 `Actions` 标签
3. 选择 `Deploy to Aliyun Server`
4. 点击 `Run workflow`

## 📱 CI/CD流程图

```
开发者推送代码
       ↓
   GitHub Actions
       ↓
   自动测试代码
       ↓
   构建前端项目
       ↓
   连接阿里云服务器
       ↓
   拉取最新代码
       ↓
   Docker构建镜像
       ↓
   启动新容器
       ↓
   健康检查
       ↓
   发送通知
```

## 🔧 CI/CD配置说明

### 触发条件：
- 推送标签：`aliyun-*` （如 aliyun-v1.0.0）
- 手动触发：在GitHub Actions页面手动运行

### 自动执行内容：
1. **代码检查**：检查前端和后端代码质量
2. **构建测试**：确保项目能正常构建
3. **服务器连接**：SSH连接到阿里云服务器
4. **代码更新**：拉取最新代码
5. **Docker构建**：构建新的容器镜像
6. **服务部署**：停止旧服务，启动新服务
7. **健康检查**：验证服务是否正常运行
8. **结果通知**：报告部署结果

## 🚀 使用CI/CD的好处

### 1. **提高效率**
- 几分钟内完成部署
- 无需手动操作
- 可以同时部署多个环境

### 2. **减少错误**
- 标准化部署流程
- 自动化测试
- 回滚功能

### 3. **版本管理**
- 每次部署都有记录
- 可以轻松回到之前版本
- 部署历史追踪

### 4. **团队协作**
- 多人开发时避免冲突
- 统一的部署标准
- 权限管理

## 📋 常用操作

### 查看部署状态
1. 进入GitHub仓库
2. 点击 `Actions` 标签
3. 查看最新的工作流运行状态

### 部署新版本
```bash
# 提交代码
git add .
git commit -m "新功能：添加用户管理"
git push

# 创建部署标签
git tag aliyun-v1.0.1
git push origin aliyun-v1.0.1
```

### 回滚到之前版本
```bash
# 创建回滚标签，指向之前的提交
git tag aliyun-rollback-v1.0.0 <之前的commit_hash>
git push origin aliyun-rollback-v1.0.0
```

## 🔍 故障排除

### 部署失败怎么办？
1. 查看GitHub Actions的错误日志
2. 检查服务器连接是否正常
3. 验证环境变量配置
4. 检查服务器磁盘空间

### 常见问题：
- **SSH连接失败**：检查密钥配置
- **Docker构建失败**：检查Dockerfile语法
- **服务启动失败**：检查环境变量和端口

## 🎉 总结

设置CI/CD后，你的开发流程将变成：

```
写代码 → git push → 喝咖啡 ☕ → 部署完成 🎉
```

再也不用担心：
- ❌ 忘记上传某个文件
- ❌ 服务器操作出错
- ❌ 部署过程太复杂
- ❌ 回滚困难

一切都自动化了！🚀
