/**
 * client-loader.js
 * 用于在浏览器中直接从GitHub API加载博客内容
 * 这是一个备用方案，当本地生成的静态页面不可用时
 */

document.addEventListener('DOMContentLoaded', async function() {
    // 从配置中获取数据
    const config = window.BLOG_CONFIG || {
        GITHUB_REPO_OWNER: 'tianjinsa',
        GITHUB_REPO_NAME: 'blog',
        BLOG_PATH: '_posts',
        DEFAULT_BRANCH: 'main',
        POSTS_PER_PAGE: 5
    };
    
    // 如果页面已有内容，不需要加载
    if (document.getElementById('blog-content').children.length > 1) {
        return;
    }
    
    try {
        // 创建GitHub API客户端
        const github = new GitHubAPI(
            config.GITHUB_REPO_OWNER,
            config.GITHUB_REPO_NAME
        );
        
        // 显示加载消息
        const blogContent = document.getElementById('blog-content');
        blogContent.innerHTML = '<div class="loading">正在从GitHub加载博客文章...</div>';
        
        // 加载文章
        const markdownContents = await github.getMarkdownContents(config.BLOG_PATH, config.DEFAULT_BRANCH);
        if (!markdownContents || markdownContents.length === 0) {
            blogContent.innerHTML = '<div class="no-blogs"><p>未找到博客文章</p></div>';
            return;
        }
        
        // 处理文章数据
        const posts = [];
        for (const fileData of markdownContents) {
            const { name, content } = fileData;
            
            // 解析front matter (使用简化版解析)
            const frontMatter = parseFrontMatter(content);
            const markdownContent = frontMatter.content;
            
            // 处理日期
            let date = name.substring(0, 19); // 从文件名获取日期
            let displayDate = date;
            
            if (frontMatter.data.date) {
                const dateObj = new Date(frontMatter.data.date);
                if (!isNaN(dateObj.getTime())) {
                    displayDate = dateObj.toLocaleDateString('zh-CN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                }
            } else {
                const dateMatch = name.match(/^(\d{4}-\d{2}-\d{2})-/);
                if (dateMatch) {
                    const dateObj = new Date(dateMatch[1]);
                    if (!isNaN(dateObj.getTime())) {
                        displayDate = dateObj.toLocaleDateString('zh-CN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        });
                    }
                }
            }
            
            // 处理标题
            const title = frontMatter.data.title || name.replace(/^\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}-/, '').replace('.md', '');
            
            // 处理标签
            const tags = frontMatter.data.tags || [];
            
            // 处理描述
            const description = frontMatter.data.description || generateExcerpt(markdownContent);
            
            posts.push({
                title,
                date: displayDate,
                rawDate: frontMatter.data.date || date,
                description,
                tags,
                content: markdownContent,
                file: name
            });
        }
        
        // 按日期排序
        posts.sort((a, b) => {
            const dateA = new Date(a.rawDate);
            const dateB = new Date(b.rawDate);
            return dateB - dateA;
        });
        
        // 获取当前页码
        const urlParams = new URLSearchParams(window.location.search);
        let currentPage = parseInt(urlParams.get('page')) || 1;
        if (currentPage < 1) currentPage = 1;
        
        // 计算总页数
        const totalPages = Math.ceil(posts.length / config.POSTS_PER_PAGE);
        if (currentPage > totalPages) currentPage = totalPages;
        
        // 获取当前页的文章
        const startIndex = (currentPage - 1) * config.POSTS_PER_PAGE;
        const postsForPage = posts.slice(startIndex, startIndex + config.POSTS_PER_PAGE);
        
        // 生成文章卡片
        let cardsHTML = '';
        postsForPage.forEach(post => {
            cardsHTML += generatePostCardHTML(post);
        });
        
        // 生成分页导航
        let paginationHTML = '';
        if (totalPages > 1) {
            paginationHTML = '<div class="pagination">';
            
            // 上一页按钮
            if (currentPage > 1) {
                paginationHTML += `<a href="?page=${currentPage - 1}" class="page-link">← 上一页</a>`;
            } else {
                paginationHTML += `<span class="page-link disabled">← 上一页</span>`;
            }
            
            // 页码按钮
            for (let i = 1; i <= totalPages; i++) {
                if (i === currentPage) {
                    paginationHTML += `<span class="page-link current">${i}</span>`;
                } else {
                    paginationHTML += `<a href="?page=${i}" class="page-link">${i}</a>`;
                }
            }
            
            // 下一页按钮
            if (currentPage < totalPages) {
                paginationHTML += `<a href="?page=${currentPage + 1}" class="page-link">下一页 →</a>`;
            } else {
                paginationHTML += `<span class="page-link disabled">下一页 →</span>`;
            }
            
            paginationHTML += '</div>';
        }
        
        // 更新页面内容
        blogContent.innerHTML = cardsHTML + paginationHTML;
        
    } catch (error) {
        console.error('加载博客内容出错:', error);
        document.getElementById('blog-content').innerHTML = `
            <div class="error">
                <p>加载博客内容时出错</p>
                <p>错误信息: ${error.message}</p>
                <p>请稍后重试或联系网站管理员</p>
            </div>
        `;
    }
});

/**
 * 从Markdown内容生成摘要
 * @param {string} content Markdown内容
 * @param {number} length 摘要最大长度
 * @returns {string} 摘要文本
 */
function generateExcerpt(content, length = 150) {
    // 移除Markdown标记和特殊字符，然后裁剪
    const plainText = content
        .replace(/#+\s+/g, '') // 移除标题
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // 替换链接为文本
        .replace(/!\[([^\]]*)\]\([^\)]+\)/g, '$1') // 替换图片为替代文本
        .replace(/[\*\_~\`]/g, '') // 移除强调、删除线、代码标记
        .replace(/\n/g, ' ') // 替换换行为空格
        .replace(/\s+/g, ' ') // 压缩多个空格
        .trim();
    
    if (plainText.length <= length) {
        return plainText;
    }
    return plainText.substring(0, length) + '...';
}

/**
 * 生成单个博客文章卡片的HTML
 * @param {Object} post 博客文章数据
 * @returns {string} HTML字符串
 */
function generatePostCardHTML(post) {
    // 构建帖子链接 - 在客户端加载中，使用查询参数
    const postUrl = `post.html?file=${encodeURIComponent(post.file)}`;

    const tagsHTML = post.tags.length > 0
        ? `<div class="blog-tags">
            ${post.tags.map(tag => `<span class="tag"><i class="bi bi-tag"></i> ${tag}</span>`).join(' ')}
           </div>`
        : '';

    return `
        <div class="blog-card">
            <div class="blog-card-content">
                <h2 class="blog-card-title">
                    <a href="${postUrl}">${post.title}</a>
                </h2>
                <div class="blog-card-meta">
                    <span><i class="bi bi-calendar"></i> ${post.date}</span>
                    ${tagsHTML}
                </div>
                <p class="blog-card-excerpt">${post.description}</p>
                <div class="blog-card-footer">
                    <a href="${postUrl}" class="read-more">阅读全文 →</a>
                </div>
            </div>
        </div>
    `;
}

/**
 * 简单的Front Matter解析器
 * 注意：这是一个简化版解析器，用于客户端。完整版应使用gray-matter。
 * @param {string} content Markdown内容
 * @returns {Object} 包含data和content的对象
 */
function parseFrontMatter(content) {
    const result = {
        data: {},
        content: content
    };
    
    // 检查是否有Front Matter
    if (!content.startsWith('---')) {
        return result;
    }
    
    // 查找第二个---标记
    const endIndex = content.indexOf('---', 3);
    if (endIndex === -1) {
        return result;
    }
    
    // 提取Front Matter部分
    const frontMatter = content.substring(3, endIndex).trim();
    
    // 解析每一行
    frontMatter.split('\n').forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex !== -1) {
            const key = line.substring(0, colonIndex).trim();
            let value = line.substring(colonIndex + 1).trim();
            
            // 处理数组
            if (value.startsWith('[') && value.endsWith(']')) {
                try {
                    value = JSON.parse(value);
                } catch (e) {
                    // 如果JSON解析失败，尝试简单的数组解析
                    value = value.substring(1, value.length - 1)
                        .split(',')
                        .map(item => item.trim());
                }
            }
            
            result.data[key] = value;
        }
    });
    
    // 提取实际内容
    result.content = content.substring(endIndex + 3).trim();
    
    return result;
}
