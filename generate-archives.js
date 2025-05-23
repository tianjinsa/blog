// generate-archives.js
// Generates a static archives.html page with a list of blog posts grouped by year and month.

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter'); // For parsing frontmatter

// Define directories and files
const POSTS_DIR = path.join(__dirname, 'blog', '_posts');
const POST_OUTPUT_DIR_RELATIVE_TO_ROOT = 'posts'; // Used for generating post URLs
const OUTPUT_FILE = path.join(__dirname, 'archives.html');

// Ensure blog posts directory exists
if (!fs.existsSync(POSTS_DIR)) {
    console.error(`Error: Blog posts directory not found at ${POSTS_DIR}`);
    process.exit(1);
}

/**
 * Reads all markdown posts, extracts metadata.
 * @returns {Array<Object>} Array of post objects.
 */
function getPostData() {
    const posts = [];
    const files = fs.readdirSync(POSTS_DIR).filter(file => file.endsWith('.md'));

    files.forEach(file => {
        const filePath = path.join(POSTS_DIR, file);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const { data } = matter(fileContent); // Only need frontmatter for archives

        // Title: from frontmatter or filename (parsed)
        let title = data.title;
        if (!title) {
            title = file.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '');
            title = title.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase()); // Capitalize
        }

        // Date: from frontmatter or filename. Crucial for grouping.
        let date;
        if (data.date) {
            date = new Date(data.date);
        } else {
            const dateMatch = file.match(/^(\d{4}-\d{2}-\d{2})-/);
            date = dateMatch ? new Date(dateMatch[1]) : new Date(); // Default to now if no date in filename
        }

        // Tags: from frontmatter
        const tags = data.tags || [];

        // URL/Slug: based on filename, relative to root
        const slug = file.replace(/\.md$/, '.html');
        const url = `${POST_OUTPUT_DIR_RELATIVE_TO_ROOT}/${slug}`;

        posts.push({
            title,
            date,
            tags,
            url,
            // We don't need full content for archives page
        });
    });

    // Sort posts by date in descending order (important before grouping)
    posts.sort((a, b) => b.date - a.date);
    return posts;
}

/**
 * Groups posts by year and then by month.
 * @param {Array<Object>} posts Sorted array of post objects.
 * @returns {Object} Nested object with posts grouped by year and month.
 * Example structure:
 * {
 *   "2024": {
 *     "11": [post1, post2], // December (month is 0-indexed in JS Date)
 *     "10": [post3]         // November
 *   },
 *   "2023": { ... }
 * }
 */
function groupPosts(posts) {
    const grouped = {};
    posts.forEach(post => {
        const year = post.date.getFullYear();
        const month = post.date.getMonth(); // 0-indexed (0 for January, 11 for December)
        
        if (!grouped[year]) {
            grouped[year] = {};
        }
        if (!grouped[year][month]) {
            grouped[year][month] = [];
        }
        grouped[year][month].push(post);
    });
    return grouped;
}


const MONTH_NAMES = [
    "一月", "二月", "三月", "四月", "五月", "六月",
    "七月", "八月", "九月", "十月", "十一月", "十二月"
];

/**
 * Generates the full HTML for the archives page.
 * @param {Object} groupedPosts Posts grouped by year and month.
 * @returns {string} Full HTML content for archives.html.
 */
