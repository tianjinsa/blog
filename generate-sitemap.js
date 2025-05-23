// 文件：generate-sitemap.js
// 功能：生成sitemap.xml文件

const fs = require('fs');
const path = require('path');

// 网站URL
const SITE_URL = 'https://blog.tianjinsa.top'; // Updated SITE_URL
const BLOG_BASE = ''; // Updated BLOG_BASE - leading slash will be in URL construction

const SOURCE_POSTS_DIR = path.join(__dirname, 'blog', '_posts'); // Path to original markdown posts

// 定义生成站点地图的函数
function generateSitemap() {
    console.log('开始生成站点地图...');
    
    const pages = [];
    const currentDate = new Date().toISOString().split('T')[0];

    // Helper function to construct URLs
    function constructUrl(base, ...parts) {
        // Ensure no double slashes if base is empty or parts start with /
        const pathPart = path.join(base, ...parts).replace(/\\/g, '/');
        return pathPart.startsWith('/') ? pathPart : `/${pathPart}`;
    }
    
    // 添加首页
    pages.push({
        url: constructUrl(BLOG_BASE, 'index.html'),
        priority: '1.0',
        changefreq: 'weekly',
        lastmod: currentDate
    });
    
    // 添加固定页面
    ['about.html', 'archives.html', 'tags.html'].forEach(pageFile => {
        pages.push({
            url: constructUrl(BLOG_BASE, pageFile),
            priority: '0.8',
            changefreq: 'monthly',
            lastmod: currentDate
        });
    });
    
    // 添加博客文章
    const generatedPostsDir = path.join(__dirname, 'posts');
    if (fs.existsSync(generatedPostsDir)) {
        const postHtmlFiles = fs.readdirSync(generatedPostsDir).filter(file => file.endsWith('.html'));
        
        postHtmlFiles.forEach(htmlFile => {
            const baseName = path.basename(htmlFile, '.html');
            // Attempt to find the original Markdown file
            // Common filename patterns: YYYY-MM-DD-title.md or title.md
            // generate-posts.js uses the original .md filename to create the .html filename
            const originalMdFilename = `${baseName}.md`;
            const sourceMdPath = path.join(SOURCE_POSTS_DIR, originalMdFilename);
            
            let postLastmod = currentDate;
            if (fs.existsSync(sourceMdPath)) {
                try {
                    const stats = fs.statSync(sourceMdPath);
                    postLastmod = stats.mtime.toISOString().split('T')[0];
                } catch (err) {
                    console.warn(`警告: 无法读取源文件 ${sourceMdPath} 的修改日期。将使用当前日期。错误: ${err.message}`);
                }
            } else {
                console.warn(`警告: 未找到博客文章 ${htmlFile} 对应的源 Markdown 文件 (${sourceMdPath})。将使用当前日期作为 lastmod。`);
            }
            
            pages.push({
                url: constructUrl(BLOG_BASE, 'posts', htmlFile),
                priority: '0.9',
                changefreq: 'monthly', // Or 'yearly' if posts are rarely updated
                lastmod: postLastmod
            });
        });
    } else {
        console.warn(`警告: 生成的博客文章目录 ${generatedPostsDir} 未找到。不会为博客文章生成站点地图条目。`);
    }
    
    // 生成sitemap.xml内容
    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    pages.forEach(page => {
        sitemap += '  <url>\n';
        sitemap += `    <loc>${SITE_URL}${page.url}</loc>\n`; // page.url already includes leading slash if needed
        sitemap += `    <lastmod>${page.lastmod}</lastmod>\n`;
        sitemap += `    <changefreq>${page.changefreq}</changefreq>\n`;
        sitemap += `    <priority>${page.priority}</priority>\n`;
        sitemap += '  </url>\n';
    });
    
    sitemap += '</urlset>';
    
    // 写入文件
    fs.writeFileSync(path.join(__dirname, 'sitemap.xml'), sitemap);
    console.log(`站点地图生成完成，共包含 ${pages.length} 个页面`);
}

// 执行函数
generateSitemap();
