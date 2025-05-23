// generate-rss.js
// 为博客生成RSS feed文件
// 这个文件专为GitHub Actions设计，可以独立运行

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter'); // 用于解析frontmatter
const marked = require('marked'); // 用于将Markdown转换为HTML

// 博客配置
const BLOG_CONFIG = {
    SITE_URL: 'https://blog.tianjinsa.top',  // 网站URL
    SITE_TITLE: 'Tianjinsa的博客',           // 网站标题
    SITE_DESCRIPTION: 'Tianjinsa的博客 - 分享技术文章和个人心得', // 网站描述
    BLOG_PATH: '_posts',                     // 博客文件存储路径
    MAX_RSS_ITEMS: 20                        // RSS feed中最大的文章数量
};

// 定义常量
const SITE_URL = BLOG_CONFIG.SITE_URL;
const POSTS_DIR = path.join(__dirname, BLOG_CONFIG.BLOG_PATH);
const OUTPUT_FILE = path.join(__dirname, 'rss.xml');
const MAX_RSS_ITEMS = BLOG_CONFIG.MAX_RSS_ITEMS;

// RSS channel元数据
const BLOG_TITLE = BLOG_CONFIG.SITE_TITLE;
const BLOG_DESCRIPTION = BLOG_CONFIG.SITE_DESCRIPTION;

// 确保博客文章目录存在
if (!fs.existsSync(POSTS_DIR)) {
    console.error(`错误：找不到博客文章目录 ${POSTS_DIR}`);
    process.exit(1);
}

/**
 * 从Markdown内容生成纯文本摘要
 * @param {string} markdownContent 文章的Markdown内容
 * @param {number} length 摘要最大长度
 * @returns {string} 生成的摘要
 */
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

/**
 * 读取所有Markdown文章，提取元数据，并按日期排序
 * @returns {Array<Object>} 文章对象数组
 */
function getPostData() {
    const posts = [];
    const files = fs.readdirSync(POSTS_DIR).filter(file => file.endsWith('.md'));

    files.forEach(file => {
        const filePath = path.join(POSTS_DIR, file);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const { data, content: markdownContent } = matter(fileContent);

        let title = data.title;
        if (!title) {
            title = file.replace(/^\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}-/, '').replace(/\.md$/, '');
            title = title.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
        }

        let postDate;
        if (data.date) {
            postDate = new Date(data.date);
        } else {
            const dateMatch = file.match(/^(\d{4}-\d{2}-\d{2})-/);
            postDate = dateMatch ? new Date(dateMatch[1]) : new Date(); // 如果文件名中没有日期，则使用当前日期
        }

        // 描述：从frontmatter获取，如果没有则生成简短摘要
        const description = data.description || generateExcerpt(markdownContent, 150);
        
        const slug = file.replace(/\.md$/, '.html');
        const link = `${SITE_URL}/posts/${slug}`;

        posts.push({
            title,
            link,
            pubDate: postDate, // 保存为Date对象，用于排序
            description,       // 短描述/摘要
            markdownContent    // RSS项目描述的完整Markdown内容
        });
    });

    // 按日期降序排序（最新的在前）
    posts.sort((a, b) => b.pubDate - a.pubDate);
    return posts;
}

/**
 * 生成RSS XML字符串
 * @param {Array<Object>} posts 排序后的文章对象数组
 * @returns {string} RSS XML内容
 */
function generateRssXml(posts) {
    const items = posts.slice(0, MAX_RSS_ITEMS); // 限制RSS项目数量
    
    // 使用marked将Markdown转换为HTML
    const renderer = new marked.Renderer();
    
    // 创建RSS XML
    let rss = '<?xml version="1.0" encoding="UTF-8"?>\n';
    rss += '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n';
    rss += '<channel>\n';
    rss += `  <title>${BLOG_TITLE}</title>\n`;
    rss += `  <description>${BLOG_DESCRIPTION}</description>\n`;
    rss += `  <link>${SITE_URL}</link>\n`;
    rss += `  <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />\n`;
    rss += `  <language>zh-CN</language>\n`;
    
    // 最后更新时间（最新文章的日期）
    if (items.length > 0) {
        rss += `  <lastBuildDate>${items[0].pubDate.toUTCString()}</lastBuildDate>\n`;
    } else {
        rss += `  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n`;
    }
    
    // 添加项目
    items.forEach(item => {
        // 转换Markdown为HTML
        const htmlContent = marked(item.markdownContent, { renderer });
        
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

// 主执行逻辑
try {
    console.log('开始生成RSS feed...');
    
    const posts = getPostData();
    console.log(`找到 ${posts.length} 篇文章，将添加最多 ${MAX_RSS_ITEMS} 篇到RSS feed`);
    
    const rssXml = generateRssXml(posts);
    fs.writeFileSync(OUTPUT_FILE, rssXml);
    
    console.log(`RSS feed已成功生成到 ${OUTPUT_FILE}`);
} catch (error) {
    console.error('生成RSS feed时出错:', error);
    process.exit(1);
}
