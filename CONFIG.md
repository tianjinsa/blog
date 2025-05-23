# 博客系统配置说明

## 全局配置文件

本博客系统使用了全局配置文件 `js/config.js`，用于集中管理所有的配置参数。这种方式有以下优点：

1. 集中管理所有配置，便于修改
2. 避免配置分散在多个文件中导致的不一致
3. 便于未来扩展配置项

## 配置项说明

配置文件中包含以下主要配置项：

### GitHub 相关配置
- `GITHUB_REPO_OWNER`: GitHub 用户名
- `GITHUB_REPO_NAME`: 博客仓库名
- `BLOG_PATH`: 博客文件存储路径
- `API_VERSION`: GitHub API 版本
- `DEFAULT_BRANCH`: 默认分支名称

### 博客网站相关配置
- `SITE_URL`: 网站 URL
- `SITE_TITLE`: 网站标题
- `SITE_DESCRIPTION`: 网站描述

### 生成脚本相关配置
- `POSTS_PER_PAGE`: 每页显示的文章数量（用于分页）
- `MAX_RSS_ITEMS`: RSS feed 中最大的文章数量

### 博客文件输出相关设置
- `POST_OUTPUT_DIR`: 生成的 HTML 文章的输出目录

## 如何修改配置

如需修改配置，只需编辑 `js/config.js` 文件中的相应值即可。所有使用这些配置的文件都会自动使用更新后的值。

## 注意事项

1. 修改 `BLOG_PATH` 或 `POST_OUTPUT_DIR` 可能需要同时调整相应的目录结构
2. 修改 `DEFAULT_BRANCH` 需要确保 GitHub 仓库中实际有该分支存在
3. 保持配置文件的格式一致，确保 JavaScript 语法正确

## 适用文件

以下文件使用了全局配置：

- blog-editor.js：博客编辑器
- generate-posts.js：生成博客文章 HTML 页面
- generate-rss.js：生成 RSS Feed
- generate-sitemap.js：生成网站地图
