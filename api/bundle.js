import JSZip from 'jszip';
import { buildMarkdown, slugify } from '../lib/extract-core.js';

export const config = {
  maxDuration: 300,
};

const DEFAULT_HEADERS = {
  'user-agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  referer: 'https://mp.weixin.qq.com/',
};

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
}

function sendJson(res, status, payload) {
  res.status(status);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function parseBody(req) {
  if (typeof req.body === 'string') {
    return JSON.parse(req.body || '{}');
  }
  return req.body || {};
}

function inferExtensionFromType(contentType, fallback) {
  const normalized = String(contentType || '').split(';')[0].trim().toLowerCase();
  if (!normalized) return fallback;

  const typeMap = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/heic': 'heic',
    'image/heif': 'heif',
    'video/mp4': 'mp4',
    'video/quicktime': 'mov',
    'video/webm': 'webm',
    'application/octet-stream': fallback,
  };
  return typeMap[normalized] || fallback;
}

function inferExtensionFromUrl(url, fallback) {
  try {
    const pathname = new URL(url).pathname;
    const matched = pathname.match(/\.([a-zA-Z0-9]{2,5})$/);
    if (!matched) return fallback;
    return matched[1].toLowerCase();
  } catch {
    return fallback;
  }
}

function normalizeAssets(items, folder, fallbackExt) {
  return (Array.isArray(items) ? items : [])
    .filter((item) => item && typeof item.url === 'string' && item.url.trim())
    .map((item, index) => ({
      ...item,
      source_url: item.url.trim(),
      folder,
      index,
      fallbackExt,
      seedExt: inferExtensionFromUrl(item.url, fallbackExt),
    }));
}

async function downloadAsset(item) {
  const response = await fetch(item.source_url, { headers: DEFAULT_HEADERS });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const ext = inferExtensionFromType(response.headers.get('content-type'), item.seedExt || item.fallbackExt);
  const filename = `${String(item.index + 1).padStart(2, '0')}.${ext}`;

  return {
    filename,
    folder: item.folder,
    source_url: item.source_url,
    size: buffer.length,
    buffer,
  };
}

async function downloadSelectedAssets(assets) {
  const downloaded = [];
  const failed = [];

  for (const asset of assets) {
    try {
      downloaded.push(await downloadAsset(asset));
    } catch (error) {
      failed.push({
        folder: asset.folder,
        url: asset.source_url,
        error: error.message || String(error),
      });
    }
  }

  return { downloaded, failed };
}

function buildManifest(article, downloaded, failed) {
  return {
    title: article.title || '',
    url: article.url || '',
    generated_at: new Date().toISOString(),
    downloaded_count: downloaded.length,
    failed_count: failed.length,
    downloaded: downloaded.map((item) => ({
      folder: item.folder,
      filename: item.filename,
      source_url: item.source_url,
      size: item.size,
    })),
    failed,
  };
}

function buildDownloadFilename(title) {
  const readable = `${slugify(title || 'wechat-article')}-assets.zip`;
  const ascii = readable.replace(/[^\x20-\x7E]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'wechat-article-assets.zip';
  return {
    ascii,
    encoded: encodeURIComponent(readable),
  };
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'POST') {
    sendJson(res, 405, { ok: false, error: 'Method not allowed.' });
    return;
  }

  try {
    const body = parseBody(req);
    const article = body.article || body.data || body;
    const includeImages = body.includeImages !== false;
    const includeVideos = body.includeVideos !== false;

    if (!article || typeof article !== 'object') {
      sendJson(res, 400, { ok: false, error: 'Missing article payload.' });
      return;
    }

    const assets = [
      ...(includeImages ? normalizeAssets(article.images, 'images', 'jpg') : []),
      ...(includeVideos ? normalizeAssets(article.videos, 'videos', 'mp4') : []),
    ];

    if (!assets.length) {
      sendJson(res, 400, { ok: false, error: 'No downloadable images or videos in this article.' });
      return;
    }

    const { downloaded, failed } = await downloadSelectedAssets(assets);
    if (!downloaded.length) {
      sendJson(res, 502, { ok: false, error: 'All asset downloads failed.' });
      return;
    }

    const zip = new JSZip();
    const filenames = buildDownloadFilename(article.title || 'wechat-article');

    zip.file('article.json', `${JSON.stringify(article, null, 2)}\n`);
    zip.file('article.md', `${buildMarkdown(article)}\n`);
    zip.file('manifest.json', `${JSON.stringify(buildManifest(article, downloaded, failed), null, 2)}\n`);

    for (const asset of downloaded) {
      zip.file(`${asset.folder}/${asset.filename}`, asset.buffer);
    }

    if (failed.length) {
      const lines = failed.map((item) => `${item.folder}\t${item.url}\t${item.error}`);
      zip.file('failed-downloads.txt', `${lines.join('\n')}\n`);
    }

    const bundle = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    res.status(200);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filenames.ascii}"; filename*=UTF-8''${filenames.encoded}`,
    );
    res.end(bundle);
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error.message || String(error) });
  }
}
