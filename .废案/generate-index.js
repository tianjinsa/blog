// generate-index.js
// Generates a static index.html with a list of blog posts.

const fs = require('fs');
const path = require('path');
const marked = require('marked'); // For potential excerpt processing, though not explicitly used for cards in current index.html
const matter = require('gray-matter');

// 导入全局配置
const BLOG_CONFIG = require('../js/config.js');

// Define directories and files
const SITE_URL = BLOG_CONFIG.SITE_URL; // Site URL for meta tags
const POSTS_PER_PAGE = BLOG_CONFIG.POSTS_PER_PAGE; // Configuration for pagination
const POSTS_DIR = path.join(__dirname, BLOG_CONFIG.BLOG_PATH);
// OUTPUT_FILE will be determined in the main loop for each page, no longer a single const

// Ensure blog posts directory exists
if (!fs.existsSync(POSTS_DIR)) {
    console.error(`Error: Blog posts directory not found at ${POSTS_DIR}`);
    process.exit(1);
}

/**
 * Extracts a short excerpt from Markdown content.
 * @param {string} content Markdown content.
 * @param {number} length Max length of the excerpt.
 * @returns {string}
 */
function generateExcerpt(content, length = 150) {
    // Remove Markdown headings and special characters, then trim.
    const plainText = content
        .replace(/#+\s+/g, '') // Remove headings
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Replace links with their text
        .replace(/!\[([^\]]*)\]\([^\)]+\)/g, '$1') // Replace images with their alt text or empty
        .replace(/[\*\_~\`]/g, '') // Remove emphasis, strikethrough, code ticks
        .replace(/\n/g, ' ') // Replace newlines with spaces
        .replace(/\s+/g, ' ') // Condense multiple spaces
        .trim();
    if (plainText.length <= length) {
        return plainText;
    }
    return plainText.substring(0, length) + '...';
}

/**
 * Reads all markdown posts, extracts metadata, and sorts them by date.
 * @returns {Array<Object>} Array of post objects.
 */
function getPostData() {
    const posts = [];
    const files = fs.readdirSync(POSTS_DIR).filter(file => file.endsWith('.md'));

    files.forEach(file => {
        const filePath = path.join(POSTS_DIR, file);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const { data, content } = matter(fileContent);

        // Title: from frontmatter or filename (parsed)        let title = data.title;
        if (!title) {
            title = file.replace(/^\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}-/, '').replace(/\.md$/, '');
            title = title.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase()); // Capitalize
        }

        // Date: from frontmatter or filename
        let date;
        if (data.date) {
            date = new Date(data.date);
        } else {
            const dateMatch = file.match(/^(\d{4}-\d{2}-\d{2})-/);
            date = dateMatch ? new Date(dateMatch[1]) : new Date(); // Default to now if no date in filename
        }

        // Description/Excerpt: from frontmatter or generated
        const description = data.description || generateExcerpt(content);

        // Tags: from frontmatter
        const tags = data.tags || [];

        // URL/Slug: based on filename. Slug includes .html extension.
        const slug = file.replace(/\.md$/, '.html');
        // The 'url' field is now just the slug, path construction happens later.
        // const url = `${POST_OUTPUT_DIR_RELATIVE_TO_ROOT}/${slug}`; 

        posts.push({
            title,
            date,
            description,
            tags,
            // url: slug, // Storing only the slug (filename.html)
            content, // Keep full content for other potential uses, though not for card
            slug // Filename part, e.g., YYYY-MM-DD-my-post.html
        });
    });

    // Sort posts by date in descending order
    posts.sort((a, b) => b.date - a.date);
    return posts;
}

/**
 * Generates HTML for a single blog post card.
 * @param {Object} post Post data, must include 'slug' (e.g., 'my-post.html').
 * @param {string} basePathToRoot Path to prepend for URLs to reach the root (e.g., './', '../../').
 * @returns {string} HTML string for the post card.
 */
function generatePostCardHTML(post, basePathToRoot) {
    // Construct the correct path to the post from the current page's location
    const postUrl = `${basePathToRoot}posts/${post.slug}`; 

    const tagsHTML = post.tags.length > 0
        ? `<div class="blog-tags">
            ${post.tags.map(tag => `<span class="tag"><i class="bi bi-tag"></i> ${tag}</span>`).join(' ')}
           </div>`
        : '';

    const displayDate = post.date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return `
        <div class="blog-card">
            <div class="blog-card-content">
                <h2 class="blog-card-title">
                    <a href="${postUrl}">${post.title}</a>
                </h2>
                <div class="blog-card-meta">
                    <span><i class="bi bi-calendar"></i> ${displayDate}</span>
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
 * Generates the full HTML for a single page of the paginated index.
 * @param {Array<Object>} postsForCurrentPage Array of post objects for the current page.
 * @param {number} currentPage The current page number.
 * @param {number} totalPages Total number of pages.
 * @param {string} basePathToRoot Path to prepend for URLs to reach the root.
 * @returns {string} Full HTML content for the page.
 */
function generatePaginatedPageHTML(postsForCurrentPage, currentPage, totalPages, basePathToRoot) {
    // Pass basePathToRoot to generatePostCardHTML
    const postCardsHTML = postsForCurrentPage.map(post => generatePostCardHTML(post, basePathToRoot)).join('\n'); 
    // const paginationHTML = generatePaginationHTML(currentPage, totalPages, basePathToRoot); // Will be added in next step

    let pageTitle = "Tianjinsa的博客";
    if (currentPage > 1) {
        pageTitle = `Tianjinsa的博客 (第 ${currentPage} 页)`;
    }
    
    let currentOgUrl = SITE_URL;
    if (currentPage > 1) {
        currentOgUrl = `${SITE_URL}/page/${currentPage}/`;
    } else {
        // Ensure SITE_URL ends with a slash if it's the root page for consistency
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
    <meta property="og:title" content="Tianjinsa的博客">
    <meta property="og:description" content="技术分享和个人心得">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://tianjinsa.github.io/blog/">
    <title>Tianjinsa的博客</title>
    <link rel="stylesheet" href="styles.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/themes/prism-tomorrow.min.css">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fira+Code&display=swap">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
    <link rel="alternate" type="application/rss+xml" title="Tianjinsa的博客 RSS Feed" href="/rss.xml">
</head>
<body>
    <nav class="navbar">
        <a href="index.html" class="navbar-brand">Tianjinsa</a>
        <ul class="navbar-links">
            <li><a href="index.html" class="active"><i class="bi bi-house"></i> 首页</a></li>
            <li><a href="archives.html"><i class="bi bi-archive"></i> 归档</a></li>
            <li><a href="tags.html"><i class="bi bi-tags"></i> 标签</a></li>
            <li><a href="about.html"><i class="bi bi-person"></i> 关于</a></li>
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
            
            <!-- Search and Tag filter placeholders - functionality removed for static generation -->
            <!-- You can decide to remove these entirely or keep them for future enhancements -->
            <div class="search-container">
                <input type="text" id="search-input" class="search-input" placeholder="搜索功能正在建设中..." aria-label="搜索博客文章" disabled>
                <button id="search-btn" class="search-button" disabled><i class="bi bi-search"></i></button>
            </div>
            <div id="tags-filter" class="tags-filter">
                <!-- Static tags could be generated here if desired, or removed -->
            </div>

            <div id="blog-content">
                ${postCardsHTML.length > 0 ? postCardsHTML : '<div class="no-blogs"><p>暂无博客文章</p></div>'}
            </div>
        </div>
        
        <footer class="footer">
            <p>&copy; <span id="current-year">${new Date().getFullYear()}</span> Tianjinsa. 保留所有权利。</p>
            <p>使用 <a href="https://pages.github.com/" target="_blank">GitHub Pages</a> 构建</p>
        </footer>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-core.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/plugins/autoloader/prism-autoloader.min.js"></script>
    <script>
        // Basic script for navbar toggle on mobile, and setting current year
        document.addEventListener('DOMContentLoaded', function() {
            const navbarToggleEl = document.getElementById('navbar-toggle');
            const navbarLinksEl = document.querySelector('.navbar-links');
            if (navbarToggleEl && navbarLinksEl) {
                navbarToggleEl.addEventListener('click', function() {
                    navbarLinksEl.classList.toggle('active');
                });
            }
            // current-year is already set during generation, but this is fine as a fallback or for other dynamic JS.
        });
    </script>
</body>
</html>`;
}

// Main script execution
function main() {
    try {
        const posts = getPostData();
        if (posts.length === 0) {
            console.warn("No posts found in P_POSTS_DIR. index.html will be generated with a 'no posts' message.");
        } else {
            console.log(`Found ${posts.length} posts.`);
        }
        
        const indexHTMLContent = generateIndexHTML(posts);
        fs.writeFileSync(OUTPUT_FILE, indexHTMLContent, 'utf-8');
        console.log(`Successfully generated ${OUTPUT_FILE}`);

    } catch (error) {
        console.error("Error generating index.html:", error);
        process.exit(1);
    }
}

main();
