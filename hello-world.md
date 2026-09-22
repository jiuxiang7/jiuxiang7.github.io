---
title: 你好，世界
date: 2026-09-16 21:00:00
categories:
  - 随笔
description: 第一篇文章，聊聊这个博客是怎么搭起来的。
---

欢迎来到我的博客。

这个站点是用 [Hexo](https://hexo.io/) 加 [Butterfly](https://butterfly.js.org/) 主题搭建的，
托管在 GitHub Pages 上，没有自己的服务器。整套流程是：本地写 Markdown，推送到 GitHub，
GitHub Actions 自动构建并把生成的静态文件发布出去。

## 为什么选这套方案

- **零服务器成本**：GitHub Pages 承担托管，自定义域名和 HTTPS 都免费。
- **写作即提交**：一篇文章就是一个 Markdown 文件，版本可控，随时回滚。
- **主题成熟**：Butterfly 自带深色模式、目录、本地搜索和代码高亮。

## 怎么新增一篇文章

在项目根目录执行：

```bash
npx hexo new "文章标题"
```

命令会在 `source/_posts/` 下生成 Markdown 文件，写好内容后提交推送，网站就会自动更新。

```yaml
---
title: 文章标题
date: 2026-09-16 21:00:00
tags: [标签一, 标签二]
categories: [分类]
description: 首页卡片上显示的摘要。
---
```

> 上面这段是文章的头部信息（front-matter），Hexo 靠它识别标题、分类和摘要。

接下来就该写下第一篇正式的内容了。
