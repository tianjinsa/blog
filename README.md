# Tianjinsa博客

一个现代化的静态博客系统，专为GitHub Pages设计，支持用户本地生成或浏览器中动态加载内容。

## 功能特点

- 🚀 纯静态网站，完全兼容GitHub Pages
- 📝 使用Markdown编写文章
- 🏷️ 支持标签分类和浏览
- 📊 按年月自动生成归档页面
- 📱 响应式设计，适配移动设备
- 🌙 暗色主题
- ⚡ 代码语法高亮
- 📑 文章目录自动生成
- 👁️ 基于localStorage的本地阅读计数
- 🗺️ 自动生成站点地图
- 📝 在线博客编辑器，直接保存到GitHub仓库
- 📄 RSS Feed 通过GitHub Actions自动生成
- 💬 通过Utterances支持评论 (基于GitHub Issues)
- ⚙️ 集中化配置系统，便于管理和扩展
- 🔄 双模式内容加载：本地生成或浏览器中通过GitHub API动态加载

## 系统架构

本博客系统有两种内容生成模式：

1. **本地生成模式**：在用户本地机器上，通过GitHub API获取仓库中的Markdown文件，然后生成静态HTML页面，可直接上传到GitHub Pages托管。
2. **浏览器动态加载模式**：当用户访问网站时，页面会通过GitHub API直接获取仓库中的文章内容，并在浏览器中动态渲染显示。这种模式作为备用，确保即使没有本地生成，网站也能正常工作。
3. **RSS生成**：通过GitHub Actions自动生成RSS订阅源，保证RSS内容始终与最新文章同步。

## 配置系统

本博客使用集中化的配置文件管理所有设置。配置文件位于 `js/config.js`。查看 [配置说明文档](CONFIG.md) 了解详情。

## 快速开始

### 安装依赖

```bash
npm install
```

### 创建和编辑文章

本博客使用 `blog-editor.html` 进行在线文章创建和编辑。

1. **获取GitHub个人访问令牌 (PAT):**
   * 你需要一个具有 `repo` 权限的GitHub PAT，以便编辑器可以将文章保存到你的仓库。
   * 创建令牌后，请妥善保管。
2. **使用编辑器:**
   * 在本地打开 `blog-editor.html` 文件。
   * 首次使用时，编辑器会提示输入你的GitHub PAT。输入后，它会被保存在浏览器的localStorage中，方便后续使用。
   * 填写文章标题、描述、标签（逗号分隔）和Markdown内容。
   * 点击"发布博客"按钮。文章将以 `YYYY-MM-DD-HH-MM-SS-标题.md` 的格式保存到仓库的 `_posts/` 目录下。

### 本地生成模式

在本地生成所有静态HTML文件后上传到GitHub Pages：

```bash
# 生成所有页面
npm run build

# 测试生成的页面
npm run dev
```

生成完成后，你可以将整个目录推送到GitHub Pages分支。

### 浏览器动态加载模式

这是一个自动备用方案。如果你没有在本地生成HTML文件，或者访问者访问的页面不存在，系统会自动使用浏览器中的GitHub API动态加载内容。

要测试这种模式：

1. 直接打开 `client-index.html`、`client-archives.html` 或 `client-tags.html` 文件
2. 这些页面会通过GitHub API自动获取并显示博客内容

## RSS订阅

本博客的RSS Feed (`rss.xml`) 由GitHub Actions自动生成，每当有新文章推送到仓库时会自动更新。

## 目录结构

```plaintext
.
├── _posts/                # 存放Markdown博客文章
├── posts/                 # 生成的HTML博客文章
├── js/
│   ├── config.js          # 全局配置文件
│   ├── github-api.js      # GitHub API封装
│   ├── client-loader.js   # 客户端动态加载脚本
│   └── read-count.js      # 本地阅读计数功能
├── client-index.html      # 客户端动态加载的首页
├── client-archives.html   # 客户端动态加载的归档页面
├── client-tags.html       # 客户端动态加载的标签页面
├── post.html              # 客户端动态加载的文章页面
├── assets/                # (可选) 存放图片等静态资源
├── about.html             # 关于页面
├── archives.html          # 归档页面 (由本地生成)
├── blog-editor.html       # 博客编辑器(管理员使用)
├── blog-editor.css        # 博客编辑器样式
├── blog-editor.js         # 博客编辑器脚本
├── index.html             # 博客首页 (由本地生成)
├── package.json           # 项目配置
├── README.md              # 项目说明
├── robots.txt             # 搜索引擎爬虫指南
├── rss.xml                # RSS Feed文件 (由GitHub Actions自动生成)
├── sitemap.xml            # 站点地图 (由本地生成)
├── styles.css             # 全局样式
├── tags.html              # 标签页面 (由本地生成)
├── template.html          # 博客文章模板
└── .github/workflows/     # GitHub Actions工作流配置
    └── generate-rss.yml   # RSS自动生成工作流
```

## 写作指南

### 文章格式

每篇文章开头需要包含Front Matter信息：

```markdown
---
title: "文章标题"
date: "2025-05-23T12:34:08.177Z" # 建议使用ISO 8601格式的日期时间
description: "文章描述，将显示为摘要"
tags: ["标签1", "标签2"] # 标签列表
---

正文内容从这里开始...
```

### 支持的Markdown语法

- 标题：# h1, ## h2, ### h3
- 文本格式：**粗体**, *斜体*, ~~删除线~~
- 链接：[文本](URL)
- 图片：![替代文本](图片URL)
- 列表：
  - 无序列表：- 项目
  - 有序列表：1. 项目
- 引用：> 引用文本
- 代码块：\```语言名称 代码 \```
- 表格，水平线等

## 自定义

### 修改主题

编辑`styles.css`文件中的CSS变量：

```css
:root {
    --primary-color: #87ceeb;
    --background-dark: #1a1a1a;
    --background-light: #282828;
    --text-color: #e0e0e0;
    --text-muted: #b0b0b0;
    --border-color: #444444;
    --accent-color: #87ceeb;
}
```

### 修改模板

编辑`template.html`文件，可以自定义博客文章的HTML结构和样式。

## 部署

部署此博客到 GitHub Pages 通常涉及以下步骤：

1. **编写/编辑文章:**
   * 使用 `blog-editor.html` 创建或修改文章。编辑器会将Markdown文件保存到你的GitHub仓库的 `_posts/` 目录中。

2. **构建静态站点:**
   * 将仓库的最新更改拉取到本地。
   * 在本地项目根目录下运行 `npm run build`。这将通过GitHub API获取所有文章并生成静态站点文件。

3. **推送更改到GitHub Pages:**
   * GitHub Pages可以从特定分支（如 `gh-pages`）或主分支的 `docs/` 目录提供服务。
   * 将所有构建后的文件提交到GitHub Pages分支。

4. **RSS自动更新:**
   * 当新文章推送到仓库时，GitHub Actions会自动生成并更新RSS订阅源。

确保你的 CNAME 文件（如果使用自定义域名）位于你用于部署的分支的根目录。

## 许可证

MIT 许可证
