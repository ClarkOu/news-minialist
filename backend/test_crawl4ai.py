import asyncio
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode

async def test_crawl():
    """测试crawl4ai爬虫"""
    url = "https://www.bbc.com/news"
    print(f"开始爬取: {url}")
    
    # 创建浏览器配置
    browser_config = BrowserConfig(headless=True, verbose=True)
    
    # 使用异步爬虫爬取URL
    async with AsyncWebCrawler(config=browser_config) as crawler:
        # 运行爬取
        result = await crawler.arun(url)
        
        # 打印HTML内容长度
        html_length = len(result.html) if hasattr(result, "html") and result.html else 0
        print(f"HTML 内容长度: {html_length}")
        
        # 打印爬取状态
        print(f"爬取状态: {result.success}")
        
        # 提取并打印文章内容
        if result.success:
            # 获取Markdown内容
            markdown_content = result.markdown.raw_markdown if hasattr(result, "markdown") and result.markdown else ""
            print(f"\n---- Markdown 内容 ----\n{markdown_content[:500]}...\n")
            
            # 获取页面标题
            title = result.metadata.get("title", "无标题") if hasattr(result, "metadata") and result.metadata else "无标题"
            print(f"页面标题: {title}")
            
            # 获取链接
            links = result.links if hasattr(result, "links") else {}
            print(f"\n找到 {len(links)} 个链接")
            
            # 打印前5个链接
            for i, (link_url, link_text) in enumerate(links.items()):
                if i >= 5:  # 只打印前5个
                    break
                print(f"链接 {i+1}: {link_text} -> {link_url}")
            
            # 获取清理后的HTML
            cleaned_html = result.cleaned_html if hasattr(result, "cleaned_html") else ""
            print(f"\n清理后的HTML长度: {len(cleaned_html)}")
            
            return {
                "success": True,
                "title": title,
                "content": markdown_content,
                "links": links
            }
        else:
            error_msg = result.error_message if hasattr(result, "error_message") else "未知错误"
            print(f"爬取失败: {error_msg}")
            return {
                "success": False,
                "error": error_msg
            }

# 运行测试
if __name__ == "__main__":
    asyncio.run(test_crawl())