function generateArchivesPageHTML(groupedPosts) {
    let archivesContentHTML = '';

    // Sort years in descending order
    const sortedYears = Object.keys(groupedPosts).sort((a, b) => b - a);

    if (sortedYears.length === 0) {
        archivesContentHTML = '<div class="no-blogs"><p>暂无博客文章可归档。</p></div>';
    } else {
        sortedYears.forEach(year => {
            archivesContentHTML += `<div class="year-section">
                <h2 class="year-heading">${year}年</h2>`;

            // Sort months in descending order (key is 0-11)
            const sortedMonths = Object.keys(groupedPosts[year]).sort((a, b) => b - a);

            sortedMonths.forEach(monthKey => { // monthKey is 0-11
                const monthName = MONTH_NAMES[parseInt(monthKey, 10)];
                archivesContentHTML += `<div class="month-section">
                    <h3 class="month-heading">${monthName}</h3>
                    <ul class="archive-list">`;

                // Posts are already sorted by date descending from getPostData
                groupedPosts[year][monthKey].forEach(post => {
                    const day = post.date.getDate().toString().padStart(2, '0');
                    // Display month and day, e.g., 12-05
                    const displayDate = `${(post.date.getMonth() + 1).toString().padStart(2, '0')}-${day}`;
                    
                    let tagsHTML = '';
                    if (post.tags && post.tags.length > 0) {
                        tagsHTML = post.tags.map(tag =>
                            `<span class="tag archive-tag"><i class="bi bi-tag"></i> ${tag}</span>`
                        ).join(' ');
                    }

                    archivesContentHTML += `<li class="archive-item">
                        <span class="archive-date">${displayDate}</span>
                        <span class="archive-title"><a href="${post.url}">${post.title}</a></span>
                        <span class="archive-tags">${tagsHTML}</span>
                    </li>`;
                });
                archivesContentHTML += `</ul></div>`; // Close month-section
            });
            archivesContentHTML += `</div>`; // Close year-section
        });
    }

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Tianjinsa的博客归档 - 按时间浏览所有文章">
    <meta name="keywords" content="Tianjinsa, 博客, 技术分享, 开发笔记, 归档">
    <meta name="author" content="Tianjinsa">
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📝</text></svg>">
    <meta property="og:title" content="博客归档 - Tianjinsa">
    <meta property="og:description" content="按时间浏览所有文章">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://tianjinsa.github.io/blog/archives.html">
    <title>博客归档 - Tianjinsa</title>
    <link rel="stylesheet" href="styles.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
    <link rel="alternate" type="application/rss+xml" title="Tianjinsa的博客 RSS Feed" href="/rss.xml">
    <style>
        .archives-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .year-section { margin-bottom: 40px; }
        .year-heading {
            font-size: 1.8em;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 10px;
            margin-bottom: 20px;
            color: white; /* Ensure visibility if --text-color is light */
        }
        .month-section { margin-bottom: 30px; }
        .month-heading {
            font-size: 1.4em;
            margin-bottom: 15px;
            color: var(--accent-color);
        }
        .archive-list { list-style: none; padding: 0; }
        .archive-item {
            margin-bottom: 15px;
            padding-bottom: 15px;
            border-bottom: 1px dashed rgba(255, 255, 255, 0.1); /* Softer dash */
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap; /* Allow wrapping for smaller screens */
        }
        .archive-item:last-child { border-bottom: none; }
        .archive-date {
            color: var(--text-muted);
            font-size: 0.9em;
            min-width: 80px; /* Adjusted min-width */
            margin-right: 15px;
        }
        .archive-title {
            flex-grow: 1;
            padding: 0 10px; /* Reduced padding */
        }
        .archive-title a {
            color: var(--text-color);
            text-decoration: none;
            transition: color 0.3s;
        }
        .archive-title a:hover { color: var(--accent-color); }
        .archive-tags {
            font-size: 0.8em;
            display: flex;
            gap: 5px; /* Space between tags */
            flex-wrap: wrap; /* Allow tags to wrap */
            justify-content: flex-end; /* Align tags to the right if space allows */
            margin-left: 10px; /* Space from title */
        }
        .archive-tag .bi-tag {
            margin-right: 3px;
        }
         .page-header { /* Copied from index.html for consistency if needed */
            text-align: center;
            padding: 20px 0;
            margin-bottom: 20px;
        }
        .page-header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            color: var(--text-color);
        }
        .page-header p {
            font-size: 1.1em;
            color: var(--text-muted);
        }
        .no-blogs { text-align: center; padding: 20px; color: var(--text-muted); }
    </style>
</head>
<body>
    <nav class="navbar">
        <a href="index.html" class="navbar-brand">Tianjinsa</a>
        <ul class="navbar-links">
            <li><a href="index.html"><i class="bi bi-house"></i> 首页</a></li>
            <li><a href="archives.html" class="active"><i class="bi bi-archive"></i> 归档</a></li>
            <li><a href="tags.html"><i class="bi bi-tags"></i> 标签</a></li>
            <li><a href="about.html"><i class="bi bi-person"></i> 关于</a></li>
        </ul>
        <div class="navbar-toggle" id="navbar-toggle">
            <i class="bi bi-list"></i>
        </div>
    </nav>

    <div class="container">
        <div class="content-wrapper">
            <div class="page-header">
                <h1>博客归档</h1>
                <p>按时间浏览所有文章</p>
            </div>
            
            <div id="archives-content" class="archives-container">
                ${archivesContentHTML}
            </div>
        </div>

        <footer class="footer">
            <p>&copy; <span id="current-year">${new Date().getFullYear()}</span> Tianjinsa. 保留所有权利。</p>
            <p>使用 <a href="https://pages.github.com/" target="_blank">GitHub Pages</a> 构建</p>
        </footer>
    </div>
    
    <script>
        // Basic script for navbar toggle on mobile
        document.addEventListener('DOMContentLoaded', function() {
            const navbarToggleEl = document.getElementById('navbar-toggle');
            const navbarLinksEl = document.querySelector('.navbar-links');
            if (navbarToggleEl && navbarLinksEl) {
                navbarToggleEl.addEventListener('click', function() {
                    navbarLinksEl.classList.toggle('active');
                });
            }
            // current-year is set during generation
        });
    </script>
</body>
</html>`;
}

// Main script execution
function main() {
    try {
        const rawPosts = getPostData();
        if (rawPosts.length === 0) {
            console.warn(`No posts found in ${POSTS_DIR}. archives.html will be generated with a 'no posts' message.`);
        } else {
            console.log(`Found ${rawPosts.length} posts.`);
        }
        
        const groupedPosts = groupPosts(rawPosts);
        const archivesHTMLContent = generateArchivesPageHTML(groupedPosts);
        
        fs.writeFileSync(OUTPUT_FILE, archivesHTMLContent, 'utf-8');
        console.log(`Successfully generated ${OUTPUT_FILE}`);

    } catch (error) {
        console.error(`Error generating ${OUTPUT_FILE}:`, error);
        process.exit(1);
    }
}

main();
