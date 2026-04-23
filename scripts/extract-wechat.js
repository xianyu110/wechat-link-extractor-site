#!/usr/bin/env node
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import {
  ensureDir,
  extractFromUrl,
  persistExtractedArticle,
  resolveLocalExecutable,
} from '../lib/extract-core.js';

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

async function launchLocalBrowser() {
  const executablePath = await resolveLocalExecutable();
  return chromium.launch({ headless: true, executablePath });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.url) {
    printHelp();
    process.exit(args.help ? 0 : 1);
  }

  await ensureDir(args.outDir);
  await ensureDir(args.pageDataDir);

  const data = await extractFromUrl({
    url: args.url,
    waitMs: args.waitMs,
    launchBrowser: launchLocalBrowser,
  });

  const persisted = await persistExtractedArticle({
    data,
    outDir: args.outDir,
    pageDataDir: args.pageDataDir,
    formats: args.formats,
    downloadImages: args.downloadImages,
    downloadVideos: args.downloadVideos,
  });

  console.log(
    JSON.stringify(
      {
        title: persisted.data.title,
        account_name: persisted.data.account_name,
        image_count: persisted.data.images.length,
        video_count: persisted.data.videos.length,
        output_dir: persisted.articleDir,
        json_path: persisted.jsonPath,
        markdown_path: persisted.markdownPath,
        page_data_dir: args.pageDataDir,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error.stack || error.message || String(error));
  process.exit(1);
});
