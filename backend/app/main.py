from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import uvicorn
import logging

from app.api import news, categories, crawler, user, history
from app.api import source
from app.api import subscription
from app.services.scheduler import start_crawler_scheduler, stop_crawler_scheduler
from app.db.database import create_tables

# 配置日志
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# 创建FastAPI实例
app = FastAPI(title="新闻聚合API", description="新闻聚合和爬虫服务API")

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应替换为实际前端域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(news.router, prefix="/api")
app.include_router(categories.router, prefix="/api")
app.include_router(crawler.router, prefix="/api")
app.include_router(user.router, prefix="/api")
app.include_router(history.router, prefix="/api/history")
app.include_router(source.router, prefix="/api")
app.include_router(subscription.router, prefix="/api")

@app.on_event("startup")
async def startup_event():
    """应用启动时执行的操作"""
    # 创建数据库表
    create_tables()
    
    # 启动爬虫调度器
    await start_crawler_scheduler()
    logger.info("爬虫调度器已启动，将每1.5小时自动执行一次")

@app.on_event("shutdown")
async def shutdown_event():
    """应用关闭时执行的操作"""
    # 停止爬虫调度器
    await stop_crawler_scheduler()
    logger.info("爬虫调度器已关闭")

@app.get("/")
async def root():
    """根路由，API健康检查"""
    return {
        "message": "新闻聚合API已启动",
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/health")
async def health_check():
    """健康检查端点"""
    return {
        "status": "healthy",
        "service": "news-minimalist-backend",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)