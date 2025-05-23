# Tianjinsa博客

这是一个基于Node.js构建的纯静态博客       *   点击"发布博客"按钮。文章将以 `YYYY-MM-DD-标题.md` 的格式保存到仓库的 `_posts/` 目录下。*   填写文章标题、描述、标签（逗号分隔）和Markdown内容。
    *   点击"发布博客"按钮。文章将以 `YYYY-MM-DD-标题.md` 的格式保存到仓库的 `_posts/` 目录下。
3.  **重要提示:** 使用在线编辑器保存文章后，你需要执行构建步骤并将更改推送到GitHub Pages才能使文章在网站上可见。参考下面的"生成静态文件"和"部署"部分。使用Markdown编写文章，最终部署到GitHub Pages。文章的编写可以通过在线编辑器完成。

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
- 📄 RSS Feed (`rss.xml`)
- 💬 通过Utterances支持评论 (基于GitHub Issues)
- ⚙️ 集中化配置系统，便于管理和扩展

## 配置系统

本博客使用集中化的配置文件管理所有设置。配置文件位于 `js/config.js`。查看 [配置说明文档](CONFIG.md) 了解详情。

## 快速开始

### 安装依赖

```bash
npm install
```

### 创建和编辑文章

本博客使用 `blog-editor.html` 进行在线文章创建和编辑。

1.  **获取GitHub个人访问令牌 (PAT):**
    *   你需要一个具有 `repo` 权限的GitHub PAT，以便编辑器可以将文章保存到你的仓库。
    *   创建令牌后，请妥善保管。
2.  **使用编辑器:**
    *   在本地打开 `blog-editor.html` 文件。
    *   首次使用时，编辑器会提示输入你的GitHub PAT。输入后，它会被保存在浏览器的localStorage中，方便后续使用。
    *   填写文章标题、描述、标签（逗号分隔）和Markdown内容。
    *   点击“发布博客”按钮。文章将以 `YYYY-MM-DD-标题.md` 的格式保存到仓库的 `blog/_posts/` 目录下。
3.  **重要提示:** 使用在线编辑器保存文章后，你需要执行构建步骤并将更改推送到GitHub Pages才能使文章在网站上可见。参考下面的“生成静态文件”和“部署”部分。

### 生成HTML文件

```bash
npm run build
```

此命令会处理 `_posts/` 目录下的Markdown源文件，并生成整个静态站点。具体包括：`posts/` 目录下的单个文章HTML文件，根目录下的静态 `index.html`、`archives.html` 和 `tags.html`，以及 `sitemap.xml` 和 `rss.xml`。

### 本地预览

```bash
npm run dev
```

启动本地服务器，默认访问地址：http://localhost:8080

## 目录结构

```plaintext
.
├── _posts/                # 存放Markdown博客文章
├── posts/                # 生成的HTML博客文章
├── js/
│   └── read-count.js     # 本地阅读计数功能
├── assets/               # (可选) 存放图片等静态资源
├── about.html            # 关于页面
├── archives.html         # 归档页面 (用户调用github api在用户机器上自动生成内容)
├── blog-editor.html      # 博客编辑器(管理员使用)
├── blog-editor.css       # 博客编辑器样式
├── blog-editor.js        # 博客编辑器脚本
├── generate-posts.js     # 将Markdown转换为HTML的脚本
├── generate-rss.js       # 生成RSS Feed的脚本
├── generate-sitemap.js   # 生成站点地图的脚本
├── index.html            # 博客首页 (用户调用github api在用户机器上自动生成内容)
├── package.json          # 项目配置
├── README.md             # 项目说明
├── robots.txt            # 搜索引擎爬虫指南
├── rss.xml               # RSS Feed文件 (自动生成)
├── sitemap.xml           # 站点地图 (自动生成)
├── styles.css            # 全局样式
├── tags.html             # 标签页面 (用户调用github api在用户机器上自动生成内容)
└── template.html         # 博客文章模板
```

## 写作指南

### 文章格式

每篇文章开头需要包含Front Matter信息：

```markdown
---
title: "文章标题"
date: "2025-05-20T12:34:08.177Z" # 建议使用ISO 8601格式的日期时间
description: "文章描述，将显示为摘要"
tags: ["标签1", "标签2"] # 标签列表
# layout: post # 此字段不再强制，可移除
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
编辑`index.html`, `archives.html`, `tags.html`的生成脚本（`generate-*.js`）可以修改这些页面的结构。

## 部署

部署此博客到 GitHub Pages 通常涉及以下步骤：

1.  **编写/编辑文章:**
    *   使用 `blog-editor.html` (如上所述) 创建或修改文章。编辑器会将Markdown文件保存到你的GitHub仓库的 `_posts/` 目录中（例如，`main` 分支）。

2.  **构建静态站点:**
    *   将仓库的最新更改拉取到本地。
    *   在本地项目根目录下运行 `npm run build`。这将生成所有静态站点文件 (HTML页面、RSS feed、站点地图等)。

3.  **推送更改到GitHub Pages:**
    *   GitHub Pages可以从特定分支（如 `gh-pages`）或主分支的 `docs/` 目录提供服务。
    *   **选项 A (推荐: `gh-pages` 分支):**
        *   将所有构建后的文件 (包括 `index.html`, `posts/`, `archives.html`, `tags.html`, `sitemap.xml`, `rss.xml`, `styles.css`, `js/`, `assets/` 等，但不包括 `node_modules` 或源Markdown文件 `_posts` 除非你有意也将其部署) 提交到一个名为 `gh-pages` 的分支。
        *   确保你的仓库设置为从 `gh-pages` 分支提供GitHub Pages服务。
    *   **选项 B (`docs/` 目录):**
        *   将所有构建后的文件复制到主分支（或你选择的默认分支）下的 `docs/` 目录中。
        *   提交这些更改。
        *   确保你的仓库设置为从主分支的 `docs/` 目录提供GitHub Pages服务。

4.  **(可选) 使用 GitHub Actions 自动化:**
    *   为了简化部署流程，你可以设置一个 GitHub Action。这个 Action 可以在你推送到 `main` 分支的 `_posts/` 目录时自动运行 `npm run build`，然后将生成的文件部署到你的 `gh-pages` 分支或 `docs/` 目录。这是推荐的高级设置。

确保你的 CNAME 文件（如果使用自定义域名）位于你用于部署的分支的根目录（或 `docs/` 目录的根，取决于你的设置）。

## 许可证

MIT 许可证
