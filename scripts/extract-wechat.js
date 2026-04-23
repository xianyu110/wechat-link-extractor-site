#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const args = {
    formats: ['json', 'md'],
    outDir: path.join(projectRoot, 'output', 'latest'),
    downloadImages: false,
    downloadVideos: false,
    waitMs: 3500,
    pageDataDir: path.join(projectRoot, 'docs', 'data'),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--') && !args.url) {
      args.url = token;
      continue;
    }
    if (token === '--url') args.url = argv[++index];
    else if (token === '--out-dir') args.outDir = path.resolve(argv[++index]);
    else if (token === '--format') args.formats = argv[++index].split(',').map((item) => item.trim()).filter(Boolean);
    else if (token === '--download-images') args.downloadImages = true;
    else if (token === '--download-videos') args.downloadVideos = true;
    else if (token === '--download-all') args.downloadImages = args.downloadVideos = true;
    else if (token === '--wait-ms') args.waitMs = Number(argv[++index] || args.waitMs);
    else if (token === '--page-data-dir') args.pageDataDir = path.resolve(argv[++index]);
    else if (token === '--help' || token === '-h') args.help = true;
    else throw new Error(`Unknown argument: ${token}`);
  }
  return args;
}

function printHelp() {
  console.log(`extract-wechat <url> [options]

Options:
  --url <url>               WeChat article URL
  --out-dir <dir>           Output directory
  --format <list>           Output formats: json,md
  --download-images         Download extracted images
  --download-videos         Download extracted videos
  --download-all            Download images and videos
  --wait-ms <ms>            Extra wait after load, default 3500
  --page-data-dir <dir>     Extra export target for GitHub Pages data files
  -h, --help                Show this help
`);
}

function ensureWeChatUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== 'mp.weixin.qq.com') {
      throw new Error('Only mp.weixin.qq.com article URLs are supported.');
    }
    return parsed.toString();
  } catch (error) {
    throw new Error(`Invalid WeChat article URL: ${url}`);
  }
}

