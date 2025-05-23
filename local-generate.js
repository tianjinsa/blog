/**
 * local-generate.js
 * 通过GitHub API获取博客文件并在本地生成HTML页面
 * 可在用户本地机器运行，不依赖于GitHub Pages服务器端处理
 */

// 加载第三方库
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const marked = require('marked');

// 加载项目模块
const BLOG_CONFIG = require('./js/config.js');
const GitHubAPI = require('./js/github-api');

// 全局配置
const SITE_URL = BLOG_CONFIG.SITE_URL;
const POSTS_PER_PAGE = BLOG_CONFIG.POSTS_PER_PAGE;
const POSTS_DIR = BLOG_CONFIG.BLOG_PATH;
const POST_OUTPUT_DIR = BLOG_CONFIG.POST_OUTPUT_DIR;
const TEMPLATE_PATH = path.join(__dirname, 'template.html');

// GitHub API配置
const githubRepo = {
    owner: BLOG_CONFIG.GITHUB_REPO_OWNER,
    repo: BLOG_CONFIG.GITHUB_REPO_NAME,
    branch: BLOG_CONFIG.DEFAULT_BRANCH
};

// 本地目录
const OUTPUT_DIR = path.join(__dirname, POST_OUTPUT_DIR);

// 创建GitHub API客户端
// 如果有GitHub令牌，可以通过环境变量传入：process.env.GITHUB_TOKEN
const github = new GitHubAPI(githubRepo.owner, githubRepo.repo, process.env.GITHUB_TOKEN);

/**
 * 确保输出目录存在
 * @param {string} dir 目录路径
 */
function ensureDirectoryExists(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`创建目录: ${dir}`);
    }
}

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
 * 生成单个博客文章的HTML
 * @param {Object} post 博客文章数据
 * @returns {string} HTML内容
 */
async function generatePostHtml(post) {
    console.log(`生成文章: ${post.title}`);

    // 读取模板文件
    const templateContent = fs.readFileSync(TEMPLATE_PATH, 'utf-8');
    
    // 处理标签
    const tagsHTML = post.tags.length > 0 
        ? post.tags.map(tag => `<span class="tag"><i class="bi bi-tag"></i> ${tag}</span>`).join(' ')
        : '';
    
    // 生成关键词meta标签内容
    const keywords = [...post.tags, post.title, 'Tianjinsa', '博客'].join(', ');
    
    // 转换Markdown为HTML
    const htmlContent = marked(post.content);
    
    // 生成输出文件名
    const outputFile = post.file.replace('.md', '.html');
    
    // 替换模板中的变量
    let outputContent = templateContent
        .replace(/BLOG_TITLE/g, post.title)
        .replace(/BLOG_DATE/g, post.date)
        .replace(/BLOG_DESCRIPTION/g, post.description)
        .replace(/BLOG_KEYWORDS/g, keywords)
        .replace(/BLOG_TAGS/g, tagsHTML)
        .replace(/BLOG_CONTENT/g, htmlContent)
        .replace(/BLOG_URL/g, `${SITE_URL}/posts/${outputFile}`);
    
    // 写入文件
    const outputPath = path.join(OUTPUT_DIR, outputFile);
    fs.writeFileSync(outputPath, outputContent, 'utf-8');
    
    return outputFile;
}

/**
 * 从GitHub获取博客文章数据
 * @returns {Promise<Array<Object>>} 博客文章数据数组
 */
