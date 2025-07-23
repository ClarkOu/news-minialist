import asyncio
import logging
from datetime import datetime, timedelta
from typing import Optional
from .crawler import NewsCrawlerService

# 配置日志
logger = logging.getLogger(__name__)

class CrawlerScheduler:
    """爬虫调度器 - 负责定期执行爬虫任务"""
    
    def __init__(self, interval_hours: float = 1.5):
        """
        初始化调度器
        
        Args:
            interval_hours: 爬虫执行间隔（小时）
        """
        self.interval_hours = interval_hours
        self.crawler = NewsCrawlerService()
        self.is_running = False
        self.task: Optional[asyncio.Task] = None
        
        # 統計信息
        self.total_runs = 0
        self.successful_runs = 0
        self.failed_runs = 0
        self.last_run: Optional[datetime] = None
        self.next_run: Optional[datetime] = None
        
    async def start(self):
        """启动调度器"""
        if self.is_running:
            logger.warning("调度器已在运行中")
            return
            
        self.is_running = True
        logger.info(f"启动爬虫调度器，执行间隔: {self.interval_hours} 小时")
        
        # 创建后台任务
        self.task = asyncio.create_task(self._run_scheduler())
        
    async def stop(self):
        """停止调度器"""
        if not self.is_running:
            logger.warning("调度器未在运行")
            return
            
        self.is_running = False
        if self.task:
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass
                
        logger.info("爬虫调度器已停止")
        
    async def _run_scheduler(self):
        """调度器主循环"""
        while self.is_running:
            try:
                logger.info("开始执行定时爬虫任务")
                start_time = datetime.now()
                self.total_runs += 1
                
                # 执行爬虫任务
                results = await self.crawler.discover_news()
                
                end_time = datetime.now()
                duration = (end_time - start_time).total_seconds()
                self.last_run = end_time
                self.successful_runs += 1
                
                logger.info(f"爬虫任务完成，耗时: {duration:.2f}秒，处理了 {len(results)} 条新闻")
                
                # 計算下次執行時間
                self.next_run = datetime.now() + timedelta(hours=self.interval_hours)
                
                # 等待下次执行
                await asyncio.sleep(self.interval_hours * 3600)  # 转换为秒
                
            except asyncio.CancelledError:
                logger.info("调度器任务被取消")
                break
            except Exception as e:
                logger.error(f"调度器执行过程中发生错误: {e}", exc_info=True)
                self.failed_runs += 1
                # 发生错误时等待较短时间后重试
                await asyncio.sleep(300)  # 5分钟后重试
                
    async def run_once(self):
        """手动执行一次爬虫任务"""
        logger.info("手动触发爬虫任务")
        try:
            start_time = datetime.now()
            results = await self.crawler.discover_news()
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            
            logger.info(f"手动爬虫任务完成，耗时: {duration:.2f}秒，处理了 {len(results)} 条新闻")
            return {
                "success": True,
                "duration": duration,
                "news_count": len(results),
                "results": results
            }
        except Exception as e:
            logger.error(f"手动爬虫任务执行失败: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e)
            }
            
    def get_status(self):
        """获取调度器状态"""
        return {
            "running": self.is_running,
            "interval_hours": self.interval_hours,
            "total_runs": self.total_runs,
            "successful_runs": self.successful_runs,
            "failed_runs": self.failed_runs,
            "last_run": self.last_run.isoformat() if self.last_run else None,
            "next_run": self.next_run.isoformat() if self.next_run else None
        }

# 全局调度器实例
_scheduler_instance: Optional[CrawlerScheduler] = None

def get_scheduler() -> CrawlerScheduler:
    """获取全局调度器实例"""
    global _scheduler_instance
    if _scheduler_instance is None:
        _scheduler_instance = CrawlerScheduler()
    return _scheduler_instance

async def start_crawler_scheduler():
    """启动爬虫调度器（用于应用启动时调用）"""
    scheduler = get_scheduler()
    # 設置下次執行時間
    scheduler.next_run = datetime.now() + timedelta(hours=scheduler.interval_hours)
    await scheduler.start()

async def stop_crawler_scheduler():
    """停止爬虫调度器（用于应用关闭时调用）"""
    scheduler = get_scheduler()
    await scheduler.stop()