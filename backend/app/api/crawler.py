from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, HttpUrl
import asyncio
import logging

from ..db.database import get_db
from ..services.crawler import NewsCrawlerService
from ..services.scheduler import get_scheduler

# 配置日志
logger = logging.getLogger(__name__)

router = APIRouter()

# 请求模型
class CrawlUrlRequest(BaseModel):
    url: HttpUrl
    
# 创建服务实例
crawler_service = NewsCrawlerService()

@router.post("/crawler/url")
async def crawl_url(request: CrawlUrlRequest, background_tasks: BackgroundTasks):
    """爬取指定URL的新闻内容"""
    logger.info(f"收到爬取请求: {request.url}")
    
    # 使用后台任务处理爬取
    background_tasks.add_task(_process_url_crawl, str(request.url))
    
    return {
        "message": "URL爬取请求已接受，正在后台处理",
        "url": str(request.url)
    }

@router.post("/crawler/discover")
async def discover_news(background_tasks: BackgroundTasks):
    """触发新闻自动发现流程"""
    logger.info("收到新闻发现请求")
    
    # 使用后台任务处理发现
    background_tasks.add_task(_process_news_discovery)
    
    return {
        "message": "新闻发现流程已启动，正在后台处理"
    }

@router.get("/crawler/status")
async def get_crawler_status():
    """获取爬虫调度器状态"""
    try:
        scheduler = get_scheduler()
        status = scheduler.get_status()
        return {
            "scheduler_status": status,
            "message": "调度器状态获取成功"
        }
    except Exception as e:
        logger.error(f"获取调度器状态失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取状态失败: {str(e)}")

@router.post("/admin/crawl-now")
async def admin_crawl_now():
    """管理员触发立即爬取任务"""
    logger.info("管理员触发立即爬取")
    
    # 使用调度器的手动执行功能
    try:
        scheduler = get_scheduler()
        result = await scheduler.run_once()
        
        if result["success"]:
            return {
                "message": f"爬取任务完成，发现 {result['news_count']} 条新闻",
                "duration": result["duration"],
                "news_count": result["news_count"]
            }
        else:
            raise HTTPException(status_code=500, detail=result["error"])
    except Exception as e:
        logger.error(f"爬取任务失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"爬取任务失败: {str(e)}")

# 后台任务处理函数
async def _process_url_crawl(url: str):
    """处理URL爬取的后台任务"""
    try:
        logger.info(f"后台任务：开始爬取URL: {url}")
        result = await crawler_service.crawl_url(url)

        if result["success"]:
            title = result.get('title', '')
            content = result.get('content', '')

            # --- 修改：调用新的判断函数 ---
            is_relevant = await crawler_service.ai_service.is_relevant_content(title, content)
            if not is_relevant:
                logger.info(f"后台任务：内容被 LLM 判断为不相关，跳过: {url}")
                return # 直接返回，不进行后续处理
            # --- 结束修改 ---

            logger.info(f"后台任务：爬取URL成功，且判断为相关内容: {url}")
            # 准备数据并保存
            news_data = await crawler_service._prepare_news_data(result, source_name="Manual Submit")
            save_result = crawler_service._save_news(news_data)
            if save_result['success']:
                 logger.info(f"后台任务：手动提交的内容已保存: {save_result['news_id']}")
            else:
                 logger.error(f"后台任务：保存手动提交的内容失败: {url}, Error: {save_result.get('error')}")

        else:
            logger.error(f"后台任务：爬取URL失败: {url}, 错误: {result.get('error', '未知错误')}")
    except Exception as e:
        logger.error(f"后台任务：处理URL爬取时出错: {str(e)}", exc_info=True)

async def _process_news_discovery():
    """处理新闻发现的后台任务"""
    try:
        logger.info("开始新闻发现流程")
        results = await crawler_service.discover_news()
        logger.info(f"新闻发现完成，发现 {len(results)} 条新闻")
    except Exception as e:
        logger.error(f"新闻发现流程失败: {str(e)}")