async function getPostsFromGitHub() {
    try {
        console.log('从GitHub获取博客文章...');
        
        // 获取Markdown文件内容
        const markdownContents = await github.getMarkdownContents(POSTS_DIR, githubRepo.branch);
        const posts = [];
        
        // 处理每个Markdown文件
        for (const fileData of markdownContents) {
            const { name, content } = fileData;
            
            // 解析front matter
            const { data, content: markdownContent } = matter(content);
            
            // 处理日期
            let date = name.substring(0, 19); // 从文件名获取日期
            let displayDate = date;
            
            if (data.date) {
                const dateObj = new Date(data.date);
                displayDate = dateObj.toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            } else {
                const dateMatch = name.match(/^(\d{4}-\d{2}-\d{2})-/);
                if (dateMatch) {
                    const dateObj = new Date(dateMatch[1]);
                    displayDate = dateObj.toLocaleDateString('zh-CN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                }
            }
            
            // 处理标题
            const title = data.title || name.replace(/^\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}-/, '').replace('.md', '');
            
            // 处理标签
            const tags = data.tags || [];
            
            // 处理描述
            const description = data.description || generateExcerpt(markdownContent);
            
            posts.push({
                title,
                date: displayDate,
                rawDate: data.date || date,
                description,
                tags,
                content: markdownContent,
                file: name
            });
        }
        
        // 按日期排序（新到旧）
        posts.sort((a, b) => {
            const dateA = new Date(a.rawDate);
            const dateB = new Date(b.rawDate);
            return dateB - dateA;
        });
        
        return posts;
    } catch (error) {
        console.error('获取博客文章失败:', error);
        throw error;
    }
}

/**
 * 生成单个博客文章卡片的HTML
 * @param {Object} post 博客文章数据
 * @param {string} basePathToRoot 相对于根目录的路径
 * @returns {string} HTML字符串
 */
function generatePostCardHTML(post, basePathToRoot = './') {
    // 构建正确的帖子链接
    const postUrl = `${basePathToRoot}posts/${post.file.replace('.md', '.html')}`;

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
 * 生成分页的索引页HTML
 * @param {Array<Object>} postsForPage 当前页的博客文章数组
 * @param {number} currentPage 当前页码
 * @param {number} totalPages 总页数
 * @param {string} basePathToRoot 相对于根目录的路径
 * @returns {string} HTML内容
 */
function generatePaginatedPageHTML(postsForPage, currentPage, totalPages, basePathToRoot = './') {
    const postCardsHTML = postsForPage.map(post => generatePostCardHTML(post, basePathToRoot)).join('\n');
    
    // 创建分页导航
    let paginationHTML = '';
    if (totalPages > 1) {
        paginationHTML = `<div class="pagination">`;
        
        // 上一页按钮
        if (currentPage > 1) {
            const prevPageUrl = currentPage === 2 
                ? `${basePathToRoot}index.html` 
                : `${basePathToRoot}page/${currentPage - 1}/index.html`;
            paginationHTML += `<a href="${prevPageUrl}" class="page-link">← 上一页</a>`;
        } else {
            paginationHTML += `<span class="page-link disabled">← 上一页</span>`;
        }
        
        // 页码按钮
        for (let i = 1; i <= totalPages; i++) {
            if (i === currentPage) {
                paginationHTML += `<span class="page-link current">${i}</span>`;
            } else {
                const pageUrl = i === 1 
                    ? `${basePathToRoot}index.html` 
                    : `${basePathToRoot}page/${i}/index.html`;
                paginationHTML += `<a href="${pageUrl}" class="page-link">${i}</a>`;
            }
        }
        
        // 下一页按钮
        if (currentPage < totalPages) {
            paginationHTML += `<a href="${basePathToRoot}page/${currentPage + 1}/index.html" class="page-link">下一页 →</a>`;
        } else {
            paginationHTML += `<span class="page-link disabled">下一页 →</span>`;
        }
        
        paginationHTML += `</div>`;
    }
    
    // 页面标题
    let pageTitle = "Tianjinsa的博客";
    if (currentPage > 1) {
        pageTitle = `Tianjinsa的博客 (第 ${currentPage} 页)`;
    }
    
    // Open Graph URL
    let currentOgUrl = SITE_URL;
    if (currentPage > 1) {
        currentOgUrl = `${SITE_URL}/page/${currentPage}/`;
    } else {
        currentOgUrl = SITE_URL.endsWith('/') ? SITE_URL : `${SITE_URL}/`;
    }
    
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Tianjinsa的博客 - 分享技术文章和个人心得">
    <meta name="keywords" content="Tianjinsa, 博客, 技术分享, 开发笔记, 编程, 前端, 后端, 全栈">
    <meta name="author" content="Tianjinsa">
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📝</text></svg>">
    <meta property="og:title" content="${pageTitle}">
    <meta property="og:description" content="技术分享和个人心得">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${currentOgUrl}">
    <title>${pageTitle}</title>
    <link rel="stylesheet" href="${basePathToRoot}styles.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/themes/prism-tomorrow.min.css">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fira+Code&display=swap">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
    <link rel="alternate" type="application/rss+xml" title="Tianjinsa的博客 RSS Feed" href="${basePathToRoot}rss.xml">
</head>
<body>
    <nav class="navbar">
        <a href="${basePathToRoot}index.html" class="navbar-brand">Tianjinsa</a>
        <ul class="navbar-links">
            <li><a href="${basePathToRoot}index.html" class="active"><i class="bi bi-house"></i> 首页</a></li>
            <li><a href="${basePathToRoot}archives.html"><i class="bi bi-archive"></i> 归档</a></li>
            <li><a href="${basePathToRoot}tags.html"><i class="bi bi-tags"></i> 标签</a></li>
            <li><a href="${basePathToRoot}about.html"><i class="bi bi-person"></i> 关于</a></li>
        </ul>
        <div class="navbar-toggle" id="navbar-toggle">
            <i class="bi bi-list"></i>
        </div>
    </nav>

    <div class="container">
        <div class="content-wrapper">
            <div class="blog-header">
                <h1>Tianjinsa的博客</h1>
                <p>分享技术文章和个人心得</p>
            </div>
            
            <!-- 搜索和标签过滤占位符 -->
            <div class="search-container">
                <input type="text" id="search-input" class="search-input" placeholder="搜索功能正在建设中..." aria-label="搜索博客文章" disabled>
                <button id="search-btn" class="search-button" disabled><i class="bi bi-search"></i></button>
            </div>
            <div id="tags-filter" class="tags-filter">
                <!-- 静态标签可以在这里生成，如果需要的话 -->
            </div>

            <div id="blog-content">
                ${postCardsHTML.length > 0 ? postCardsHTML : '<div class="no-blogs"><p>暂无博客文章</p></div>'}
            </div>
            
            ${paginationHTML}
        </div>
        
        <footer class="footer">
            <p>&copy; <span id="current-year">${new Date().getFullYear()}</span> Tianjinsa. 保留所有权利。</p>
            <p>使用 <a href="https://pages.github.com/" target="_blank">GitHub Pages</a> 构建</p>
        </footer>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-core.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/plugins/autoloader/prism-autoloader.min.js"></script>
    <script>
        // 基本脚本，用于移动端上的导航栏切换
        document.addEventListener('DOMContentLoaded', function() {
            const navbarToggleEl = document.getElementById('navbar-toggle');
            const navbarLinksEl = document.querySelector('.navbar-links');
            if (navbarToggleEl && navbarLinksEl) {
                navbarToggleEl.addEventListener('click', function() {
                    navbarLinksEl.classList.toggle('active');
                });
            }
        });
    </script>
</body>
</html>`;
}

/**
 * 生成标签页面
 * @param {Array<Object>} posts 所有文章
 */
async function generateTagsPage(posts) {
    console.log('生成标签页面...');
    
    // 收集所有标签并计数
    const tagCounts = {};
    posts.forEach(post => {
        post.tags.forEach(tag => {
            if (tagCounts[tag]) {
                tagCounts[tag]++;
            } else {
                tagCounts[tag] = 1;
            }
        });
    });
    
    // 按标签名称排序
    const sortedTags = Object.keys(tagCounts).sort();
    
    // 为每个标签生成HTML
    let tagsHTML = '';
    sortedTags.forEach(tag => {
        const count = tagCounts[tag];
        const fontSize = Math.max(1, Math.min(2, 1 + count / 10)); // 标签大小根据文章数调整
        
        tagsHTML += `
        <div class="tag-item" style="font-size: ${fontSize}em;">
            <a href="#${tag}" class="tag-link">${tag} <span class="tag-count">(${count})</span></a>
        </div>`;
    });
    
    // 为每个标签生成文章列表
    let tagPostsHTML = '';
    sortedTags.forEach(tag => {
        const tagPosts = posts.filter(post => post.tags.includes(tag));
        
        tagPostsHTML += `
        <div class="tag-section" id="${tag}">
            <h2 class="tag-heading">${tag}</h2>
            <div class="tag-posts">`;
            
        tagPosts.forEach(post => {
            tagPostsHTML += `
                <div class="tag-post-item">
                    <span class="post-date">${post.date}</span>
                    <a class="post-title" href="./posts/${post.file.replace('.md', '.html')}">${post.title}</a>
                </div>`;
        });
        
        tagPostsHTML += `
            </div>
        </div>`;
    });
    
    // 创建完整的标签页面HTML
    const tagsPageHTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Tianjinsa的博客标签 - 按主题浏览文章">
    <meta name="keywords" content="Tianjinsa, 博客, 标签, ${sortedTags.join(', ')}">
    <meta name="author" content="Tianjinsa">
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📝</text></svg>">
    <title>标签 - Tianjinsa的博客</title>
    <link rel="stylesheet" href="./styles.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
</head>
<body>
    <nav class="navbar">
        <a href="./index.html" class="navbar-brand">Tianjinsa</a>
        <ul class="navbar-links">
            <li><a href="./index.html"><i class="bi bi-house"></i> 首页</a></li>
            <li><a href="./archives.html"><i class="bi bi-archive"></i> 归档</a></li>
            <li><a href="./tags.html" class="active"><i class="bi bi-tags"></i> 标签</a></li>
            <li><a href="./about.html"><i class="bi bi-person"></i> 关于</a></li>
        </ul>
        <div class="navbar-toggle" id="navbar-toggle">
            <i class="bi bi-list"></i>
        </div>
    </nav>

    <div class="container">
        <div class="content-wrapper">
            <div class="page-header">
                <h1>标签</h1>
                <p>按主题浏览文章</p>
            </div>
            
            <div class="tags-cloud">
                ${tagsHTML}
            </div>
            
            <div class="tag-posts-container">
                ${tagPostsHTML}
            </div>
        </div>
        
        <footer class="footer">
            <p>&copy; <span id="current-year">${new Date().getFullYear()}</span> Tianjinsa. 保留所有权利。</p>
            <p>使用 <a href="https://pages.github.com/" target="_blank">GitHub Pages</a> 构建</p>
        </footer>
    </div>
    
    <script>
        // 移动端导航栏切换
        document.addEventListener('DOMContentLoaded', function() {
            const navbarToggleEl = document.getElementById('navbar-toggle');
            const navbarLinksEl = document.querySelector('.navbar-links');
            if (navbarToggleEl && navbarLinksEl) {
                navbarToggleEl.addEventListener('click', function() {
                    navbarLinksEl.classList.toggle('active');
                });
            }
        });
    </script>
</body>
</html>`;
    
    // 写入文件
    fs.writeFileSync(path.join(__dirname, 'tags.html'), tagsPageHTML, 'utf-8');
    console.log('标签页面生成完成');
}

/**
 * 生成归档页面
 * @param {Array<Object>} posts 所有文章
 */
async function generateArchivesPage(posts) {
    console.log('生成归档页面...');
    
    // 按年月组织文章
    const archivesByYear = {};
    
    posts.forEach(post => {
        const dateMatch = post.rawDate.toString().match(/(\d{4})-(\d{2})/);
        if (dateMatch) {
            const year = dateMatch[1];
            const month = dateMatch[2];
            
            if (!archivesByYear[year]) {
                archivesByYear[year] = {};
            }
            
            if (!archivesByYear[year][month]) {
                archivesByYear[year][month] = [];
            }
            
            archivesByYear[year][month].push(post);
        }
    });
    
    // 按年月逆序排列
    const years = Object.keys(archivesByYear).sort((a, b) => b - a);
    
    // 生成归档HTML
    let archivesHTML = '';
    
    years.forEach(year => {
        archivesHTML += `<div class="archive-year">
            <h2>${year}年</h2>`;
        
        const months = Object.keys(archivesByYear[year]).sort((a, b) => b - a);
        
        months.forEach(month => {
            const monthPosts = archivesByYear[year][month];
            const monthName = new Date(`${year}-${month}-01`).toLocaleDateString('zh-CN', { month: 'long' });
            
            archivesHTML += `<div class="archive-month">
                <h3>${monthName}</h3>
                <ul class="archive-posts">`;
                
            monthPosts.forEach(post => {
                archivesHTML += `<li class="archive-post">
                    <span class="post-date">${post.date}</span>
                    <a class="post-title" href="./posts/${post.file.replace('.md', '.html')}">${post.title}</a>
                </li>`;
            });
            
            archivesHTML += `</ul>
            </div>`;
        });
        
        archivesHTML += `</div>`;
    });
    
    // 创建完整的归档页面HTML
    const archivesPageHTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Tianjinsa的博客归档 - 按时间浏览所有文章">
    <meta name="keywords" content="Tianjinsa, 博客, 归档, 文章历史">
    <meta name="author" content="Tianjinsa">
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📝</text></svg>">
    <title>归档 - Tianjinsa的博客</title>
    <link rel="stylesheet" href="./styles.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
</head>
<body>
    <nav class="navbar">
        <a href="./index.html" class="navbar-brand">Tianjinsa</a>
        <ul class="navbar-links">
            <li><a href="./index.html"><i class="bi bi-house"></i> 首页</a></li>
            <li><a href="./archives.html" class="active"><i class="bi bi-archive"></i> 归档</a></li>
            <li><a href="./tags.html"><i class="bi bi-tags"></i> 标签</a></li>
            <li><a href="./about.html"><i class="bi bi-person"></i> 关于</a></li>
        </ul>
        <div class="navbar-toggle" id="navbar-toggle">
            <i class="bi bi-list"></i>
        </div>
    </nav>

    <div class="container">
        <div class="content-wrapper">
            <div class="page-header">
                <h1>归档</h1>
                <p>共 ${posts.length} 篇文章</p>
            </div>
            
            <div class="archives-container">
                ${archivesHTML}
            </div>
        </div>
        
        <footer class="footer">
            <p>&copy; <span id="current-year">${new Date().getFullYear()}</span> Tianjinsa. 保留所有权利。</p>
            <p>使用 <a href="https://pages.github.com/" target="_blank">GitHub Pages</a> 构建</p>
        </footer>
    </div>
    
    <script>
        // 移动端导航栏切换
        document.addEventListener('DOMContentLoaded', function() {
            const navbarToggleEl = document.getElementById('navbar-toggle');
            const navbarLinksEl = document.querySelector('.navbar-links');
            if (navbarToggleEl && navbarLinksEl) {
                navbarToggleEl.addEventListener('click', function() {
                    navbarLinksEl.classList.toggle('active');
                });
            }
        });
    </script>
</body>
</html>`;
    
    // 写入文件
    fs.writeFileSync(path.join(__dirname, 'archives.html'), archivesPageHTML, 'utf-8');
    console.log('归档页面生成完成');
}

/**
 * 生成站点地图
 * @param {Array<Object>} posts 所有文章
 */
async function generateSitemap(posts) {
    console.log('生成站点地图...');
    
    const pages = [];
    const currentDate = new Date().toISOString().split('T')[0];
    
    // 添加首页
    pages.push({
        url: '/index.html',
        priority: '1.0',
        changefreq: 'weekly',
        lastmod: currentDate
    });
    
    // 添加固定页面
    ['about.html', 'archives.html', 'tags.html'].forEach(pageFile => {
        pages.push({
            url: `/${pageFile}`,
            priority: '0.8',
            changefreq: 'monthly',
            lastmod: currentDate
        });
    });
    
    // 添加分页页面
    const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);
    for (let i = 2; i <= totalPages; i++) {
        pages.push({
            url: `/page/${i}/index.html`,
            priority: '0.7',
            changefreq: 'weekly',
            lastmod: currentDate
        });
    }
    
    // 添加博客文章
    posts.forEach(post => {
        // 从rawDate提取lastmod
        let postLastmod = currentDate;
        try {
            if (post.rawDate) {
                const dateObj = new Date(post.rawDate);
                if (!isNaN(dateObj.getTime())) {
                    postLastmod = dateObj.toISOString().split('T')[0];
                }
            }
        } catch (err) {
            console.warn(`警告: 无法解析文章 ${post.file} 的日期。将使用当前日期。`);
        }
        
        pages.push({
            url: `/posts/${post.file.replace('.md', '.html')}`,
            priority: '0.9',
            changefreq: 'monthly',
            lastmod: postLastmod
        });
    });
    
    // 生成 sitemap.xml 内容
    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    pages.forEach(page => {
        sitemap += '  <url>\n';
        sitemap += `    <loc>${SITE_URL}${page.url}</loc>\n`;
        sitemap += `    <lastmod>${page.lastmod}</lastmod>\n`;
        sitemap += `    <changefreq>${page.changefreq}</changefreq>\n`;
        sitemap += `    <priority>${page.priority}</priority>\n`;
        sitemap += '  </url>\n';
    });
    
    sitemap += '</urlset>';
    
    // 写入文件
    fs.writeFileSync(path.join(__dirname, 'sitemap.xml'), sitemap, 'utf-8');
    console.log(`站点地图生成完成，共包含 ${pages.length} 个页面`);
}

/**
 * 主函数
 */
async function main() {
    try {
        console.log('开始本地生成博客内容...');
        
        // 确保输出目录存在
        ensureDirectoryExists(OUTPUT_DIR);
        
        // 从GitHub获取博客文章
        const posts = await getPostsFromGitHub();
        
        if (posts.length === 0) {
            console.warn('没有找到博客文章。');
            return;
        }
        
        console.log(`找到 ${posts.length} 篇博客文章。`);
        
        // 生成博客文章页面
        for (const post of posts) {
            await generatePostHtml(post);
        }
        
        // 生成分页的索引页
        const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);
        console.log(`将生成 ${totalPages} 页索引页`);
        
        for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
            console.log(`生成第 ${currentPage} 页...`);
            
            // 计算当前页的文章
            const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
            const postsForPage = posts.slice(startIndex, startIndex + POSTS_PER_PAGE);
            
            // 为第一页的索引页设置基本路径
            let basePathToRoot = './';
            let outputPath = path.join(__dirname, 'index.html');
            
            // 为其他页设置路径
            if (currentPage > 1) {
                const pageDirPath = path.join(__dirname, 'page', String(currentPage));
                ensureDirectoryExists(pageDirPath);
                outputPath = path.join(pageDirPath, 'index.html');
                basePathToRoot = '../../'; // 从 /page/N/ 返回到根目录
            }
            
            // 生成页面HTML
            const pageContent = generatePaginatedPageHTML(postsForPage, currentPage, totalPages, basePathToRoot);
            
            // 写入文件
            fs.writeFileSync(outputPath, pageContent, 'utf-8');
        }
        
        // 生成标签页
        await generateTagsPage(posts);
        
        // 生成归档页
        await generateArchivesPage(posts);
        
        // 生成站点地图
        await generateSitemap(posts);
        
        // 设置客户端备用方案
        console.log('设置客户端备用方案...');
        require('./js/setup-client-fallback');
        
        console.log('博客生成完成!');
    } catch (error) {
        console.error('生成博客内容出错:', error);
        process.exit(1);
    }
}

// 执行主函数
main();
