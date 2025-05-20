// 本地阅读记录功能
// 此脚本使用浏览器本地存储记录您在当前设备上的文章阅读次数
// 注意：计数仅在您的设备上有效，不会在多个设备间同步

document.addEventListener('DOMContentLoaded', function() {
    // 使用localStorage跟踪本地已读文章
    function trackLocalPageView() {
        // 获取当前页面标识符
        const pathname = window.location.pathname;
        // 当前页面是否是博客文章页面
        if (pathname.includes('/posts/') && pathname.endsWith('.html')) {
            // 获取文章ID，使用pathname作为唯一标识
            const articleId = pathname;
            // 从localStorage获取本地阅读记录
            let readArticles = JSON.parse(localStorage.getItem('readArticles') || '{}');
            
            // 更新本地阅读记录
            if (!readArticles[articleId]) {
                readArticles[articleId] = {
                    count: 0,
                    lastRead: null
                };
            }
            
            const now = new Date().toISOString();
            const lastRead = readArticles[articleId].lastRead;
            
            // 如果是首次阅读或距离上次阅读超过30分钟，则计数器+1
            if (!lastRead || new Date(now) - new Date(lastRead) > 30 * 60 * 1000) {
                readArticles[articleId].count += 1;
            }
            
            readArticles[articleId].lastRead = now;
            
            // 保存更新后的阅读记录到本地存储
            localStorage.setItem('readArticles', JSON.stringify(readArticles));
            
            // 更新页面上的本地阅读计数
            updateLocalReadCount(readArticles[articleId].count);
        }
    }
    
    // 更新页面上的本地阅读计数显示
    function updateLocalReadCount(count) {
        const readCountEl = document.getElementById('read-count');
        if (readCountEl) {
            readCountEl.textContent = count;
        }
    }
    
    // 执行本地阅读记录
    trackLocalPageView();
});
