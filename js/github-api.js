/**
 * GitHub API 工具类
 * 用于与GitHub API交互获取仓库内容
 */

class GitHubAPI {
    /**
     * 创建GitHub API工具实例
     * @param {string} owner - 仓库所有者用户名
     * @param {string} repo - 仓库名称
     * @param {string} token - GitHub Personal Access Token (可选)
     */
    constructor(owner, repo, token = null) {
        this.owner = owner;
        this.repo = repo;
        this.token = token;
        this.apiBase = 'https://api.github.com';
    }

    /**
     * 构建请求头
     * @returns {Object} 请求头对象
     */
    getHeaders() {
        const headers = {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Blog-Generator'
        };

        if (this.token) {
            headers['Authorization'] = `token ${this.token}`;
        }

        return headers;
    }

    /**
     * 执行API请求
     * @param {string} endpoint - API端点
     * @param {Object} options - 请求选项
     * @returns {Promise<Object>} 请求响应
     */
    async request(endpoint, options = {}) {
        const url = `${this.apiBase}${endpoint}`;
        const requestOptions = {
            headers: this.getHeaders(),
            ...options
        };

        try {
            const response = await fetch(url, requestOptions);
            
            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status} - ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('GitHub API 请求出错:', error);
            throw error;
        }
    }    /**
     * 获取仓库内容
     * @param {string} path - 仓库内路径
     * @param {string} ref - 分支或提交引用
     * @returns {Promise<Object>} 仓库内容
     */
    async getRepoContents(path = '', ref = 'main') {
        return this.request(`/repos/${this.owner}/${this.repo}/contents/${path}?ref=${ref}`);
    }
    
    /**
     * 获取指定文件内容
     * @param {string} path - 文件路径
     * @param {string} ref - 分支或提交引用
     * @returns {Promise<string>} 文件内容
     */
    async getFileContent(path, ref = 'main') {
        const data = await this.request(`/repos/${this.owner}/${this.repo}/contents/${path}?ref=${ref}`);
        
        if (data.type !== 'file') {
            throw new Error(`Path is not a file: ${path}`);
        }
        
        // GitHub API 返回Base64编码的内容
        // 使用 decodeURIComponent 和 escape 来正确处理 UTF-8 编码的内容
        try {
            // 移除可能的换行符，然后解码
            const base64 = data.content.replace(/\s/g, '');
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            
            // 转换为字节数组
            for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
            }
            
            // 使用 TextDecoder 正确解码 UTF-8
            return new TextDecoder('utf-8').decode(bytes);
        } catch (error) {
            console.error('解码文件内容出错:', error);
            throw new Error('解码文件内容时出错: ' + error.message);
        }
    }

    /**
     * 获取目录下所有Markdown文件
     * @param {string} path - 目录路径
     * @param {string} ref - 分支或提交引用
     * @returns {Promise<Array>} Markdown文件列表
     */
    async getMarkdownFiles(path, ref = 'main') {
        const contents = await this.getRepoContents(path, ref);
        return contents.filter(item => item.type === 'file' && item.name.endsWith('.md'));
    }

    /**
     * 获取目录下所有Markdown文件及其内容
     * @param {string} path - 目录路径
     * @param {string} ref - 分支或提交引用
     * @returns {Promise<Array>} 包含文件名和内容的对象数组
     */
    async getMarkdownContents(path, ref = 'main') {
        const files = await this.getMarkdownFiles(path, ref);
        const contents = [];

        for (const file of files) {
            try {
                const content = await this.getFileContent(file.path, ref);
                contents.push({
                    name: file.name,
                    path: file.path,
                    content: content
                });
            } catch (error) {
                console.error(`获取文件 ${file.name} 内容失败:`, error);
            }
        }

        return contents;
    }
}

// 浏览器环境导出
if (typeof window !== 'undefined') {
    window.GitHubAPI = GitHubAPI;
}

// Node.js环境导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GitHubAPI;
}
