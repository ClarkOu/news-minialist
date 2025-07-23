import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 数据库配置
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./news.db")

# Redis配置
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

# 爬虫配置
CRAWLER_USER_AGENT = os.getenv("CRAWLER_USER_AGENT", "NewsMinimalist/1.0")
CRAWLER_REQUEST_TIMEOUT = int(os.getenv("CRAWLER_REQUEST_TIMEOUT", "30"))
CRAWLER_HEADLESS = os.getenv("CRAWLER_HEADLESS", "True").lower() == "true"

# --- 新增 OpenRouter 配置 ---
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
# 推荐使用一个性价比较高的模型，例如 mistralai/mistral-7b-instruct
# 你可以根据需要选择其他模型: https://openrouter.ai/docs#models
OPENROUTER_MODEL_NAME = os.getenv("OPENROUTER_MODEL_NAME", "qwen/qwen2.5-vl-72b-instruct:free")
# --- 结束新增 ---

# 新闻源配置
NEWS_SOURCES = [
    {"name": "BBC中文网", "url": "https://www.bbc.com/zhongwen/simp", "category": "国际"}, 
    {"name": "路透社", "url": "https://www.reuters.com/", "category": "财经"},            
    {"name": "华尔街日报", "url": "https://cn.wsj.com/", "category": "财经"},            
    {"name": "36氪", "url": "https://36kr.com/", "category": "科技"},                  
    {"name": "TechCrunch", "url": "https://techcrunch.com/", "category": "科技"},        
    {"name": "虎嗅", "url": "https://www.huxiu.com/", "category": "科技"},               
    {"name": "钛媒体", "url": "https://www.tmtpost.com/", "category": "科技"},          
    {"name": "品玩", "url": "https://www.pingwest.com/", "category": "科技"},            
    {"name": "极客公园", "url": "https://www.geekpark.net/", "category": "科技"},         
    {"name": "晚点LatePost", "url": "https://www.latepost.com/", "category": "商业"},    
    {"name": "动脉网", "url": "https://www.vbdata.cn/", "category": "健康"},             
    {"name": "新消费Daily", "url": "https://www.newconsumption.cn/", "category": "商业"}, 
    {"name": "VentureBeat", "url": "https://venturebeat.com/", "category": "科技"},     
    {"name": "Tech in Asia", "url": "https://www.techinasia.com/", "category": "科技"},  
    {"name": "Rest of World", "url": "https://restofworld.org/", "category": "国际"},   
    {"name": "IT桔子", "url": "https://www.itjuzi.com/", "category": "商业"},            
    {"name":"AI快訊", "url":"https://ai-bot.cn/daily-ai-news/", "category": "科技"},     
]

# API配置
API_PREFIX = "/api"