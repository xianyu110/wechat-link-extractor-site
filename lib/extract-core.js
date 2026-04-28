import fs from 'node:fs/promises';
import path from 'node:path';

const SOCIAL_PLATFORMS = [
  {
    id: 'wechat',
    name: '微信公众号',
    hosts: ['mp.weixin.qq.com'],
  },
  {
    id: 'douyin',
    name: '抖音',
    hosts: ['douyin.com', 'iesdouyin.com', 'amemv.com'],
  },
  {
    id: 'bilibili',
    name: 'B 站',
    hosts: ['bilibili.com', 'b23.tv'],
  },
  {
    id: 'xiaohongshu',
    name: '小红书',
    hosts: ['xiaohongshu.com', 'xhslink.com', 'xhs.cn'],
  },
  {
    id: 'kuaishou',
    name: '快手',
    hosts: ['kuaishou.com', 'gifshow.com'],
  },
];

const GENERIC_PLATFORM = {
  id: 'generic',
  name: '网页视频',
  hosts: [],
};

const MOBILE_USER_AGENT =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const VIDEO_URL_PATTERN = /\.(mp4|m3u8|mov|webm|m4s|flv)(?:[?#]|$)|\/aweme\/v1\/play(?:wm)?\/|\/video\/tos\//i;
const IMAGE_URL_PATTERN = /\.(jpe?g|png|gif|webp|heic|heif)(?:[?#]|$)/i;

export function extractFirstUrl(input) {
  const match = String(input || '').match(/https?:\/\/[^\s"'<>，。！？、]+/i);
  if (!match) return '';
  return match[0].replace(/[),.;!?，。！？、）】\]]+$/g, '');
}

export function detectPlatform(url) {
  const parsed = new URL(url);
  const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
  return (
    SOCIAL_PLATFORMS.find((platform) =>
      platform.hosts.some((platformHost) => host === platformHost || host.endsWith(`.${platformHost}`)),
    ) || GENERIC_PLATFORM
  );
}

export function normalizeExtractorInput(input) {
  const rawInput = String(input || '').trim();
  const candidateUrl = extractFirstUrl(rawInput) || rawInput;
  try {
    const parsed = new URL(candidateUrl);
    if (!/^https?:$/i.test(parsed.protocol)) throw new Error('Only http and https URLs are supported.');
    return {
      rawInput,
      url: parsed.toString(),
      share_text: rawInput && rawInput !== parsed.toString() ? rawInput : '',
      platform: detectPlatform(parsed.toString()),
    };
  } catch {
    throw new Error(`Invalid article or video URL: ${input}`);
  }
}

export function ensureWeChatUrl(url) {
  const source = normalizeExtractorInput(url);
  if (source.platform.id !== 'wechat') {
    throw new Error('Only mp.weixin.qq.com article URLs are supported by WeChat mode.');
  }
  return source.url;
}

export function slugify(input) {
  return String(input || 'article')
    .normalize('NFKD')
    .replace(/[^\w\u4e00-\u9fa5-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'article';
}

export function buildMarkdown(data) {
  const lines = [
    `# ${data.title || '未命名文章'}`,
    '',
    `- 平台：${data.platform_name || (data.platform === 'wechat' ? '微信公众号' : '')}`,
    `- 账号：${data.account_name || ''}`,
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

export async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

export async function writeFile(filePath, content) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content);
}

export async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function resolveLocalExecutable() {
  const macChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  if (await fileExists(macChrome)) return macChrome;
  return undefined;
}

export async function extractArticle(page) {
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

function addUniqueMedia(list, url, extra = {}) {
  if (!url || !/^https?:\/\//i.test(url)) return;
  const normalizedUrl = url.replace(/&amp;/g, '&');
  if (list.some((item) => item.url === normalizedUrl)) return;
  list.push({ url: normalizedUrl, ...extra });
}

function cleanEmbeddedUrl(value) {
  return String(value || '')
    .replace(/\\u002F/gi, '/')
    .replace(/\\\//g, '/')
    .replace(/\\u0026/gi, '&')
    .replace(/&amp;/g, '&')
    .replace(/[\\]+$/g, '')
    .replace(/[),.;!?，。！？、）】\]]+$/g, '');
}

function collectMediaUrlsFromText(text, predicate) {
  const found = [];
  const patterns = [
    /https?:\/\/[^"'<>\\\s]+/gi,
    /https:(?:\\u002F|\\\/|\/){2}[^"'<>\s]+/gi,
  ];

  for (const pattern of patterns) {
    for (const match of String(text || '').matchAll(pattern)) {
      const url = cleanEmbeddedUrl(match[0]);
      if (predicate(url) && !found.includes(url)) found.push(url);
    }
  }
  return found;
}

function isLikelyVideoUrl(url) {
  return VIDEO_URL_PATTERN.test(url);
}

function isDouyinWorkVideoUrl(url) {
  const normalized = cleanEmbeddedUrl(url);
  if (!isLikelyVideoUrl(normalized)) return false;
  if (/\.mp3(?:[?#]|$)|audio|music/i.test(normalized)) return false;
  if (/douyin-pc-web\/|\/static\/|\/obj\/douyin-pc-web\/|effectcdn|byteeffecttos/i.test(normalized)) return false;
  return /\/aweme\/v1\/play(?:wm)?\/|\/video\/tos\/|mime_type=video_|video_id=(?!https?:)/i.test(normalized);
}

function getDouyinVideoKey(url) {
  const normalized = cleanEmbeddedUrl(url);
  const pathId = normalized.match(/\/video\/tos\/[^/]+\/[^/]+\/([^/?]+)/i);
  if (pathId) return pathId[1];
  const videoId = normalized.match(/[?&]video_id=([^&]+)/i);
  if (videoId) return decodeURIComponent(videoId[1]);
  return normalized.split('?')[0];
}

function scoreDouyinVideo(item) {
  const url = item.url || '';
  let score = 0;
  if (/\/video\/tos\//i.test(url)) score += 100;
  if (/mime_type=video_mp4/i.test(url)) score += 40;
  if (item.source === 'network') score += 20;
  if (/douyinvod|zjcdn|v\d+-dy|v\d+-web/i.test(url)) score += 10;
  if (/\/aweme\/v1\/play/i.test(url)) score -= 10;
  return score;
}

function selectDouyinWorkVideos(items = []) {
  const selectedByKey = new Map();
  for (const item of items) {
    if (!isDouyinWorkVideoUrl(item.url)) continue;
    const key = getDouyinVideoKey(item.url);
    const current = selectedByKey.get(key);
    if (!current || scoreDouyinVideo(item) > scoreDouyinVideo(current)) {
      selectedByKey.set(key, item);
    }
  }

  return [...selectedByKey.values()].sort((a, b) => scoreDouyinVideo(b) - scoreDouyinVideo(a)).slice(0, 1);
}

function isLikelyImageUrl(url) {
  return IMAGE_URL_PATTERN.test(url);
}

function collectVideoResponses(page) {
  const videos = [];
  page.on('response', (response) => {
    const responseUrl = cleanEmbeddedUrl(response.url());
    const contentType = response.headers()['content-type'] || '';
    if (/^video\/|mpegurl|mp4|x-mpegurl/i.test(contentType) || isLikelyVideoUrl(responseUrl)) {
      addUniqueMedia(videos, responseUrl, { source: 'network', content_type: contentType });
    }
  });
  return videos;
}

async function warmupDouyinMedia(page) {
  await page.waitForTimeout(1000);
  await page
    .evaluate(() => {
      window.scrollTo(0, 0);
      document.querySelector('video')?.scrollIntoView({ block: 'center', inline: 'center' });
      for (const video of document.querySelectorAll('video')) {
        video.muted = true;
        video.play?.().catch(() => {});
      }
    })
    .catch(() => {});
  await page.mouse.click(720, 520).catch(() => {});
  await page.waitForTimeout(6500);
}

function mergeMedia(target, items = []) {
  for (const item of items) {
    addUniqueMedia(target, item.url, Object.fromEntries(Object.entries(item).filter(([key]) => key !== 'url')));
  }
  return target;
}

function extractDouyinAwemeId(...values) {
  for (const value of values) {
    const match = String(value || '').match(/(?:\/(?:video|note)\/|aweme_id=)(\d{10,})/i);
    if (match) return match[1];
  }
  return '';
}

function getDouyinShareTypes(...values) {
  const haystack = values.map((value) => String(value || '')).join('\n');
  if (/\/share\/video\/|\/video\//i.test(haystack)) return ['video', 'note'];
  if (/\/share\/note\/|\/note\//i.test(haystack)) return ['note', 'video'];
  return ['video', 'note'];
}

function extractScriptJson(html, variableName) {
  const escapedName = variableName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`${escapedName}\\s*=\\s*(\\{[\\s\\S]*?\\})\\s*<\\/script>`);
  const match = String(html || '').match(pattern);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

function findDouyinItemList(root) {
  const stack = [root];
  const seen = new Set();
  while (stack.length) {
    const value = stack.pop();
    if (!value || typeof value !== 'object' || seen.has(value)) continue;
    seen.add(value);
    if (Array.isArray(value.item_list) && value.item_list.length) return value.item_list;
    if (Array.isArray(value.aweme_list) && value.aweme_list.length) return value.aweme_list;
    for (const child of Object.values(value)) {
      if (child && typeof child === 'object') stack.push(child);
    }
  }
  return [];
}

function collectUrlList(media) {
  if (!media || typeof media !== 'object') return [];
  if (Array.isArray(media.url_list)) return media.url_list.filter(Boolean).map(cleanEmbeddedUrl);
  if (typeof media.url === 'string') return [cleanEmbeddedUrl(media.url)];
  return [];
}

function collectDouyinVideoUrls(root, pathParts = []) {
  if (!root || typeof root !== 'object') return [];
  const videos = [];
  const pathName = pathParts.join('.');

  if (Array.isArray(root.url_list) && /(play|download|video)/i.test(pathName)) {
    for (const url of root.url_list) {
      const cleaned = cleanEmbeddedUrl(url);
      if (isDouyinWorkVideoUrl(cleaned)) {
        addUniqueMedia(videos, cleaned, { source: `douyin-ssr:${pathName}` });
      }
    }
  }

  for (const [key, value] of Object.entries(root)) {
    if (!value || typeof value !== 'object') continue;
    mergeMedia(videos, collectDouyinVideoUrls(value, [...pathParts, key]));
  }
  return videos;
}

function parseDouyinSsrItem(item, { pageUrl, sourceUrl }) {
  const images = [];
  const videos = [];
  const referer = pageUrl || sourceUrl || 'https://www.iesdouyin.com/';
  const coverUrls = [
    ...collectUrlList(item?.video?.cover),
    ...collectUrlList(item?.video?.origin_cover),
    ...collectUrlList(item?.video?.dynamic_cover),
  ];

  for (const cover of coverUrls) {
    addUniqueMedia(images, cover, { alt: '封面' });
  }
  for (const image of item.images || item.image_infos || []) {
    for (const url of collectUrlList(image.url_list ? image : image?.url_list || image?.display_image)) {
      addUniqueMedia(images, url, { alt: '图片' });
    }
    for (const url of collectUrlList(image?.display_image)) {
      addUniqueMedia(images, url, { alt: '图片' });
    }
  }

  for (const video of collectDouyinVideoUrls(item)) {
    addUniqueMedia(videos, video.url, {
      poster: coverUrls[0] || '',
      source: video.source || 'douyin-ssr',
      referer,
    });
  }

  const createTime = Number(item.create_time || 0);
  return {
    title: item.desc || '',
    account_name: item.author?.nickname || '',
    author: item.author?.nickname || '',
    publish_time: createTime ? new Date(createTime * 1000).toISOString() : '',
    summary: item.desc || '',
    content_text: item.desc || '',
    cover_image: coverUrls[0] || '',
    images,
    videos,
  };
}

export async function extractDouyinSsrData({ pageUrl, sourceUrl, shareText = '' }) {
  const awemeId = extractDouyinAwemeId(pageUrl, sourceUrl, shareText);
  if (!awemeId) return null;

  const shareTypes = getDouyinShareTypes(pageUrl, sourceUrl, shareText);
  for (const type of shareTypes) {
    const ssrUrl = `https://www.iesdouyin.com/share/${type}/${awemeId}/?region=CN&from_ssr=1`;
    try {
      const response = await fetch(ssrUrl, {
        redirect: 'follow',
        headers: {
          'user-agent': MOBILE_USER_AGENT,
          accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          referer: sourceUrl || 'https://www.douyin.com/',
        },
      });
      if (!response.ok) continue;
      const html = await response.text();
      const routerData = extractScriptJson(html, 'window._ROUTER_DATA');
      const item = findDouyinItemList(routerData)[0];
      if (!item) continue;
      return {
        url: ssrUrl,
        ...parseDouyinSsrItem(item, { pageUrl: ssrUrl, sourceUrl }),
      };
    } catch (error) {
      if (process.env.DEBUG_EXTRACTOR) console.error(error);
      // Douyin SSR is a best-effort fallback; the browser result is still usable.
    }
  }

  return null;
}

export async function extractGenericMediaPage(page, { inputUrl, platform, shareText = '', networkVideos = [] }) {
  const pageData = await page.evaluate(() => {
    const norm = (value) => (typeof value === 'string' ? value.trim() : '');
    const isHttp = (value) => /^https?:\/\//i.test(value || '');
    const isDataUrl = (value) => /^data:/i.test(value || '');
    const getMeta = (...selectors) => {
      for (const selector of selectors) {
        const value = norm(document.querySelector(selector)?.getAttribute('content'));
        if (value) return value;
      }
      return '';
    };
    const add = (list, item) => {
      if (!item.url || !isHttp(item.url) || list.some((entry) => entry.url === item.url)) return;
      list.push(item);
    };
    const pickImageUrl = (img) => {
      const candidates = [
        img.getAttribute('data-src'),
        img.dataset?.src,
        img.currentSrc,
        img.getAttribute('src'),
      ].map(norm);
      return candidates.find((value) => value && !isDataUrl(value) && isHttp(value)) || '';
    };

    const videos = [];
    document.querySelectorAll('meta[property="og:video"], meta[property="og:video:url"], meta[property="og:video:secure_url"], meta[name="twitter:player:stream"]').forEach((node) => {
      add(videos, { url: norm(node.getAttribute('content')), poster: '', source: 'meta' });
    });
    document.querySelectorAll('video').forEach((node) => {
      const poster = norm(node.getAttribute('poster'));
      add(videos, { url: norm(node.currentSrc) || norm(node.getAttribute('src')), poster, source: 'video' });
      node.querySelectorAll('source').forEach((source) => {
        add(videos, { url: norm(source.getAttribute('src')), poster, source: 'source' });
      });
    });
    document.querySelectorAll('iframe').forEach((node) => {
      add(videos, { url: norm(node.getAttribute('src')), poster: '', source: 'iframe' });
    });

    const images = [];
    const coverImage = getMeta('meta[property="og:image"]', 'meta[name="twitter:image"]');
    add(images, { url: coverImage, alt: '封面' });
    Array.from(document.querySelectorAll('img'))
      .slice(0, 80)
      .forEach((img) => add(images, { url: pickImageUrl(img), alt: norm(img.getAttribute('alt')) }));

    return {
      title:
        getMeta('meta[property="og:title"]', 'meta[name="twitter:title"]') ||
        norm(document.querySelector('h1')?.textContent) ||
        norm(document.title),
      account_name:
        getMeta('meta[name="author"]') ||
        norm(document.querySelector('[class*="author"], [class*="user"], [class*="name"]')?.textContent),
      author: getMeta('meta[name="author"]'),
      publish_time:
        getMeta('meta[property="article:published_time"]') ||
        norm(document.querySelector('time')?.getAttribute('datetime')) ||
        norm(document.querySelector('time')?.textContent),
      summary:
        getMeta('meta[name="description"]', 'meta[property="og:description"]', 'meta[name="twitter:description"]'),
      content_text: norm(document.body?.innerText || ''),
      content_html: '',
      cover_image: coverImage,
      images,
      videos,
      html: document.documentElement?.innerHTML || '',
    };
  });

  const videos = [];
  const images = [];
  for (const item of [...(pageData.videos || []), ...networkVideos]) {
    addUniqueMedia(videos, item.url, {
      poster: item.poster || pageData.cover_image || '',
      source: item.source || 'page',
      content_type: item.content_type || '',
      referer: page.url() || inputUrl,
    });
  }
  for (const url of collectMediaUrlsFromText(pageData.html, isLikelyVideoUrl)) {
    addUniqueMedia(videos, url, { poster: pageData.cover_image || '', source: 'html', referer: page.url() || inputUrl });
  }

  for (const item of pageData.images || []) {
    addUniqueMedia(images, item.url, { alt: item.alt || '' });
  }
  for (const url of collectMediaUrlsFromText(pageData.html, isLikelyImageUrl).slice(0, 80)) {
    addUniqueMedia(images, url, { alt: '' });
  }

  return {
    title: pageData.title || shareText.split(/\s+/).find(Boolean) || platform.name,
    platform: platform.id,
    platform_name: platform.name,
    account_name: pageData.account_name || '',
    author: pageData.author || '',
    publish_time: pageData.publish_time || '',
    summary: pageData.summary || '',
    content_text: pageData.content_text || shareText,
    content_html: pageData.content_html || '',
    cover_image: pageData.cover_image || '',
    images,
    videos,
  };
}

export async function extractFromUrl({
  url,
  waitMs = 3500,
  launchBrowser,
  contextOptions = {},
}) {
  const source = normalizeExtractorInput(url);
  const browser = await launchBrowser();

  try {
    const context = await browser.newContext({
      locale: 'zh-CN',
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      viewport: { width: 1440, height: 2200 },
      ...contextOptions,
    });
    const page = await context.newPage();
    const networkVideos = collectVideoResponses(page);
    await page.goto(source.url, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    if (source.platform.id === 'douyin') await warmupDouyinMedia(page);
    await page.waitForTimeout(waitMs);

    if (source.platform.id === 'wechat') {
      return {
        url: page.url() || source.url,
        source_url: source.url,
        platform: source.platform.id,
        platform_name: source.platform.name,
        fetched_at: new Date().toISOString(),
        ...(await extractArticle(page)),
      };
    }

    const genericData = await extractGenericMediaPage(page, {
      inputUrl: source.url,
      platform: source.platform,
      shareText: source.share_text,
      networkVideos,
    });

    if (source.platform.id === 'douyin') {
      const douyinSsrData = await extractDouyinSsrData({
        pageUrl: page.url() || source.url,
        sourceUrl: source.url,
        shareText: source.share_text,
      });
      if (douyinSsrData) {
        genericData.title = douyinSsrData.title || genericData.title;
        genericData.account_name = douyinSsrData.account_name || genericData.account_name;
        genericData.author = douyinSsrData.author || genericData.author;
        genericData.publish_time = douyinSsrData.publish_time || genericData.publish_time;
        genericData.summary = douyinSsrData.summary || genericData.summary;
        genericData.content_text = douyinSsrData.content_text || genericData.content_text;
        genericData.cover_image = douyinSsrData.cover_image || genericData.cover_image;
        genericData.images = [...(douyinSsrData.images || [])];
        genericData.videos = selectDouyinWorkVideos([...(douyinSsrData.videos || []), ...(genericData.videos || [])]);
      }
    }

    return {
      url: page.url() || source.url,
      source_url: source.url,
      share_text: source.share_text,
      fetched_at: new Date().toISOString(),
      ...genericData,
    };
  } finally {
    await browser.close();
  }
}

export function buildDownloadPlan(items, kind) {
  return items.map((item, index) => {
    const source = new URL(item.url);
    const extFromPath = path.extname(source.pathname).replace('.', '') || (kind === 'images' ? 'jpg' : 'mp4');
    return {
      ...item,
      filename: `${String(index + 1).padStart(2, '0')}.${extFromPath.toLowerCase()}`,
    };
  });
}

export async function downloadAssets(items, targetDir) {
  await ensureDir(targetDir);
  const downloaded = [];
  for (const item of items) {
    const response = await fetch(item.url, {
      headers: {
        'user-agent': 'Mozilla/5.0',
        referer: item.referer || 'https://mp.weixin.qq.com/',
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

export async function persistExtractedArticle({
  data,
  outDir,
  pageDataDir,
  formats = ['json', 'md'],
  downloadImages = false,
  downloadVideos = false,
}) {
  const slug = slugify(data.title);
  const articleDir = path.join(outDir, slug);
  await ensureDir(articleDir);

  const effectiveData = { ...data };
  if (downloadImages && effectiveData.images?.length) {
    effectiveData.images = await downloadAssets(buildDownloadPlan(effectiveData.images, 'images'), path.join(articleDir, 'images'));
  }
  if (downloadVideos && effectiveData.videos?.length) {
    effectiveData.videos = await downloadAssets(buildDownloadPlan(effectiveData.videos, 'videos'), path.join(articleDir, 'videos'));
  }

  const jsonPath = path.join(articleDir, 'article.json');
  const markdownPath = path.join(articleDir, 'article.md');

  if (formats.includes('json')) {
    await writeFile(jsonPath, `${JSON.stringify(effectiveData, null, 2)}\n`);
    if (pageDataDir) {
      await writeFile(path.join(pageDataDir, 'article.json'), `${JSON.stringify(effectiveData, null, 2)}\n`);
    }
  }
  if (formats.includes('md')) {
    const markdown = buildMarkdown(effectiveData);
    await writeFile(markdownPath, `${markdown}\n`);
    if (pageDataDir) {
      await writeFile(path.join(pageDataDir, 'article.md'), `${markdown}\n`);
    }
  }

  return {
    data: effectiveData,
    articleDir,
    jsonPath: formats.includes('json') ? jsonPath : null,
    markdownPath: formats.includes('md') ? markdownPath : null,
  };
}
