import os
import logging
import re
from typing import List, Optional, Dict, Any
from openai import AsyncOpenAI, APIError, APITimeoutError

from config import OPENROUTER_API_KEY, OPENROUTER_MODEL_NAME

# 配置日志
logger = logging.getLogger(__name__)

class OpenRouterService:
    """使用 OpenRouter 处理新闻内容的 AI 服务"""

    def __init__(self):
        if not OPENROUTER_API_KEY:
            logger.error("OpenRouter API 密钥未配置。请在 .env 文件中设置 OPENROUTER_API_KEY。")
            raise ValueError("OpenRouter API 密钥未配置")

        # 配置 OpenAI 客户端以使用 OpenRouter
        self.client = AsyncOpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=OPENROUTER_API_KEY,
            timeout=30.0,
        )
        self.model = OPENROUTER_MODEL_NAME
        logger.info(f"OpenRouterService 初始化完成，使用模型: {self.model}")

    async def _call_llm(self, prompt: str, max_tokens: int = 150, temperature: float = 0.3) -> Optional[str]:
        """调用 OpenRouter LLM 的通用方法"""
        try:
            logger.debug(f"向 OpenRouter 发送请求，模型: {self.model}, Prompt: {prompt[:100]}...")
            completion = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a helpful assistant for processing news articles."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=max_tokens,
                temperature=temperature,
            )
            # --- 修改：在 strip() 之前记录原始响应 ---
            raw_response_text = completion.choices[0].message.content
            logger.info(f"LLM 原始响应 (未处理): '{raw_response_text}'") # 使用 INFO 级别
            # --- 结束修改 ---

            response_text = raw_response_text.strip()
            # logger.debug(f"收到 OpenRouter 响应: {response_text[:100]}...") # 这行可以保留或注释掉
            return response_text
        except APITimeoutError:
            logger.error("调用 OpenRouter API 超时")
            return None
        except APIError as e:
            logger.error(f"调用 OpenRouter API 时出错: {e}")
            return None
        except Exception as e:
            logger.error(f"调用 LLM 时发生未知错误: {e}", exc_info=True)
            return None
    async def extract_main_content(self, markdown_input: str) -> Optional[str]:
        """使用 LLM 从原始 Markdown 中提取文章主要内容"""
        logger.info("使用 LLM 提取主要内容...")
        if not markdown_input:
            return None

        # 限制输入长度
        content_limit = 40000 # 根据需要调整
        truncated_input = markdown_input[:content_limit]

        prompt = f"""
        以下是一段从网页转换过来的 Markdown 文本，其中可能包含导航链接、广告、页眉页脚等无关信息。
        请仔细阅读并仅提取出文章的主要正文内容。
        请不要包含任何原始的导航链接、按钮文本、版权信息或与文章主体无关的元数据。
        请直接返回提取出的纯文本内容，保持段落结构。

        原始 Markdown:
        ---
        {truncated_input}{'...' if len(markdown_input) > content_limit else ''}
        ---

        提取的文章正文:
        """
        # 允许较长的输出，因为正文可能很长，但也要考虑成本
        # 可以根据平均文章长度调整 max_tokens
        extracted_content = await self._call_llm(prompt, max_tokens=2000, temperature=0.1)

        if extracted_content:
            # 可以添加一些基本的后处理，例如移除可能的引言 "提取的文章正文:"
            if extracted_content.startswith("提取的文章正文:"):
                 extracted_content = extracted_content[len("提取的文章正文:"):].strip()
            logger.info(f"LLM 提取正文成功 (前 100 字符): {extracted_content[:100]}...")
            return extracted_content
        else:
            logger.warning("无法从 LLM 提取主要内容")
            return None
    async def is_relevant_content(self, title: str, content_preview: str) -> bool:
        """使用 LLM 判断给定内容是否属于相关类别 (新闻、商业、科技等)"""
        logger.info(f"使用 LLM 判断内容相关性: '{title}'")
        if not title or not content_preview:
            return False # 基本信息缺失

        # 截取内容预览，避免过长
        preview = content_preview[:5000] # 取前1000个字符作为预览
        # --- 修改：使用 INFO 级别记录更长的预览 ---
        logger.info(f"发送给 LLM 的内容预览 (前 500 字符): {preview[:3000]}...")

        prompt = f"""
        请判断以下内容的性质。它是否代表一篇独立、完整的新闻报道、分析文章或评论文章？
        请注意区分单篇文章与包含多篇文章的列表页、作者主页、分类索引页或网站首页。

        请只回答 "是" 或 "否"。

        标题: {title}
        内容预览:
        {preview}...

        是否为单篇新闻文章 (是/否):
        """
        # 使用较低的 temperature 获取更确定的 "是/否" 回答
        response = await self._call_llm(prompt, max_tokens=10, temperature=0.1)

        if response:
            raw_response_text = response
            logger.info(f"LLM 原始响应 (判断是否单篇): '{raw_response_text}'")
            # 检查响应是否以 "是" 开头 (允许后面有标点等)
            is_single_article = response.strip().startswith("是")
            if not is_single_article:
                 logger.warning(f"LLM 判断内容不是单篇新闻文章: 标题='{title}'")
            return is_single_article
        else:
            logger.warning("无法从 LLM 获取内容类型判断，默认视为非单篇新闻文章")
            return False # 如果 LLM 调用失败，保守地认为不是单篇

    async def calculate_importance(self, title: str, content_preview: str) -> float:
        """使用 LLM 评估新闻重要性 (1-10分)"""
        logger.info(f"使用 LLM 评估重要性: '{title}'")
        if not title or not content_preview:
            return 3.0 # 基本信息缺失，默认较低分数

        preview = content_preview[:1500] # 取前1500个字符

        prompt = f"""
        请评估以下新闻的重要程度，范围从 1 (非常不重要) 到 10 (非常重要)。
        请考虑其潜在影响、时效性、涉及范围等因素。
        请只返回一个数字评分 (例如: 7.5)。

        标题: {title}
        内容预览:
        {preview}...

        重要性评分 (1-10):
        """
        response = await self._call_llm(prompt, max_tokens=50, temperature=0.3)

        if response:
            try:
                # 提取数字
                match = re.search(r'\d+(\.\d+)?', response)
                if match:
                    score = float(match.group())
                    # 限制在 1-10 范围
                    return max(1.0, min(10.0, score))
                else:
                    logger.warning(f"无法从 LLM 响应 '{response}' 中提取重要性评分，使用默认值 5.0")
                    return 5.0
            except ValueError:
                logger.warning(f"无法将 LLM 响应 '{response}' 转换为评分，使用默认值 5.0")
                return 5.0
        else:
            logger.warning("无法从 LLM 获取重要性评分，使用默认值 5.0")
            return 5.0

    async def generate_summary(self, title: str, content: str) -> str:
        """使用 LLM 生成新闻摘要"""
        logger.info(f"使用 LLM 生成摘要: '{title}'")
        if not content:
            return "内容为空"

        # 限制内容长度，防止超出 LLM 上下文限制或消耗过多 token
        content_limit = 40000 # 根据模型调整，例如 4k tokens 约等于 3000 英文单词或更多中文
        truncated_content = content[:content_limit]

        prompt = f"""
        请为以下新闻文章生成一个简洁的摘要，不超过 150 字。

        标题: {title}
        文章内容:
        {truncated_content}{'...' if len(content) > content_limit else ''}

        摘要:
        """
        summary = await self._call_llm(prompt, max_tokens=1000, temperature=0.6) # 允许稍长的 token 输出以生成摘要

        if summary:
            return summary
        else:
            logger.warning("无法从 LLM 生成摘要，返回基于规则的摘要")
            # Fallback: 使用简单的规则生成摘要
            sentences = re.split(r'[。！？!?.]', content[:5000]) # 基于前5000字符
            sentences = [s.strip() for s in sentences if s.strip()]
            fallback_summary = '。'.join(sentences[:3]) + '。' if sentences else content[:100]
            return fallback_summary[:2000] # 限制长度

    async def classify_news(self, title: str, content_preview: str) -> List[str]:
        """使用 LLM 对新闻进行分类"""
        logger.info(f"使用 LLM 分类新闻: '{title}'")
        if not title or not content_preview:
            return ["其他"]

        preview = content_preview[:1500]

        # 提供一些候选分类，帮助 LLM 输出更一致的结果
        candidate_categories = ["科技", "商业", "国际", "政治", "社会", "体育", "文化", "健康", "环境", "其他"]

        prompt = f"""
        请根据以下新闻的标题和内容预览，从下列候选分类中选择最相关的 1-3 个分类。
        如果都不相关，请返回 "其他"。
        请以逗号分隔返回分类名称 (例如: 科技,商业)。

        候选分类: {', '.join(candidate_categories)}

        标题: {title}
        内容预览:
        {preview}...

        分类:
        """
        response = await self._call_llm(prompt, max_tokens=50, temperature=0.2)

        if response:
            # 清理并分割返回的分类
            categories = [cat.strip() for cat in response.split(',') if cat.strip()]
            # 过滤掉不在候选列表中的分类（可选，增加鲁棒性）
            valid_categories = [cat for cat in categories if cat in candidate_categories]
            if not valid_categories:
                return ["其他"] # 如果LLM返回无效或空，则归为其他
            return valid_categories
        else:
            logger.warning("无法从 LLM 获取分类，返回 '其他'")
            return ["其他"]
