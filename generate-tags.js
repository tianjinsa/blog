// generate-tags.js
// Generates a static tags.html page with a tag cloud and posts listed under each tag.

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter'); // For parsing frontmatter

// Define directories and files
const POSTS_DIR = path.join(__dirname, '_posts');
const POST_OUTPUT_DIR_RELATIVE_TO_ROOT = 'posts'; // Used for generating post URLs
const OUTPUT_FILE = path.join(__dirname, 'tags.html');

// Ensure blog posts directory exists
if (!fs.existsSync(POSTS_DIR)) {
    console.error(`Error: Blog posts directory not found at ${POSTS_DIR}`);
    process.exit(1);
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
        const { data } = matter(fileContent); // Only need frontmatter

        let title = data.title;
        if (!title) {
            title = file.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '');
            title = title.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
        }

        let date;
        if (data.date) {
            date = new Date(data.date);
        } else {
            const dateMatch = file.match(/^(\d{4}-\d{2}-\d{2})-/);
            date = dateMatch ? new Date(dateMatch[1]) : new Date();
        }

        const tags = data.tags || [];
        const slug = file.replace(/\.md$/, '.html');
        const url = `${POST_OUTPUT_DIR_RELATIVE_TO_ROOT}/${slug}`;

        posts.push({ title, date, tags, url });
    });

    posts.sort((a, b) => b.date - a.date); // Sort by date descending
    return posts;
}

/**
 * Processes posts to create a map of tags to posts and calculate tag frequencies.
 * @param {Array<Object>} posts Array of post objects.
 * @returns {{tagsMap: Object, tagFrequencies: Object}}
 */
function processTags(posts) {
    const tagsMap = {};
    const tagFrequencies = {};

    posts.forEach(post => {
        if (post.tags && post.tags.length > 0) {
            post.tags.forEach(tag => {
                if (!tagsMap[tag]) {
                    tagsMap[tag] = [];
                    tagFrequencies[tag] = 0;
                }
                tagsMap[tag].push(post); // Add post to the list for this tag
                tagFrequencies[tag]++;   // Increment frequency
            });
        }
    });

    // Sort posts within each tag by date (already done globally, but good for explicitness if order changed)
    // for (const tag in tagsMap) {
    //     tagsMap[tag].sort((a, b) => b.date - a.date);
    // }
    
    return { tagsMap, tagFrequencies };
}

/**
 * Calculates tag size class based on frequency.
 * @param {number} count Current tag frequency.
 * @param {number} minCount Min frequency among all tags.
 * @param {number} maxCount Max frequency among all tags.
 * @returns {number} Size class (1-5).
 */
function getTagSizeClass(count, minCount, maxCount) {
    if (maxCount === minCount || count <= minCount) return 1; // Smallest size for single count or min
    if (count >= maxCount) return 5; // Largest size for max count

    const spread = maxCount - minCount;
    if (spread === 0) return 3; // Default if all tags have same frequency > 1

    // Distribute into 5 size categories
    const percentage = (count - minCount) / spread;
    if (percentage < 0.25) return 2;
    if (percentage < 0.5) return 3;
    if (percentage < 0.75) return 4;
    return 5;
}


/**
 * Generates the full HTML for the tags page.
 * @param {Object} tagsMap Map of tags to post objects.
 * @param {Object} tagFrequencies Map of tags to their frequencies.
 * @returns {string} Full HTML content for tags.html.
 */
