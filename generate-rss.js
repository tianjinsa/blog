// generate-rss.js
// Generates an rss.xml file for the blog.

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter'); // For parsing frontmatter
const marked = require('marked'); // For converting Markdown to HTML

// Define constants
const SITE_URL = 'https://blog.tianjinsa.top';
const POSTS_DIR = path.join(__dirname, 'blog', '_posts'); // Source of Markdown posts
const OUTPUT_FILE = path.join(__dirname, 'rss.xml');
const MAX_RSS_ITEMS = 20; // Max number of posts in the RSS feed

// Blog metadata for the RSS channel
const BLOG_TITLE = 'Tianjinsa的博客';
const BLOG_DESCRIPTION = 'Tianjinsa的博客 - 分享技术文章和个人心得';

// Ensure blog posts directory exists
if (!fs.existsSync(POSTS_DIR)) {
    console.error(`Error: Blog posts directory not found at ${POSTS_DIR}`);
    process.exit(1);
}

/**
 * Generates a plain text excerpt from Markdown content.
 * @param {string} markdownContent Full Markdown content of the post.
 * @param {number} length Max length of the excerpt.
 * @returns {string}
 */
function generateExcerpt(markdownContent, length = 200) {
    const plainText = markdownContent
        .replace(/#+\s+/g, '') // Remove headings
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Replace links with their text
        .replace(/!\[([^\]]*)\]\([^\)]+\)/g, '$1') // Replace images with their alt text or empty
        .replace(/[\*\_~\`]/g, '') // Remove emphasis, strikethrough, code ticks
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
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
        const { data, content: markdownContent } = matter(fileContent);

        let title = data.title;
        if (!title) {
            title = file.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '');
            title = title.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
        }

        let postDate;
        if (data.date) {
            postDate = new Date(data.date);
        } else {
            const dateMatch = file.match(/^(\d{4}-\d{2}-\d{2})-/);
            postDate = dateMatch ? new Date(dateMatch[1]) : new Date(); // Default to now if no date in filename
        }

        // Description: from frontmatter, or generate a short excerpt if missing.
        // For RSS, we'll primarily use the full content, but a short description is good fallback/summary.
        const description = data.description || generateExcerpt(markdownContent, 150);
        
        const slug = file.replace(/\.md$/, '.html');
        const link = `${SITE_URL}/posts/${slug}`;

        posts.push({
            title,
            link,
            pubDate: postDate, // Store as Date object for sorting
            description,       // Short description / excerpt
            markdownContent    // Full Markdown content for RSS item description
        });
    });

    // Sort posts by date in descending order
    posts.sort((a, b) => b.pubDate - a.pubDate);
    return posts;
}

/**
 * Generates the RSS XML string.
 * @param {Array<Object>} posts Sorted array of post objects.
 * @returns {string} RSS XML content.
 */
function generateRssXml(posts) {
    const items = posts.slice(0, MAX_RSS_ITEMS);
    const currentDate = new Date();

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
    <title><![CDATA[${BLOG_TITLE}]]></title>
    <link>${SITE_URL}</link>
    <description><![CDATA[${BLOG_DESCRIPTION}]]></description>
    <language>zh-CN</language>
    <lastBuildDate>${currentDate.toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <generator>Custom Node.js RSS Generator</generator>
`;

    items.forEach(post => {
        // Convert Markdown content to HTML for the description
        const htmlContent = marked.parse(post.markdownContent);

        xml += `
    <item>
        <title><![CDATA[${post.title}]]></title>
        <link>${post.link}</link>
        <guid isPermaLink="true">${post.link}</guid>
        <pubDate>${new Date(post.pubDate).toUTCString()}</pubDate>
        <description><![CDATA[${htmlContent}]]></description>
    </item>`;
    });

    xml += `
</channel>
</rss>`;
    return xml.trim();
}

// Main script execution
function main() {
    try {
        console.log('开始生成 RSS Feed...');
        const posts = getPostData();
        
        if (posts.length === 0) {
            console.warn("没有找到博客文章，将生成一个空的 RSS Feed（或仅包含频道信息）。");
        } else {
            console.log(`找到了 ${posts.length} 篇博客文章，将选取最新的 ${Math.min(posts.length, MAX_RSS_ITEMS)} 篇加入 RSS Feed。`);
        }

        const rssXmlContent = generateRssXml(posts);
        fs.writeFileSync(OUTPUT_FILE, rssXmlContent, 'utf-8');
        console.log(`RSS Feed 生成成功: ${OUTPUT_FILE}`);

    } catch (error) {
        console.error("生成 RSS Feed 时发生错误:", error);
        process.exit(1);
    }
}

main();
