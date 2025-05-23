/**
 * setup-client-fallback.js
 * 
 * 这个脚本将客户端HTML文件复制到网站根目录，作为静态页面生成的备用方案。
 * 如果静态生成的页面不可用，用户将会看到这些客户端页面，它们会通过GitHub API动态加载内容。
 */

const fs = require('fs');
const path = require('path');

// 客户端HTML文件列表
const clientFiles = [
    { src: 'client-index.html', dest: 'index.html' },
    { src: 'client-archives.html', dest: 'archives.html' },
    { src: 'client-tags.html', dest: 'tags.html' },
    { src: 'post.html', dest: 'post.html' }
];

/**
 * 复制文件
 * @param {string} source 源文件路径
 * @param {string} destination 目标文件路径
 */
function copyFile(source, destination) {
    try {
        const content = fs.readFileSync(source, 'utf-8');
        fs.writeFileSync(destination, content, 'utf-8');
        console.log(`复制文件成功: ${source} -> ${destination}`);
    } catch (error) {
        console.error(`复制文件失败 ${source} -> ${destination}:`, error);
    }
}

/**
 * 设置客户端备用方案
 */
function setupClientFallback() {
    console.log('设置客户端备用方案...');
    
    clientFiles.forEach(file => {
        const sourcePath = path.join(__dirname, '..', file.src);
        const destPath = path.join(__dirname, '..', file.dest);
        
        // 检查源文件是否存在
        if (fs.existsSync(sourcePath)) {
            copyFile(sourcePath, destPath);
        } else {
            console.warn(`警告: 源文件不存在: ${sourcePath}`);
        }
    });
    
    console.log('客户端备用方案设置完成！');
}

// 执行设置
setupClientFallback();
