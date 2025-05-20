// 文件：generate-sitemap.js
// 功能：生成sitemap.xml文件

const fs = require('fs');
const path = require('path');

// 网站URL
const SITE_URL = 'https://tianjinsa.github.io';
const BLOG_BASE = '/blog';

// 定义生成站点地图的函数
function generateSitemap() {
    console.log('开始生成站点地图...');
    
    // 获取所有HTML文件路径
    const pages = [];
    
    // 添加首页
    pages.push({
        url: `${BLOG_BASE}/index.html`,
        priority: '1.0',
        changefreq: 'weekly'
    });
    
    // 添加固定页面
    ['about.html', 'archives.html', 'tags.html'].forEach(page => {
        pages.push({
            url: `${BLOG_BASE}/${page}`,
            priority: '0.8',
            changefreq: 'monthly'
        });
    });
    
    // 添加博客文章
    const postsDir = path.join(__dirname, 'posts');
    if (fs.existsSync(postsDir)) {
        const postFiles = fs.readdirSync(postsDir).filter(file => file.endsWith('.html'));
        postFiles.forEach(file => {
            pages.push({
                url: `${BLOG_BASE}/posts/${file}`,
                priority: '0.9',
                changefreq: 'monthly'
            });
        });
    }
    
    // 生成sitemap.xml内容
    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    pages.forEach(page => {
        sitemap += '  <url>\n';
        sitemap += `    <loc>${SITE_URL}${page.url}</loc>\n`;
        sitemap += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
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
