// 文件：generate-posts.js
// 功能：将Markdown博客文件转换为HTML页面

const fs = require('fs');
const path = require('path');
const marked = require('marked');
const matter = require('gray-matter');

// 导入全局配置
const BLOG_CONFIG = require('./js/config.js');

// 定义目录
const POSTS_DIR = path.join(__dirname, BLOG_CONFIG.BLOG_PATH); // 使用全局配置的博客路径
const OUTPUT_DIR = path.join(__dirname, BLOG_CONFIG.POST_OUTPUT_DIR);
const TEMPLATE_PATH = path.join(__dirname, 'template.html');

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// 确保博客文章目录存在
if (!fs.existsSync(POSTS_DIR)) {
    console.error(`Error: Blog posts directory not found at ${POSTS_DIR}`);
    process.exit(1); // Exit if the directory doesn't exist
}

// 读取模板文件
const templateContent = fs.readFileSync(TEMPLATE_PATH, 'utf-8');

// 获取所有博客文件
const blogFiles = fs.readdirSync(POSTS_DIR).filter(file => file.endsWith('.md'));

// 配置 marked
marked.setOptions({
    highlight: function(code, lang) {
        const language = lang || 'plaintext';
        return `<pre class="language-${language}"><code class="language-${language}">${code}</code></pre>`;
    },
    langPrefix: 'language-',
    headerIds: true,
    gfm: true,
    breaks: false
});

// 处理每一个博客文件
blogFiles.forEach(file => {
    const filePath = path.join(POSTS_DIR, file);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    // 解析 front matter
    const { data, content } = matter(fileContent);
      // 处理日期
    let date = file.substring(0, 19); // 从文件名获取日期
    if (data.date) {
        const dateObj = new Date(data.date);
        date = dateObj.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
      // 处理标题
    const title = data.title || file.replace(/^\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}-/, '').replace('.md', '');
    
    // 处理标签
    const tags = data.tags || [];
    const tagsHTML = tags.length > 0 
        ? tags.map(tag => `<span class="tag"><i class="bi bi-tag"></i> ${tag}</span>`).join(' ')
        : '';
    
    // 生成关键词 meta 标签内容
    const keywords = [...tags, title, 'Tianjinsa', '博客'].join(', ');
    
    // 生成描述 meta 标签内容
    let description = '';
    if (data.description) {
        description = data.description;
    } else {
        // 从内容中提取前150个字符作为描述
        const plainText = content.replace(/#+\s+/g, '').replace(/\n/g, ' ').replace(/\s+/g, ' ');
        description = plainText.substring(0, 150) + (plainText.length > 150 ? '...' : '');
    }
    
    // 转换 Markdown 为 HTML
    const htmlContent = marked(content);
    
    // 生成输出文件名
    const outputFile = file.replace('.md', '.html');
    const outputPath = path.join(OUTPUT_DIR, outputFile);
    
    // 替换模板中的变量
    let outputContent = templateContent
        .replace(/BLOG_TITLE/g, title)
        .replace(/BLOG_DATE/g, date)
        .replace(/BLOG_DESCRIPTION/g, description)
        .replace(/BLOG_KEYWORDS/g, keywords)
        .replace(/BLOG_TAGS/g, tagsHTML)
        .replace(/BLOG_CONTENT/g, htmlContent)
        .replace(/BLOG_URL/g, `https://tianjinsa.github.io/blog/posts/${outputFile}`);
    
    // 写入输出文件
    fs.writeFileSync(outputPath, outputContent);
    console.log(`Generated ${outputFile}`);
});

console.log(`Successfully generated ${blogFiles.length} blog posts!`);