function generateTagsPageHTML(tagsMap, tagFrequencies) {
    let tagCloudHTML = '';
    const sortedTagNames = Object.keys(tagsMap).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

    if (sortedTagNames.length === 0) {
        tagCloudHTML = '<p>暂无标签</p>';
    } else {
        const counts = Object.values(tagFrequencies);
        const minCount = Math.min(...counts);
        const maxCount = Math.max(...counts);

        sortedTagNames.forEach(tag => {
            const count = tagFrequencies[tag];
            const sizeClass = getTagSizeClass(count, minCount, maxCount);
            // Sanitize tag name for use in href and id
            const sanitizedTag = tag.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
            tagCloudHTML += `
                <div class="tag-cloud-item">
                    <a href="#tag-${sanitizedTag}" class="tag tag-size-${sizeClass}">${tag} (${count})</a>
                </div>`;
        });
    }

    let tagsContentHTML = '';
    if (sortedTagNames.length === 0) {
        tagsContentHTML = '<p>暂无内容可按标签显示。</p>';
    } else {
        sortedTagNames.forEach(tag => {
            const postsForTag = tagsMap[tag]; // These are already sorted by date
            const sanitizedTag = tag.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
            tagsContentHTML += `
                <div id="tag-${sanitizedTag}" class="tag-section">
                    <h2 class="tag-heading">${tag}</h2>
                    <ul class="tag-list">`;
            
            postsForTag.forEach(post => {
                const displayDate = post.date.toLocaleDateString('zh-CN', {
                    year: 'numeric', month: 'long', day: 'numeric'
                });
                tagsContentHTML += `
                        <li class="tag-item">
                            <div class="tag-item-title">
                                <a href="${post.url}">${post.title}</a>
                            </div>
                            <div class="tag-item-meta">
                                <span><i class="bi bi-calendar"></i> ${displayDate}</span>
                            </div>
                        </li>`;
            });
            tagsContentHTML += `</ul></div>`;
        });
    }

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Tianjinsa博客的标签页 - 通过标签浏览文章">
    <meta name="keywords" content="Tianjinsa, 博客, 标签, 技术分享">
    <meta name="author" content="Tianjinsa">
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📝</text></svg>">
    <meta property="og:title" content="标签 - Tianjinsa的博客">
    <meta property="og:description" content="通过标签浏览文章">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://tianjinsa.github.io/blog/tags.html">
    <title>标签 - Tianjinsa的博客</title>
    <link rel="stylesheet" href="styles.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
    <link rel="alternate" type="application/rss+xml" title="Tianjinsa的博客 RSS Feed" href="/rss.xml">
    <style>
        .tags-container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .tags-cloud { margin-bottom: 40px; text-align: center; }
        .tag-cloud-item { display: inline-block; margin: 8px 5px; }
        .tag-cloud-item a.tag { /* Ensure .tag class from styles.css applies if it has padding/bg */
            text-decoration: none;
            padding: 5px 10px; /* Example padding */
            border-radius: 4px; /* Example border-radius */
            transition: background-color 0.3s, color 0.3s;
        }
        .tag-size-1 { font-size: 0.9em; background-color: var(--tag-bg-1, #eee); color: var(--tag-color-1, #333); }
        .tag-size-2 { font-size: 1.1em; background-color: var(--tag-bg-2, #ddd); color: var(--tag-color-2, #333); }
        .tag-size-3 { font-size: 1.3em; background-color: var(--tag-bg-3, #ccc); color: var(--tag-color-3, #333); }
        .tag-size-4 { font-size: 1.5em; background-color: var(--tag-bg-4, #bbb); color: var(--tag-color-4, #fff); }
        .tag-size-5 { font-size: 1.7em; background-color: var(--tag-bg-5, #aaa); color: var(--tag-color-5, #fff); }

        .tag-section { margin-bottom: 40px; }
        .tag-heading {
            font-size: 1.8em;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 10px;
            margin-bottom: 20px;
            color: var(--accent-color);
        }
        .tag-list { list-style: none; padding: 0; }
        .tag-item {
            margin-bottom: 12px;
            padding-bottom: 12px;
            border-bottom: 1px dashed rgba(255, 255, 255, 0.1);
        }
        .tag-item:last-child { border-bottom: none; }
        .tag-item-title { font-size: 1.1em; }
        .tag-item-title a { color: var(--text-color); text-decoration: none; transition: color 0.3s; }
        .tag-item-title a:hover { color: var(--accent-color); }
        .tag-item-meta { font-size: 0.85em; color: var(--text-muted); margin-top: 5px; }
        .page-header { text-align: center; padding: 20px 0; margin-bottom: 20px; }
        .page-header h1 { font-size: 2.5em; margin-bottom: 10px; color: var(--text-color); }
        .page-header p { font-size: 1.1em; color: var(--text-muted); }
        .no-tags, .no-content { text-align: center; padding: 20px; color: var(--text-muted); }
    </style>
</head>
<body>
    <nav class="navbar">
        <a href="index.html" class="navbar-brand">Tianjinsa</a>
        <ul class="navbar-links">
            <li><a href="index.html"><i class="bi bi-house"></i> 首页</a></li>
            <li><a href="archives.html"><i class="bi bi-archive"></i> 归档</a></li>
            <li><a href="tags.html" class="active"><i class="bi bi-tags"></i> 标签</a></li>
            <li><a href="about.html"><i class="bi bi-person"></i> 关于</a></li>
        </ul>
        <div class="navbar-toggle" id="navbar-toggle"><i class="bi bi-list"></i></div>
    </nav>

    <div class="container">
        <div class="content-wrapper">
            <div class="page-header">
                <h1>文章标签</h1>
                <p>通过标签浏览文章</p>
            </div>
            
            <div class="tags-container">
                <div id="tags-cloud" class="tags-cloud">
                    ${tagCloudHTML}
                </div>
                
                <div id="tags-content">
                    ${tagsContentHTML}
                </div>
            </div>
        </div>

        <footer class="footer">
            <p>&copy; <span id="current-year">${new Date().getFullYear()}</span> Tianjinsa. 保留所有权利。</p>
            <p>使用 <a href="https://pages.github.com/" target="_blank">GitHub Pages</a> 构建</p>
        </footer>
    </div>
    
    <script>
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

// Main script execution
function main() {
    try {
        const posts = getPostData();
        if (posts.length === 0) {
            console.warn(`No posts found in ${POSTS_DIR}. tags.html will be generated with minimal content.`);
        } else {
            console.log(`Found ${posts.length} posts to process for tags.`);
        }
        
        const { tagsMap, tagFrequencies } = processTags(posts);
        
        if (Object.keys(tagsMap).length === 0) {
            console.warn("No tags found in any posts. tags.html will reflect this.");
        }

        const tagsHTMLContent = generateTagsPageHTML(tagsMap, tagFrequencies);
        
        fs.writeFileSync(OUTPUT_FILE, tagsHTMLContent, 'utf-8');
        console.log(`Successfully generated ${OUTPUT_FILE}`);

    } catch (error) {
        console.error(`Error generating ${OUTPUT_FILE}:`, error);
        process.exit(1);
    }
}

main();
