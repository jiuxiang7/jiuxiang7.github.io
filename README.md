# 九湘的博客

基于 Hexo 7 + Butterfly 主题的静态博客，通过 GitHub Actions 自动发布到 GitHub Pages。

## 上线前必须改的四处

下面这些内容目前都是占位符，请替换成你自己的信息：

| 文件 | 位置 | 改成 |
| --- | --- | --- |
| `_config.yml` | `title` / `subtitle` / `description` / `keywords` | 站点名称与简介 |
| `_config.yml` | `author` | 你的名字 |
| `_config.yml` | `url` | `https://blog.gwpp.beauty` |
| `_config.butterfly.yml` | `social` / `aside.card_author.button.link` | 你的 GitHub 和邮箱 |

如果站点部署在子路径（仓库名不是 `用户名.github.io`），`_config.yml` 里还要加一行
`root: /仓库名/`，否则样式和图片会 404。

## 本地使用

```bash
npm install           # 首次安装依赖
npm run server        # 本地预览 http://localhost:4000
npm run preview       # 构建后预览 http://localhost:4100（与线上一致，支持进度条拖动）
npm run build         # 生成静态文件到 public/
npm run clean         # 清理缓存
npx hexo new "标题"    # 新建文章，写入 source/_posts/
```

## 发布流程

1. 在 GitHub 新建仓库，名称必须填 `jiuxiang7.github.io`（公开仓库才能免费用 Pages）。
2. 本地初始化并推送：

   ```bash
   git init -b main
   git add .
   git commit -m "init blog"
   git remote add origin https://github.com/jiuxiang7/jiuxiang7.github.io.git
   git push -u origin main
   ```

3. 打开仓库的 **Settings → Pages**，把 **Source** 设为 **GitHub Actions**。
4. 推送完成后 Actions 会自动构建部署，访问 `https://jiuxiang7.github.io`。

之后每次 `git push` 都会自动重新发布，不需要手动执行任何部署命令。

## 绑定自己的域名

1. 在仓库 **Settings → Pages → Custom domain** 填入 `blog.gwpp.beauty` 并保存。仓库里已有 `source/CNAME`，内容与之一致即可。
   以后换域名，这两处要同时改。
2. 到域名服务商添加解析记录：

   | 记录类型 | 主机记录 | 记录值 |
   | --- | --- | --- |
   | CNAME | `blog` | `jiuxiang7.github.io` |

3. 等 DNS 生效（几分钟到几小时），再回到 Pages 页面勾选 **Enforce HTTPS**。
4. `_config.yml` 里的 `url` 应为 `https://blog.gwpp.beauty`。

> 国内访问 GitHub Pages 的稳定性一般，晚高峰可能偏慢。如果哪天想换到国内 CDN，
> 只需要重新部署静态文件，文章内容不用动。

## 常用自定义

- **开启评论**：推荐 Giscus，在 <https://giscus.app> 生成配置后，
  把 `_config.butterfly.yml` 里 `comments.use` 设为 `Giscus` 并填好 `giscus` 段。
- **换成自己的头像**：图片放 `source/img/avatar.png`，再把 `_config.butterfly.yml`
  里的 `avatar.img` 改成 `/img/avatar.png`。
- **首页横幅**：在 `_config.butterfly.yml` 设置 `index_img` 指向一张图片。
- **代码高亮样式**：改 `code_blocks.theme`，可选 `darker` / `pale night` / `light` / `ocean`。
- **首页大横幅**：`disable_top_img: true` 时首页直接显示文章列表（当前已开启）。（`search.use: local_search`），依赖根目录 `_config.yml` 里的 `search` 段。

## 目录结构

```
_config.yml              站点配置（标题、域名、插件）
_config.butterfly.yml    主题配置（导航、外观、评论）
source/_posts/           文章
source/about/            关于页
scaffolds/               新建文章的模板
.github/workflows/       GitHub Actions 自动部署
source/music/            本地音乐文件（歌单自动生成）
scripts/                 构建期插件（歌单生成器）
public/                  构建产物，已被 git 忽略
```

## 音乐播放器

播放器挂在侧栏个人卡片下方，播放列表在构建时自动生成，不需要手动维护。

歌曲放在 `source/music/`，文件名决定显示内容：

- `歌手 - 歌名.mp3` → 艺术家「歌手」，曲名「歌名」
- `歌名.mp3` → 只显示曲名
- 支持格式：`mp3` / `flac` / `m4a` / `wav` / `ogg`
- 同名封面：`歌手 - 歌名.jpg`（也支持 png / webp / gif）
- 同名歌词：`歌手 - 歌名.lrc`

放好文件后执行 `npm run build` 或重启 `npm run server` 即可生效，生成结果在 `/music/playlist.json`。

播放器默认随机播放（`order: 'random'`）、列表折叠、音量 0.7，参数在 `source/js/music-player.js`。
浏览器禁止无交互自动播放，所以首次访问需要点一下页面，之后会自动续播。
`source/music/` 为空时播放器不会显示。