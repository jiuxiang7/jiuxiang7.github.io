# 我的博客

基于 Hexo 7 + Butterfly 主题的静态博客，通过 GitHub Actions 自动发布到 GitHub Pages。

## 上线前必须改的四处

下面这些内容目前都是占位符，请替换成你自己的信息：

| 文件 | 位置 | 改成 |
| --- | --- | --- |
| `_config.yml` | `title` / `subtitle` / `description` / `keywords` | 站点名称与简介 |
| `_config.yml` | `author` | 你的名字 |
| `_config.yml` | `url` | `https://你的用户名.github.io`（绑定自定义域名则填域名） |
| `_config.butterfly.yml` | `social` / `aside.card_author.button.link` | 你的 GitHub 和邮箱 |

如果站点部署在子路径（仓库名不是 `用户名.github.io`），`_config.yml` 里还要加一行
`root: /仓库名/`，否则样式和图片会 404。

## 本地使用

```bash
npm install           # 首次安装依赖
npm run server        # 本地预览 http://localhost:4000
npm run build         # 生成静态文件到 public/
npm run clean         # 清理缓存
npx hexo new "标题"    # 新建文章，写入 source/_posts/
```

## 发布流程

1. 在 GitHub 新建一个仓库，比如 `blog`（公开仓库才能免费用 Pages）。
2. 本地初始化并推送：

   ```bash
   git init -b main
   git add .
   git commit -m "init blog"
   git remote add origin https://github.com/你的用户名/blog.git
   git push -u origin main
   ```

3. 打开仓库的 **Settings → Pages**，把 **Source** 设为 **GitHub Actions**。
4. 推送完成后 Actions 会自动构建部署，访问 `https://你的用户名.github.io/blog/`。

之后每次 `git push` 都会自动重新发布，不需要手动执行任何部署命令。

## 绑定自己的域名

1. 在仓库 **Settings → Pages → Custom domain** 填入域名并保存，GitHub 会往仓库写入 `CNAME` 文件，
   建议把它一起提交，避免以后被覆盖。
2. 到域名服务商添加解析记录：

   | 记录类型 | 主机记录 | 记录值 |
   | --- | --- | --- |
   | A | `@` | `185.199.108.153` |
   | A | `@` | `185.199.109.153` |
   | A | `@` | `185.199.110.153` |
   | A | `@` | `185.199.111.153` |
   | CNAME | `www` | `你的用户名.github.io` |

3. 等 DNS 生效（几分钟到几小时），再回到 Pages 页面勾选 **Enforce HTTPS**。
4. 同步把 `_config.yml` 里的 `url` 改成 `https://你的域名`。

> 国内访问 GitHub Pages 的稳定性一般，晚高峰可能偏慢。如果哪天想换到国内 CDN，
> 只需要重新部署静态文件，文章内容不用动。

## 常用自定义

- **开启评论**：推荐 Giscus，在 <https://giscus.app> 生成配置后，
  把 `_config.butterfly.yml` 里 `comments.use` 设为 `Giscus` 并填好 `giscus` 段。
- **换成自己的头像**：图片放 `source/img/avatar.png`，再把 `_config.butterfly.yml`
  里的 `avatar.img` 改成 `/img/avatar.png`。
- **首页横幅**：在 `_config.butterfly.yml` 设置 `index_img` 指向一张图片。
- **代码高亮样式**：改 `code_blocks.theme`，可选 `darker` / `pale night` / `light` / `ocean`。
- **本地搜索**：已启用（`search.use: local_search`），依赖根目录 `_config.yml` 里的 `search` 段。

## 目录结构

```
_config.yml              站点配置（标题、域名、插件）
_config.butterfly.yml    主题配置（导航、外观、评论）
source/_posts/           文章
source/about/            关于页
scaffolds/               新建文章的模板
.github/workflows/       GitHub Actions 自动部署
public/                  构建产物，已被 git 忽略
```
