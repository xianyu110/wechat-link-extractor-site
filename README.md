# WeChat Link Extractor Site

一个轻量的链接解析与媒体提取工具。最初用于提取微信公众号文章，现在也支持把抖音、B 站、小红书等平台的分享链接解析成结构化数据，并尽量提取页面里的图片、封面和视频候选链接。

如果你在整理文章、图片或封面素材时还想先补一张视觉图，可以用 [GPT Image 2](https://gptimage2.asia/) 先出图，再继续发布流程。

项目由两部分组成：

- 静态展示页：`docs/`，可部署到 GitHub Pages、Netlify 等静态托管。
- 在线 API：`api/`，使用 Playwright 打开真实页面并返回结构化 JSON。

## 功能特性

- 支持直接粘贴完整分享口令，自动识别其中第一个 URL。
- 支持微信公众号文章正文、图片、视频提取。
- 支持抖音、B 站、小红书等短视频/图文页面的视频候选链接解析。
- 支持导出 `article.json` 和 `article.md`。
- 支持在网页端预览正文、图片、视频链接。
- 支持把图片、视频或全部媒体打包成 zip 下载。

## 支持平台

| 平台 | 支持输入示例 | 说明 |
| --- | --- | --- |
| 微信公众号 | `https://mp.weixin.qq.com/s/...` | 提取标题、公众号、作者、正文、图片、视频 |
| 抖音 | `https://v.douyin.com/...`、完整分享口令 | 自动跳转真实页面，提取封面、图片、视频候选链接 |
| B 站 | `https://www.bilibili.com/video/...`、`https://b23.tv/...` | 提取页面元信息和视频候选链接 |
| 小红书 | `https://www.xiaohongshu.com/...`、`https://xhslink.com/...` | 提取页面元信息、图片、视频候选链接 |
| 其他网页 | 任意 `http/https` URL | 走通用媒体解析逻辑，尽量提取页面中的媒体链接 |

> 说明：短视频平台会频繁调整网页结构和防盗链策略，因此结果会以“候选链接”为主；部分链接可能需要携带来源页或在有效期内下载。

## 安装

```bash
npm install
```

## 本地运行

启动 API：

```bash
npm run dev:api
```

默认 API 地址：

```text
http://127.0.0.1:4311
```

启动静态页面：

```bash
npm run serve
```

然后打开：

```text
http://127.0.0.1:4173
```

本地静态页会自动把 API 地址从 `4173` 推断为 `4311`。

## 网页端使用

进入页面后选择“在线提取”，输入框可以粘贴：

```text
https://mp.weixin.qq.com/s/hfRsnvpWeMqPZQe6T7Xr6Q
```

也可以粘贴完整分享口令：

```text
7.94 复制打开抖音，看看【J.的图文作品】五一见一面吧 你穿裙子 我带花 位置你定 不是宾馆... https://v.douyin.com/u7OcxidjHzQ/ Kjc:/ 08/12 r@E.ho
```

提取完成后页面会展示：

- 标题、平台、账号/公众号、作者、发布时间
- 正文预览和完整正文
- 图片列表
- 视频候选链接列表
- JSON / Markdown 下载入口
- 图片、视频、全部媒体打包下载按钮

## CLI 使用

提取微信公众号文章：

```bash
node ./scripts/extract-wechat.js "https://mp.weixin.qq.com/s/hfRsnvpWeMqPZQe6T7Xr6Q"
```

提取完整分享口令：

```bash
node ./scripts/extract-wechat.js "7.94 复制打开抖音 https://v.douyin.com/u7OcxidjHzQ/"
```

同时下载图片和视频：

```bash
node ./scripts/extract-wechat.js "https://mp.weixin.qq.com/s/hfRsnvpWeMqPZQe6T7Xr6Q" --download-all
```

常用参数：

```text
--url <input>             文章/视频 URL 或完整分享口令
--out-dir <dir>           输出目录
--format <list>           输出格式：json,md
--download-images         下载图片
--download-videos         下载视频
--download-all            下载图片和视频
--wait-ms <ms>            页面加载后的额外等待时间，默认 3500
--page-data-dir <dir>     额外导出到 GitHub Pages 数据目录
```

## API 使用

### 提取内容

接口：

```text
POST /api/extract
```

请求：

```bash
curl -X POST http://127.0.0.1:4311/api/extract \
  -H 'content-type: application/json' \
  -d '{"input":"https://v.douyin.com/u7OcxidjHzQ/"}'
```

也可以传完整分享口令：

```bash
curl -X POST http://127.0.0.1:4311/api/extract \
  -H 'content-type: application/json' \
  -d '{"input":"7.94 复制打开抖音 https://v.douyin.com/u7OcxidjHzQ/"}'
```

返回示例：

```json
{
  "ok": true,
  "data": {
    "url": "https://www.douyin.com/...",
    "source_url": "https://v.douyin.com/...",
    "platform": "douyin",
    "platform_name": "抖音",
    "title": "作品标题",
    "images": [],
    "videos": []
  }
}
```

### 打包下载媒体

接口：

```text
POST /api/bundle
```

请求体传入 `/api/extract` 返回的 `data`：

```json
{
  "article": {},
  "includeImages": true,
  "includeVideos": true
}
```

成功时返回 zip 文件，里面包含：

- `article.json`
- `article.md`
- `manifest.json`
- `images/`
- `videos/`
- `failed-downloads.txt`，仅当部分媒体下载失败时生成

## 产物位置

默认 CLI 输出：

- 结构化结果：`output/latest/<article-slug>/article.json`
- Markdown：`output/latest/<article-slug>/article.md`
- 图片：`output/latest/<article-slug>/images/`
- 视频：`output/latest/<article-slug>/videos/`
- GitHub Pages 数据：`docs/data/article.json` 和 `docs/data/article.md`

## 线上部署

这个项目建议拆成两个服务部署：

- 静态页：部署 `docs/` 到 GitHub Pages、Netlify 或其他静态托管。
- API：部署项目根目录到 Vercel 或其他支持 Node.js Serverless 的平台。

前端有两种方式指定 API 地址。

方式 1：查询参数：

```text
https://your-static-site.example.com/?api=https://your-api.example.com
```

方式 2：在页面加载前注入全局变量：

```html
<script>
  window.WECHAT_EXTRACT_API_BASE = 'https://your-api.example.com';
</script>
```

如果你的网络环境对 `vercel.app` 不稳定，建议绑定自己的 API 域名。

## 检查命令

```bash
npm run check
```

该命令会对核心 JS 文件执行语法检查。

## 常见问题

### 前端提示 Failed to fetch

通常不是链接格式错误，而是当前网络无法访问配置的 API 域名。可以检查：

1. API 域名是否可访问。
2. 静态页是否正确配置了 `WECHAT_EXTRACT_API_BASE`。
3. 是否需要把 `vercel.app` 换成自定义域名。
4. 本地是否已经同时启动 `npm run dev:api` 和 `npm run serve`。

### 视频链接无法下载

短视频平台的视频 URL 通常有有效期、防盗链或地区限制。建议：

1. 提取后尽快下载。
2. 优先使用页面里的“打包下载视频”按钮。
3. 如果失败，打开视频候选链接确认是否已经过期。
4. 适当增大 CLI 的 `--wait-ms`，让页面加载更多媒体请求。

### 为什么会出现多个视频候选链接

页面中可能同时存在 `video`、`source`、网络请求、SSR HTML 内嵌地址等多个来源。工具会尽量保留候选项，方便你选择可用链接。

## 注意事项

- 请只提取你有权访问和使用的内容。
- 不要把私密链接、登录态 Cookie、Token 或其他敏感信息提交到公开服务。
- 本项目不会主动添加第三方分析、遥测或额外网络上报。
