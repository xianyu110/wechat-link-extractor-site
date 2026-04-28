# WeChat Link Extractor Site

提取微信公众号文章链接中的正文、图片和视频；在线 API 也支持从抖音、B 站、小红书等分享链接里识别页面、封面和视频候选链接。结果可导出成 `json` / `markdown`，并生成一个可直接发布到 GitHub Pages 的静态展示页。

## 安装

```bash
npm install
```

## 提取文章

```bash
node ./scripts/extract-wechat.js "https://mp.weixin.qq.com/s/hfRsnvpWeMqPZQe6T7Xr6Q"
```

在线 API / 展示页输入框可以直接粘贴完整分享口令，例如：

```text
7.94 复制打开抖音，看看【J.的图文作品】五一见一面吧 你穿裙子 我带花 位置你定 不是宾馆... https://v.douyin.com/u7OcxidjHzQ/
```

也可以直接 POST 到 API：

```bash
curl -X POST http://127.0.0.1:4311/api/extract \
  -H 'content-type: application/json' \
  -d '{"input":"https://v.douyin.com/u7OcxidjHzQ/"}'
```

同时下载图片和视频：

```bash
node ./scripts/extract-wechat.js "https://mp.weixin.qq.com/s/hfRsnvpWeMqPZQe6T7Xr6Q" --download-all
```

## 产物位置

- 结构化结果：`output/latest/<article-slug>/article.json`
- Markdown：`output/latest/<article-slug>/article.md`
- 图片：`output/latest/<article-slug>/images/`
- 视频：`output/latest/<article-slug>/videos/`
- GitHub Pages 数据：`docs/data/article.json` 和 `docs/data/article.md`

## 本地预览展示页

```bash
npm run serve
```

然后打开 `http://127.0.0.1:4173`。

## 本地启动在线 API

```bash
npm run dev:api
```

默认会在 `http://127.0.0.1:4311` 启动本地 API。静态页在本地访问时会自动把 API 基址从 `4173` 推断成 `4311`。

## 线上部署建议

这个项目支持把“静态展示页”和“在线 API”拆开部署：

- 静态页：可部署到 GitHub Pages、Netlify 或其他静态托管
- API：可单独部署到一个可访问的 Node / Serverless 域名

前端有两种方式指定在线 API 基址：

1. 通过查询参数：

```text
https://your-static-site.example.com/?api=https://your-api.example.com
```

2. 在页面加载前注入全局变量：

```html
<script>
  window.WECHAT_EXTRACT_API_BASE = 'https://your-api.example.com';
</script>
```

如果你的网络环境对 `vercel.app` 不稳定，建议直接改用你自己的 API 域名，而不是把默认演示域名作为最终入口。

## 常见网络问题

如果前端点击“在线提取”或“打包下载”时出现下面这类报错：

- `Failed to fetch`
- `ERR_CONNECTION_RESET`
- `ECONNRESET`

通常不是文章链接格式错误，而是当前网络无法访问配置的 API 域名。

此时可以优先检查：

1. 当前页面绑定的 API 域名是否可访问
2. 是否需要改用自定义域名，而不是 `vercel.app`
3. 是否可先在本地运行：

```bash
npm run dev:api
npm run serve
```
