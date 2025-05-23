/**
 * client-rss.js
 * 客户端RSS生成器 - 在浏览器端生成RSS并支持关键词过滤
 */

// 使用立即执行函数避免污染全局命名空间
(function() {
    // 解析URL参数
    function getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    // 从Markdown内容生成纯文本摘要
    function generateExcerpt(markdownContent, length = 200) {
        const plainText = markdownContent
            .replace(/#+\s+/g, '') // 移除标题
            .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // 替换链接为其文本
            .replace(/!\[([^\]]*)\]\([^\)]+\)/g, '$1') // 替换图片为其alt文本或空字符串
            .replace(/[\*\_~\`]/g, '') // 移除强调、删除线、代码标记
            .replace(/\n/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        
        if (plainText.length <= length) {
            return plainText;
        }
        return plainText.substring(0, length) + '...';
    }

    // 解析文章文件名获取日期和标题
    function parseFilename(filename) {
        // 尝试从文件名提取日期和标题
        const dateMatch = filename.match(/^(\d{4}-\d{2}-\d{2})-\d{2}-\d{2}-\d{2}-(.*?)\.md$/);
        if (dateMatch) {
            const date = dateMatch[1];
            let title = dateMatch[2].replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
            return { date, title };
        }
        return { date: null, title: filename.replace(/\.md$/, '') };
    }

    // 解析Markdown前端内容(frontmatter)
    function parseFrontMatter(content) {
        let frontmatter = {};
        
        // 检测frontmatter的开始和结束
        const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
        if (match) {
            const fmContent = match[1];
            const markdownContent = match[2];
            
            // 解析frontmatter
            fmContent.split('\n').forEach(line => {
                const parts = line.split(':').map(part => part.trim());
                if (parts.length >= 2) {
                    const key = parts[0];
                    const value = parts.slice(1).join(':').trim();
                    // 去掉可能的引号
                    frontmatter[key] = value.replace(/^["']|["']$/g, '');
                }
            });
            
            return { 
                data: frontmatter, 
                content: markdownContent 
            };
        }
        
        // 如果没有frontmatter，直接返回内容
        return { 
            data: {}, 
            content 
        };
    }

    // 将Markdown转换为HTML
    function markdownToHtml(markdown) {
        // 使用marked.js将Markdown转换为HTML (确保在HTML中已加载marked库)
        if (typeof marked === 'undefined') {
            console.error('marked库未加载。请确保在HTML中引入了marked.js');
            return markdown;
        }
        return marked(markdown);
    }

    // 文章内容是否符合过滤条件
    function matchesFilter(post, filter) {
        if (!filter) return true;
        
        const filterLower = filter.toLowerCase();
        const titleMatch = post.title.toLowerCase().includes(filterLower);
        const contentMatch = post.markdownContent.toLowerCase().includes(filterLower);
        const descriptionMatch = post.description.toLowerCase().includes(filterLower);
        
        return titleMatch || contentMatch || descriptionMatch;
    }

    // 处理博客文章数据
    async function processPostData(files, filter) {
        const posts = [];
        const githubApi = new GitHubAPI(
            BLOG_CONFIG.GITHUB_REPO_OWNER,
            BLOG_CONFIG.GITHUB_REPO_NAME
        );
        
        for (const file of files) {
            try {
                // 获取文件内容
                const fileContent = await githubApi.getFileContent(file.path);
                
                // 解析frontmatter和内容
                const { data, content: markdownContent } = parseFrontMatter(fileContent);
                
                // 从frontmatter或文件名获取标题
                let title = data.title;
                if (!title) {
                    const parsed = parseFilename(file.name);
                    title = parsed.title;
                }
                
                // 从frontmatter或文件名获取日期
                let postDate;
                if (data.date) {
                    postDate = new Date(data.date);
                } else {
                    const parsed = parseFilename(file.name);
                    postDate = parsed.date ? new Date(parsed.date) : new Date();
                }
                
                // 获取描述
                const description = data.description || generateExcerpt(markdownContent, 150);
                
                // 创建链接
                const slug = file.name.replace(/\.md$/, '.html');
                const link = `${BLOG_CONFIG.SITE_URL}/posts/${slug}`;
                
                const post = {
                    title,
                    link,
                    pubDate: postDate,
                    description,
                    markdownContent
                };
                
                // 应用过滤器
                if (matchesFilter(post, filter)) {
                    posts.push(post);
                }
            } catch (error) {
                console.error(`处理文件 ${file.name} 时出错:`, error);
            }
        }
        
        // 按日期降序排序
        posts.sort((a, b) => b.pubDate - a.pubDate);
        return posts;
    }

    // 生成RSS XML
    function generateRssXml(posts) {
        const MAX_RSS_ITEMS = BLOG_CONFIG.MAX_RSS_ITEMS || 20;
        const items = posts.slice(0, MAX_RSS_ITEMS);
        const filter = getQueryParam('q');
        
        const filterInfo = filter ? ` (已过滤: "${filter}")` : '';
        
        // 创建RSS XML
        let rss = '<?xml version="1.0" encoding="UTF-8"?>\n';
        rss += '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n';
        rss += '<channel>\n';
        rss += `  <title>${BLOG_CONFIG.SITE_TITLE}${filterInfo}</title>\n`;
        rss += `  <description>${BLOG_CONFIG.SITE_DESCRIPTION}</description>\n`;
        rss += `  <link>${BLOG_CONFIG.SITE_URL}</link>\n`;
        
        // 包含自我引用链接
        const currentUrl = window.location.href.split('?')[0]; // 移除现有查询参数
        rss += `  <atom:link href="${currentUrl}${filter ? '?q='+encodeURIComponent(filter) : ''}" rel="self" type="application/rss+xml" />\n`;
        rss += `  <language>zh-CN</language>\n`;
        
        // 最后更新时间
        if (items.length > 0) {
            rss += `  <lastBuildDate>${items[0].pubDate.toUTCString()}</lastBuildDate>\n`;
        } else {
            rss += `  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n`;
        }
        
        // 添加项目
        items.forEach(item => {
            // 将Markdown转换为HTML
            const htmlContent = markdownToHtml(item.markdownContent);
            
            rss += '  <item>\n';
            rss += `    <title>${item.title}</title>\n`;
            rss += `    <link>${item.link}</link>\n`;
            rss += `    <guid>${item.link}</guid>\n`;
            rss += `    <pubDate>${item.pubDate.toUTCString()}</pubDate>\n`;
            rss += `    <description><![CDATA[${htmlContent}]]></description>\n`;
            rss += '  </item>\n';
        });
        
        rss += '</channel>\n';
        rss += '</rss>';
        
        return rss;
    }

    // 加载博客文章并生成RSS
    async function loadPostsAndGenerateRSS() {
        try {
            const statusElement = document.getElementById('status');
            if (statusElement) {
                statusElement.textContent = '正在加载文章...';
            }
            
            const githubApi = new GitHubAPI(
                BLOG_CONFIG.GITHUB_REPO_OWNER,
                BLOG_CONFIG.GITHUB_REPO_NAME
            );
            
            // 获取所有Markdown文件
            const files = await githubApi.getMarkdownFiles(BLOG_CONFIG.BLOG_PATH);
            
            // 获取过滤关键词
            const filter = getQueryParam('q');
            
            // 处理文章数据
            const posts = await processPostData(files, filter);
            
            // 生成RSS XML
            const rssXml = generateRssXml(posts);
            
            // 显示结果
            const filterInfo = filter ? ` - 已过滤: "${filter}"` : '';
            if (statusElement) {
                statusElement.textContent = `已生成RSS${filterInfo} - 包含 ${posts.length} 篇文章`;
            }
            
            // 将XML显示在预览区域
            const previewElement = document.getElementById('rss-preview');
            if (previewElement) {
                // 使用pre标签显示并进行HTML转义
                previewElement.textContent = rssXml;
            }
            
            // 设置下载链接
            const downloadLink = document.getElementById('download-rss');
            if (downloadLink) {
                const blob = new Blob([rssXml], {type: 'application/rss+xml'});
                const url = URL.createObjectURL(blob);
                downloadLink.href = url;
                downloadLink.download = filter ? `rss-${filter}.xml` : 'rss.xml';
                downloadLink.style.display = 'inline-block';
            }
            
            // 如果是直接访问RSS URL (不带HTML界面)，直接输出XML
            if (window.location.pathname.endsWith('/rss') || window.location.pathname.endsWith('/rss.xml')) {
                document.body.innerHTML = '';
                document.body.style.margin = '0';
                document.body.style.padding = '0';
                
                // 创建一个pre元素来显示XML
                const pre = document.createElement('pre');
                pre.textContent = rssXml;
                document.body.appendChild(pre);
                
                // 设置正确的Content-Type (注意：这只是视觉上的，实际的HTTP头部需要服务器设置)
                document.contentType = 'application/rss+xml';
            }
        } catch (error) {
            console.error('生成RSS时出错:', error);
            const statusElement = document.getElementById('status');
            if (statusElement) {
                statusElement.textContent = `生成RSS时出错: ${error.message}`;
                statusElement.style.color = 'red';
            }
        }
    }

    // 刷新过滤器并重新生成RSS
    function refreshFilter() {
        const filterInput = document.getElementById('filter-input');
        if (filterInput) {
            const filter = filterInput.value.trim();
            
            // 更新URL而不刷新页面
            const url = new URL(window.location);
            if (filter) {
                url.searchParams.set('q', filter);
            } else {
                url.searchParams.delete('q');
            }
            window.history.pushState({}, '', url);
            
            // 重新生成RSS
            loadPostsAndGenerateRSS();
        }
    }

    // 初始化过滤器输入框
    function initFilterInput() {
        const filterInput = document.getElementById('filter-input');
        const filterButton = document.getElementById('filter-button');
        
        if (filterInput) {
            // 从URL参数设置初始值
            const q = getQueryParam('q');
            if (q) {
                filterInput.value = q;
            }
            
            // 添加回车键监听
            filterInput.addEventListener('keyup', function(event) {
                if (event.key === 'Enter') {
                    refreshFilter();
                }
            });
        }
        
        if (filterButton) {
            filterButton.addEventListener('click', refreshFilter);
        }
    }

    // 当页面加载完成后初始化
    document.addEventListener('DOMContentLoaded', function() {
        initFilterInput();
        loadPostsAndGenerateRSS();
    });

    // 将函数导出到全局作用域，以便可能的外部调用
    window.generateRSS = {
        refresh: loadPostsAndGenerateRSS,
        applyFilter: refreshFilter
    };
})();
