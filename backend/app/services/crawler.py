import asyncio
from datetime import datetime
import logging
import re
from sqlalchemy.orm import Session
from typing import Dict, List, Optional

from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig

from ..db.database import SessionLocal
from ..models.news import News
from ..models.category import Category
from ..services.ai_processor import OpenRouterService 
from ..config import NEWS_SOURCES, CRAWLER_HEADLESS
from urllib.parse import urljoin, urlparse
from ..models.source import Source

# 配置日志
logger = logging.getLogger(__name__)

class NewsCrawlerService:
    """新闻爬虫服务"""
    
    def __init__(self):
        self.ai_service = OpenRouterService()
    
    async def crawl_url(self, url: str) -> Dict:
        """爬取单个URL (使用 AI 提取)"""
        logger.info(f"开始使用 AI 提取爬取URL: {url}")
        
        # 配置浏览器
        browser_config = BrowserConfig(headless=CRAWLER_HEADLESS)

        # 配置爬取运行参数 (移除 llm_config)
        run_config = CrawlerRunConfig(
            page_timeout=120000, # 恢复之前的超时时间
            wait_until='networkidle'
            # 移除 llm_config
        )

        try:
            # 使用异步爬虫爬取URL
            async with AsyncWebCrawler(config=browser_config) as crawler:
                # --- 修改：移除 arun 中的 llm_extraction 和 llm_config ---
                result = await crawler.arun(
                    url,
                    config=run_config # 只传入 run_config
                )
                # --- 结束修改 ---
                return self._process_crawl_result(result, url)
        except Exception as e:
            logger.error(f"爬取时发生错误: {e}", exc_info=True)
            return {"success": False, "error": str(e)}
            
    def _process_crawl_result(self, result, url) -> Dict:
        """处理爬取结果"""
        if not result.success:
            error_msg = result.error_message if hasattr(result, "error_message") else "爬取失败"
            logger.error(f"URL {url} 爬取失败: {error_msg}")
            return {"success": False, "error": error_msg}

        try:
            # 提取标题和内容 (现在 content 应该是 AI 提取的结果)
            title = result.metadata.get("title", "") if hasattr(result, "metadata") else ""
            content = result.markdown.raw_markdown if hasattr(result, "markdown") and result.markdown else ""

            # --- 修改日志并增加内容检查 ---
            logger.info(f"URL {url} - AI 提取到的完整 Markdown 内容 (前 1000 字符): {content[:1000]}...")
            # 增加对空内容或过短内容的检查
            if not title or not content or content.strip() == "" or len(content.strip()) < 50: # 增加一个最小长度判断 (例如 50 字符)
                logger.warning(f"URL {url} AI 提取内容不完整或过短: 标题='{title}', 内容长度={len(content.strip())}")
                return {"success": False, "error": "AI 提取的内容不完整或过短"}
            # --- 结束修改 ---

            logger.info(f"URL {url} AI 提取成功: 标题 '{title}'")

            return {
                "success": True,
                "title": title,
                "content": content, # 这是 AI 提取的内容
                "url": url,
                "raw_html": result.html if hasattr(result, "html") else "" # 原始 HTML 仍然可用
            }
        except Exception as e:
            logger.error(f"处理 AI 提取结果时出错: {e}", exc_info=True)
            return {"success": False, "error": f"处理 AI 提取结果时出错: {str(e)}"}
    
    async def discover_news(self) -> List[Dict]:
        """从预设新闻源发现新闻，并爬取文章"""
        logger.info("开始新闻发现流程")
        saved_news_list = []
        sources = self._get_news_sources()

        for source in sources:
            logger.info(f"处理新闻源: {source['name']} ({source['url']})")
            try:
                # 1. 爬取新闻源首页以获取链接 (不使用 AI 提取)
                browser_config = BrowserConfig(headless=CRAWLER_HEADLESS)
                # --- 恢复使用 CrawlerRunConfig ---
                homepage_run_config = CrawlerRunConfig(
                    page_timeout=90000
                )
                async with AsyncWebCrawler(config=browser_config) as crawler:
                    homepage_result = await crawler.arun(source['url'], config=homepage_run_config)
                # --- 结束恢复 ---

                # ... (检查链接提取是否成功) ...
                if not homepage_result.success or not hasattr(homepage_result, 'links') or not homepage_result.links:
                     logger.warning(f"爬取新闻源 {source['name']} 或提取链接失败。...")
                     continue
                # ... (日志记录原始链接) ...

                 # 2. 提取并筛选文章链接 (逻辑不变)
                article_links = self._extract_article_links(homepage_result.links, source['url'])
                logger.info(f"从 {source['name']} 提取到 {len(article_links)} 个潜在文章链接")

                 # 3. 遍历并创建处理任务
                tasks = []
                for link_url in article_links[:10]: # 限制每次处理的文章数量
                    if not self._is_url_processed(link_url):
                        tasks.append(self._process_single_article(link_url, source['name'], source['category']))
                    else:
                        logger.info(f"跳过已处理的URL: {link_url}")

                # 并发执行所有文章处理任务并等待结果
                if tasks:
                    logger.info(f"开始并发处理 {len(tasks)} 篇文章...")
                    results = await asyncio.gather(*tasks, return_exceptions=True)
                    logger.info(f"文章处理完成，结果数量: {len(results)}")

                    # 处理结果 (可选，可以记录成功/失败)
                    for result in results:
                        if isinstance(result, Exception):
                            logger.error(f"处理单个文章时发生异常: {result}", exc_info=result)
                        elif result and result.get('success'):
                            saved_news_list.append(result) # 收集成功保存的新闻信息
                        # 可以添加对失败结果的日志记录
                # --- 结束修改 ---

            except Exception as e:
                logger.error(f"处理新闻源 {source['name']} 时发生严重错误: {e}", exc_info=True)

        logger.info(f"新闻发现完成，共处理并尝试保存 {len(saved_news_list)} 条新文章") # 修改日志消息
        return saved_news_list # 返回成功保存的新闻列表

    def _extract_article_links(self, links: Dict[str, str], base_url: str) -> List[str]:
        """从爬取的链接中筛选出可能的文章链接 (使用精确正则)"""
        article_urls = set()
        parsed_base = urlparse(base_url)

        # 定义常见的非文章路径关键词 (保持不变)
        excluded_keywords = [
            'login', 'register', 'signin', 'signup', 'category', 'tag', 'author',
            'about', 'contact', 'privacy', 'terms', 'search', 'settings', 'profile',
            'video', 'live', 'gallery', 'topics', 'channel', 'column', 'special',
            'download', 'app', 'jobs', 'careers', 'sitemap', 'rss', 'feed',
            'shop', 'store', 'cart', 'checkout', 'subscribe', 'membership',
            'usercenter', 'seek-report', 'organization', 'activity', 'station-business',
            'policy', 'local', 'motif', 'hot-list', 'tags', 'nftags', 'rss-center',
            'mform', 'events', 'podcasts', 'newsletters', 'sponsored', 'brand-studio',
            'contact-us', 'my-account', 'startup-battlefield', 'storyline',
            'advertise', 'site-map', 'terms', 'privacy-policy', 'code-of-conduct',
            'institutional', 'usingthebbc', 'editorialguidelines', 'send', 'languages',
            'ir.36kr.com', 'zhaopin.36kr.com', 'eu.36kr.com', 'pitchhub.36kr.com',
            'q.36kr.com', 'innovation.36kr.com', 'adx.36kr.com', # 排除36kr的非文章链接
            'facebook.com', 'x.com', 'youtube.com', 'instagram.com', # 排除外部社交媒体
            'bbc.co.uk', # 排除BBC非主站链接
            'strictlyvc.com', 'crunchboard.com', 'yahoo.com', 'mstdn.social',
            'threads.net', 'bsky.app', # 排除TechCrunch页脚链接
            '36krcdn.com', 'letschuhai.com', '36dianping.com', 'bjjubao.org.cn',
            'aicpb.com', 'aliyun.com', 'volcengine.cn', 'getui.com', 'odaily.com',
            'jingdata.com', 'krspace.cn', 'futunn.com', 'woshipm.com', '36linkr.com',
            '12377.cn', 'miit.gov.cn', 'beian.gov.cn', 'weibo.com' # 排除36kr页脚链接
        ]

        # 定义精确的文章URL正则表达式
        article_patterns = [
            # BBC中文网: https://www.bbc.com/zhongwen/articles/c...o/simp
            re.compile(r'https?://www\.bbc\.com/zhongwen/articles/c[a-z0-9]{10,}o/?(?:simp|trad)?$'),
            # 36氪: https://36kr.com/p/<数字>
            re.compile(r'https?://36kr\.com/p/\d{10,}$'),
            # TechCrunch: https://techcrunch.com/YYYY/MM/DD/slug/
            re.compile(r'https?://techcrunch\.com/\d{4}/\d{2}/\d{2}/[a-z0-9-]+/?$'),
            # 可以为其他网站添加更多精确模式...
            # 通用模式 (作为备选，优先级较低)
            re.compile(r'\.(html|htm|shtml|php|asp|aspx)$'), # 以常见扩展名结尾
            re.compile(r'/\d{6,}/?$'), # 路径包含6位以上连续数字 (可能是ID或日期)
        ]

        # 提取内部链接和外部链接 (如果 crawl4ai 返回的是字典)
        internal_links = links.get('internal', [])
        external_links = links.get('external', [])
        all_links_data = internal_links + external_links

        # 如果 links 不是字典，假设它是旧格式 (url: text)
        if not isinstance(links, dict) or not all_links_data:
             all_links_data = [{'href': url, 'text': text} for url, text in links.items()]


        for link_data in all_links_data:
            url = link_data.get('href')
            text = link_data.get('text', '')
            if not url:
                continue

            try:
                full_url = urljoin(base_url, url)
                parsed_url = urlparse(full_url)

                # 1. 必须是 HTTP/HTTPS 协议
                if parsed_url.scheme not in ['http', 'https']:
                    # logger.debug(f"Skipping non-http(s) link: {full_url}")
                    continue

                # 2. 排除常见的非文章链接 (使用更新后的 excluded_keywords)
                path = parsed_url.path.lower()
                domain = parsed_url.netloc.lower()

                # 检查路径和域名是否包含排除关键词
                exclude_match = False
                for keyword in excluded_keywords:
                    if keyword in path or keyword in domain:
                        exclude_match = True
                        break
                if exclude_match:
                    # logger.debug(f"Skipping excluded keyword link: {full_url}")
                    continue

                # 排除根路径
                if path == '/' or not path:
                    # logger.debug(f"Skipping root link: {full_url}")
                    continue

                # 排除查询参数过多的链接
                if len(parsed_url.query) > 30: # 稍微放宽一点限制
                    # logger.debug(f"Skipping link with long query string: {full_url}")
                    continue

                # 3. 使用正则表达式匹配文章特征
                is_potential_article = False
                for pattern in article_patterns:
                    if pattern.search(full_url):
                        is_potential_article = True
                        # logger.debug(f"Regex match found for: {full_url} with pattern: {pattern.pattern}")
                        break # 找到一个匹配就足够

                if is_potential_article:
                    # 可以添加额外的检查，例如排除非常短的路径
                    if len(path) > 5: # 路径至少需要几个字符
                        article_urls.add(full_url)
                        # logger.debug(f"Found potential article link: {full_url}")
                # else:
                    # logger.debug(f"Skipping link (no regex match): {full_url}")

            except Exception as e:
                logger.warning(f"处理链接 {url} 时出错: {e}")

        logger.info(f"最终筛选出的文章链接 ({len(article_urls)}): {list(article_urls)}")
        return list(article_urls)

    async def _process_single_article(self, url: str, source_name: str, category_name: str) -> Optional[Dict]:
        """爬取、处理并保存单个文章"""
        logger.info(f"开始处理文章: {url}")
        try:
            crawl_result = await self.crawl_url(url)
            if crawl_result['success']:
                title = crawl_result.get('title', '')
                raw_content = crawl_result.get('content', '') # Markdown from crawl4ai

                logger.info(f"调用 AI 从 Markdown 中提取正文: {url}")
                cleaned_content = await self.ai_service.extract_main_content(raw_content)
                if not cleaned_content or len(cleaned_content) < 50:
                    logger.warning(f"AI 未能从 Markdown 中提取有效正文，跳过: {url}")
                    return {"success": False, "error": "AI failed to extract main content"}
                logger.info(f"AI 提取正文成功 (前 100 字符): {cleaned_content[:100]}...")

                # --- 关键步骤：调用 is_relevant_content 判断是否为单篇文章 ---
                is_single_article = await self.ai_service.is_relevant_content(title, cleaned_content)
                if not is_single_article:
                    logger.info(f"内容被 LLM 判断为非单篇新闻文章，跳过: {url}")
                    return {"success": False, "error": "Content identified as not a single news article by LLM"}
                # --- 结束判断 ---

                # 如果是单篇文章，则继续处理
                logger.info(f"内容被 LLM 判断为单篇新闻文章，继续处理: {url}")
                news_data = await self._prepare_news_data(
                    {**crawl_result, "content": cleaned_content, "title": title}, # 传递清理后的内容和标题
                    source_name,
                )
                save_result = self._save_news(news_data)
                # ... (处理保存结果) ...
                if save_result['success']:
                    return {
                        "success": True,
                        "news_id": save_result['news_id'],
                        "title": news_data['title']
                    }
                else:
                    logger.error(f"保存文章失败: {url}, 错误: {save_result.get('error')}")
                    return {"success": False, "error": save_result.get('error')}
            else:
                # ... (处理爬取失败) ...
                logger.error(f"爬取文章失败: {url}, 错误: {crawl_result.get('error')}")
                return {"success": False, "error": crawl_result.get('error')}
        except Exception as e:
            # ... (处理异常) ...
            logger.error(f"处理文章 {url} 时发生异常: {e}", exc_info=True)
            return {"success": False, "error": str(e)}
        
    def _is_url_processed(self, url: str) -> bool:
        """检查数据库中是否已存在该URL"""
        db = SessionLocal()
        try:
            existing = db.query(News.id).filter(News.url == url).first()
            return existing is not None
        finally:
            db.close()
    
    async def _prepare_news_data(self, processed_result: Dict, source_name: str) -> Dict:
        """准备新闻数据用于保存 (使用 AI 服务)"""
        content = processed_result['content'] # 清理后的正文
        title = processed_result['title']
        url = processed_result['url']
        raw_html = processed_result.get('raw_html', '')

        # 使用 AI 服务处理 (摘要、评分、分类)
        summary = await self.ai_service.generate_summary(title, content)
        importance_score = await self.ai_service.calculate_importance(title, content)
        categories = await self.ai_service.classify_news(title, content) # 使用原始的分类函数

        return {
            "title": title,
            "summary": summary,
            "content": content,
            "source": source_name,
            "url": url,
            "published_at": datetime.now(),  # 暂时用当前时间
            "importance_score": importance_score,
            "raw_html": raw_html,
            "categories": categories
        }
    
    def _save_news(self, news_data: Dict) -> Dict:
        """保存新闻到数据库"""
        db = SessionLocal()
        try:
            # 检查URL是否已存在
            existing_news = db.query(News).filter(News.url == news_data['url']).first()
            if existing_news:
                logger.info(f"新闻URL已存在: {news_data['url']}")
                return {"success": False, "error": "URL已存在", "news_id": existing_news.id}
            
            # 创建新闻记录
            news = News(
                title=news_data['title'],
                summary=news_data['summary'],
                content=news_data['content'],
                source=news_data['source'],
                url=news_data['url'],
                published_at=news_data['published_at'],
                importance_score=news_data['importance_score'],
                raw_html=news_data.get('raw_html', '')
            )
            
            # 处理分类
            for category_name in news_data['categories']:
                # 获取或创建分类
                category = db.query(Category).filter(Category.name == category_name).first()
                if not category:
                    category = Category(name=category_name)
                    db.add(category)
                    db.flush()
                
                # 关联新闻和分类
                news.categories.append(category)
            
            # 保存到数据库
            db.add(news)
            db.commit()
            
            logger.info(f"成功保存新闻: {news.id} - {news.title}")
            return {"success": True, "news_id": news.id}
        except Exception as e:
            db.rollback()
            logger.error(f"保存新闻时出错: {e}")
            return {"success": False, "error": str(e)}
        finally:
            db.close()
    
    def _get_news_sources(self) -> List[Dict]:
        """获取新闻源列表（包含预设源和用户自定义源）"""
        sources = []
        
        # 添加预设新闻源
        sources.extend(NEWS_SOURCES)
        
        # 从数据库获取用户自定义信息源
        db = SessionLocal()
        try:
            custom_sources = db.query(Source).all()
            for source in custom_sources:
                sources.append({
                    "name": source.name,
                    "url": source.url,
                    "category": "用户自定义"  # 暂时使用固定分类，后续可以扩展
                })
            logger.info(f"获取到 {len(custom_sources)} 个用户自定义信息源")
        except Exception as e:
            logger.error(f"获取用户自定义信息源时出错: {e}")
        finally:
            db.close()
            
        logger.info(f"总共获取到 {len(sources)} 个信息源")
        return sources

# 定时任务
async def discover_news_task():
    """定期执行新闻发现任务"""
    logger.info("开始执行定时新闻发现任务")
    crawler = NewsCrawlerService()
    await crawler.discover_news()