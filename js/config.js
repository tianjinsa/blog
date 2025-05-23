// 全局配置文件
// 这个文件包含了博客系统的通用配置

const BLOG_CONFIG = {
    // GitHub 相关配置
    GITHUB_REPO_OWNER: 'tianjinsa',     // GitHub 用户名
    GITHUB_REPO_NAME: 'blog',           // 仓库名
    BLOG_PATH: '_posts',                // 博客文件存储路径
    API_VERSION: 'v3',                  // GitHub API 版本
    DEFAULT_BRANCH: 'main',             // 默认分支
    
    // 博客网站相关配置
    SITE_URL: 'https://blog.tianjinsa.top',  // 网站URL
    SITE_TITLE: 'Tianjinsa的博客',           // 网站标题
    SITE_DESCRIPTION: 'Tianjinsa的博客 - 分享技术文章和个人心得', // 网站描述
    
    // 生成脚本相关配置 
    POSTS_PER_PAGE: 5,                  // 每页显示的文章数量（用于分页）
    MAX_RSS_ITEMS: 20,                  // RSS feed中最大的文章数量
    
    // 博客文件输出相关设置
    POST_OUTPUT_DIR: 'posts'            // 生成的HTML文章的输出目录
};

// 暴露配置对象给其他脚本使用
if (typeof module !== 'undefined' && module.exports) {
    // Node.js 环境
    module.exports = BLOG_CONFIG;
} else {
    // 浏览器环境
    window.BLOG_CONFIG = BLOG_CONFIG;
}
