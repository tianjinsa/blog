# Tianjinsa博客

这是一个基于GitHub Pages的纯静态博客系统，使用Markdown编写文章，自动转换为HTML页面。所有功能均在客户端（浏览器）中运行，无需服务器端支持。

## 功能特点

- 🚀 纯静态网站，完全兼容GitHub Pages
- 📝 使用Markdown编写文章
- 🏷️ 支持标签分类和浏览
- 📊 按年月自动生成归档页面
- 🔍 客户端文章搜索功能
- 📱 响应式设计，适配移动设备
- 🌙 暗色主题
- ⚡ 代码语法高亮
- 📑 文章目录自动生成
- 👁️ 基于localStorage的本地阅读计数
- 🗺️ 自动生成站点地图

## 快速开始

### 安装依赖

```bash
npm install
```

### 创建新文章

```bash
npm run create
```

按照提示输入文章标题、描述和标签，系统会自动创建对应的Markdown文件。

### 生成HTML文件

```bash
npm run build
```

此命令会将`_posts`目录下的Markdown文件转换为HTML文件，并放置在`posts`目录下。

### 本地预览

```bash
npm run dev
```

启动本地服务器，默认访问地址：http://localhost:8080

## 目录结构

```plaintext
.
├── _posts/               # 存放Markdown博客文章
├── posts/                # 生成的HTML博客文章
├── js/
│   └── read-count.js     # 本地阅读计数功能
├── about.html            # 关于页面
├── archives.html         # 归档页面
├── blog-editor.html      # 博客编辑器(管理员使用)
├── blog-editor.css       # 博客编辑器样式
├── blog-editor.js        # 博客编辑器脚本
├── create-post.js        # 创建新文章的脚本
├── generate-posts.js     # 将Markdown转换为HTML的脚本
├── generate-sitemap.js   # 生成站点地图的脚本
├── index.html            # 博客首页
├── package.json          # 项目配置
├── README.md             # 项目说明
├── robots.txt            # 搜索引擎爬虫指南
├── sitemap.xml           # 站点地图(自动生成)
├── styles.css            # 全局样式
├── tags.html             # 标签页面
└── template.html         # 博客文章模板
```

## 写作指南

### 文章格式

每篇文章开头需要包含Front Matter信息：

```markdown
---
title: "文章标题"
date: "2025-05-20T12:34:08.177Z"
description: "文章描述，将显示为摘要"
tags: ["标签1", "标签2"]
layout: post
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

将整个博客目录推送到GitHub仓库，并在仓库设置中启用GitHub Pages功能。

## 许可证

MIT 许可证
