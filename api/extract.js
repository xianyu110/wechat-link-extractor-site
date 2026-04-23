import chromium from '@sparticuz/chromium';
import { chromium as playwrightChromium } from 'playwright-core';
import { extractFromUrl, resolveLocalExecutable } from '../lib/extract-core.js';

export const config = {
  maxDuration: 300,
};

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
}

async function readUrlFromRequest(req) {
  if (req.method === 'GET') {
    return req.query?.url || '';
  }
  if (req.method === 'POST') {
    if (typeof req.body === 'string') {
      return JSON.parse(req.body || '{}')?.url || '';
    }
    return req.body?.url || '';
  }
  return '';
}

async function launchApiBrowser() {
  if (process.env.VERCEL) {
    return playwrightChromium.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });
  }

  const executablePath = await resolveLocalExecutable();
  return playwrightChromium.launch({ headless: true, executablePath });
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (!['GET', 'POST'].includes(req.method)) {
    res.status(405).end(JSON.stringify({ error: 'Method not allowed.' }));
    return;
  }

  try {
    const url = await readUrlFromRequest(req);
    if (!url) {
      res.status(400).end(JSON.stringify({ ok: false, error: 'Missing url parameter.' }));
      return;
    }

    const data = await extractFromUrl({
      url,
      waitMs: 3500,
      launchBrowser: launchApiBrowser,
    });

    res.status(200).end(JSON.stringify({ ok: true, data }));
  } catch (error) {
    res.status(500).end(JSON.stringify({ ok: false, error: error.message || String(error) }));
  }
}