function slugify(input) {
  return String(input || 'article')
    .normalize('NFKD')
    .replace(/[^\w\u4e00-\u9fa5-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'article';
}

function buildMarkdown(data) {
  const lines = [
    `# ${data.title || '未命名文章'}`,
    '',
    `- 公众号：${data.account_name || ''}`,
    `- 作者：${data.author || ''}`,
    `- 发布时间：${data.publish_time || ''}`,
    `- 原文链接：${data.url || ''}`,
    '',
    '## 摘要',
    '',
    data.summary || '无',
    '',
    '## 正文',
    '',
    data.content_text || '',
    '',
    '## 图片',
    '',
    ...(data.images || []).map((image, index) => `${index + 1}. ${image.url}`),
    '',
    '## 视频',
    '',
    ...(data.videos || []).map((video, index) => `${index + 1}. ${video.url}`),
    '',
  ];
  return lines.join('\n');
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function writeFile(filePath, content) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content);
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function resolveExecutable() {
  const macChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  if (await fileExists(macChrome)) return macChrome;
  return undefined;
}

async function extractArticle(page) {
  return page.evaluate(() => {
    const norm = (value) => (typeof value === 'string' ? value.trim() : '');
    const isHttp = (value) => /^https?:\/\//i.test(value || '');
    const isDataUrl = (value) => /^data:/i.test(value || '');
    const pickImageUrl = (img) => {
      const candidates = [
        img.getAttribute('data-src'),
        img.dataset?.src,
        img.currentSrc,
        img.getAttribute('src'),
      ].map(norm);
      return candidates.find((value) => value && !isDataUrl(value) && isHttp(value)) || '';
    };
    const contentRoot =
      document.querySelector('#js_content') ||
      document.querySelector('.rich_media_content') ||
      document.querySelector('article') ||
      document.body;

    const title =
      norm(document.querySelector('#activity-name')?.textContent) ||
      norm(document.querySelector('h1')?.textContent) ||
      norm(document.title);
    const accountName =
      norm(document.querySelector('#js_name')?.textContent) ||
      norm(document.querySelector('.wx_follow_nickname')?.textContent) ||
      norm(document.querySelector('.account_nickname_inner')?.textContent);
    const author =
      norm(document.querySelector('#js_author_name')?.textContent) ||
      norm(document.querySelector('.rich_media_meta_text')?.textContent);
    const publishTime =
      norm(document.querySelector('#publish_time')?.textContent) ||
      norm(document.querySelector('.publish_time')?.textContent);
    const summary = norm(document.querySelector('meta[name="description"]')?.getAttribute('content'));
    const coverImage = norm(document.querySelector('meta[property="og:image"]')?.getAttribute('content'));

    const images = Array.from(contentRoot.querySelectorAll('img'))
      .map((img) => ({ url: pickImageUrl(img), alt: norm(img.getAttribute('alt')) }))
      .filter((item) => item.url)
      .filter((item, index, list) => list.findIndex((entry) => entry.url === item.url) === index);

    const videos = Array.from(contentRoot.querySelectorAll('video, iframe'))
      .map((node) => {
        if (node.tagName === 'VIDEO') {
          return {
            url: norm(node.getAttribute('src')) || norm(node.querySelector('source')?.getAttribute('src')) || '',
            poster: norm(node.getAttribute('poster')),
          };
        }
        const src = norm(node.getAttribute('src'));
        if (!src || /open\.weixin\.qq\.com\/pcopensdk\/frame/i.test(src)) return null;
        return { url: src, poster: '' };
      })
      .filter(Boolean)
      .filter((item) => item.url)
      .filter((item, index, list) => list.findIndex((entry) => entry.url === item.url) === index);

    return {
      title,
      account_name: accountName,
      author,
      publish_time: publishTime,
      summary,
      content_text: norm(contentRoot.innerText || ''),
      content_html: contentRoot.innerHTML || '',
      cover_image: coverImage,
      images,
      videos,
    };
  });
}

function buildDownloadPlan(items, kind) {
  return items.map((item, index) => {
    const source = new URL(item.url);
    const extFromPath = path.extname(source.pathname).replace('.', '') || (kind === 'images' ? 'jpg' : 'mp4');
    return {
      ...item,
      filename: `${String(index + 1).padStart(2, '0')}.${extFromPath.toLowerCase()}`,
    };
  });
}

async function downloadAssets(items, targetDir) {
  await ensureDir(targetDir);
  const downloaded = [];
  for (const item of items) {
    const response = await fetch(item.url, {
      headers: {
        'user-agent': 'Mozilla/5.0',
        referer: 'https://mp.weixin.qq.com/',
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to download ${item.url}: HTTP ${response.status}`);
    }
    const filePath = path.join(targetDir, item.filename);
    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(filePath, buffer);
    downloaded.push({ ...item, local_path: filePath });
  }
  return downloaded;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.url) {
    printHelp();
    process.exit(args.help ? 0 : 1);
  }

  const url = ensureWeChatUrl(args.url);
  await ensureDir(args.outDir);
  await ensureDir(args.pageDataDir);

  const executablePath = await resolveExecutable();
  const browser = await chromium.launch({
    headless: true,
    executablePath,
  });

  try {
    const context = await browser.newContext({
      locale: 'zh-CN',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      viewport: { width: 1440, height: 2200 },
    });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForTimeout(args.waitMs);

    const extracted = await extractArticle(page);
    const slug = slugify(extracted.title);
    const articleDir = path.join(args.outDir, slug);
    await ensureDir(articleDir);

    const data = {
      url,
      fetched_at: new Date().toISOString(),
      ...extracted,
    };

    if (args.downloadImages && data.images.length) {
      data.images = await downloadAssets(buildDownloadPlan(data.images, 'images'), path.join(articleDir, 'images'));
    }
    if (args.downloadVideos && data.videos.length) {
      data.videos = await downloadAssets(buildDownloadPlan(data.videos, 'videos'), path.join(articleDir, 'videos'));
    }

    const jsonPath = path.join(articleDir, 'article.json');
    const markdownPath = path.join(articleDir, 'article.md');

    if (args.formats.includes('json')) {
      await writeFile(jsonPath, `${JSON.stringify(data, null, 2)}\n`);
      await writeFile(path.join(args.pageDataDir, 'article.json'), `${JSON.stringify(data, null, 2)}\n`);
    }
    if (args.formats.includes('md')) {
      const markdown = buildMarkdown(data);
      await writeFile(markdownPath, `${markdown}\n`);
      await writeFile(path.join(args.pageDataDir, 'article.md'), `${markdown}\n`);
    }

    console.log(JSON.stringify({
      title: data.title,
      account_name: data.account_name,
      image_count: data.images.length,
      video_count: data.videos.length,
      output_dir: articleDir,
      json_path: args.formats.includes('json') ? jsonPath : null,
      markdown_path: args.formats.includes('md') ? markdownPath : null,
      page_data_dir: args.pageDataDir,
    }, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error.stack || error.message || String(error));
  process.exit(1);
});
