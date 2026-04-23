# WeChat Link Extractor Site

提取微信公众号文章链接中的正文、图片和视频，导出成 `json` / `markdown`，并生成一个可直接发布到 GitHub Pages 的静态展示页。

## 安装

```bash
npm install
```

## 提取文章

```bash
node ./scripts/extract-wechat.js "https://mp.weixin.qq.com/s/hfRsnvpWeMqPZQe6T7Xr6Q"
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
