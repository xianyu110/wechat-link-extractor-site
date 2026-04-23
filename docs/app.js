const defaultDataUrl = './data/article.json';
const defaultMarkdownUrl = './data/article.md';

const state = {
  mode: 'extract',
  data: null,
  textView: 'preview',
  remoteUrl: '',
  extractedUrl: '',
  generatedJsonUrl: '',
  generatedMarkdownUrl: '',
};

const $ = (selector) => document.querySelector(selector);

const escapeHtml = (value = '') =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const buildMarkdown = (data) => {
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
};

const summarizeParagraphs = (contentText, limit = 8) =>
  String(contentText || '')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, limit);

const buildPreviewText = (contentText) =>
  summarizeParagraphs(contentText).map((line) => `<div class="text-card"><p>${escapeHtml(line)}</p></div>`).join('');

const buildFullText = (contentText) =>
  `<div class="text-card"><div class="text-full">${escapeHtml(contentText || '无正文')}</div></div>`;

const getSearch = () => new URLSearchParams(window.location.search);

const normalizeUrl = (value = '') => {
  const trimmed = String(value).trim();
  if (!trimmed) return '';
  try {
    return new URL(trimmed, window.location.href).toString();
  } catch {
    return trimmed;
  }
};

const downloadBlob = (blob, filename) => {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
};

const getFilenameFromDisposition = (value = '') => {
  const utf8Match = value.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
  if (utf8Match) return decodeURIComponent(utf8Match[1]);
  const plainMatch = value.match(/filename\s*=\s*"([^"]+)"/i) || value.match(/filename\s*=\s*([^;]+)/i);
  return plainMatch ? plainMatch[1].trim() : '';
};

const getApiBase = () => {
  const queryApi = getSearch().get('api');
  if (queryApi) return normalizeUrl(queryApi).replace(/\/$/, '');
  if (window.WECHAT_EXTRACT_API_BASE) return String(window.WECHAT_EXTRACT_API_BASE).replace(/\/$/, '');
  if (window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')) {
    return `${window.location.origin}`.replace(/4173$/, '4311');
  }
  return '';
};

const apiBase = getApiBase();

const setStatus = (message, type = '') => {
  const node = $('#status-box');
  node.textContent = message;
  node.className = `status${type ? ` ${type}` : ''}`;
};

const setApiNote = () => {
  const note = $('#api-note');
  if (apiBase) {
    note.innerHTML = `当前在线提取 API：<code>${escapeHtml(apiBase)}</code>`;
  } else {
    note.innerHTML = '当前页面还没有绑定在线 API。你仍然可以继续用示例、上传 JSON 和远程 JSON 模式。';
  }
};

const revokeGeneratedUrls = () => {
  if (state.generatedJsonUrl) URL.revokeObjectURL(state.generatedJsonUrl);
  if (state.generatedMarkdownUrl) URL.revokeObjectURL(state.generatedMarkdownUrl);
  state.generatedJsonUrl = '';
  state.generatedMarkdownUrl = '';
};

const makeGeneratedDownloads = (data) => {
  revokeGeneratedUrls();
  state.generatedJsonUrl = URL.createObjectURL(
    new Blob([`${JSON.stringify(data, null, 2)}\n`], { type: 'application/json' }),
  );
  state.generatedMarkdownUrl = URL.createObjectURL(
    new Blob([`${buildMarkdown(data)}\n`], { type: 'text/markdown;charset=utf-8' }),
  );
};

const setMode = (mode) => {
  state.mode = mode;
  document.querySelectorAll('#mode-switch .chip').forEach((chip) => {
    chip.classList.toggle('active', chip.dataset.mode === mode);
  });
  $('#extract-block').hidden = mode !== 'extract';
  $('#upload-block').hidden = mode !== 'upload';
  $('#remote-block').hidden = mode !== 'remote';
};

const renderMeta = (data) => {
  const meta = [
    `公众号：${data.account_name || '未知'}`,
    `作者：${data.author || '未知'}`,
    `发布时间：${data.publish_time || '未知'}`,
  ];
  $('#article-meta').innerHTML = meta.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
};

const renderStats = (data) => {
  const stats = [
    `${(data.images || []).length} 张图片`,
    `${(data.videos || []).length} 个视频`,
    `${String((data.content_text || '').length)} 字正文`,
  ];
  $('#article-stats').innerHTML = stats.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
};

const renderText = (data) => {
  const container = $('#text-container');
  container.innerHTML =
    state.textView === 'full'
      ? buildFullText(data.content_text)
      : buildPreviewText(data.content_text) || '<div class="empty">未提取到正文。</div>';
};

const renderVideos = (data) => {
  const container = $('#video-container');
  const videos = data.videos || [];
  if (!videos.length) {
    container.innerHTML = '<div class="empty">这份数据里没有视频链接。</div>';
    return;
  }
  container.innerHTML = videos
    .map(
      (video, index) => `
        <div class="video-card">
          <p><strong>视频 ${index + 1}</strong></p>
          <p>${video.poster ? `封面：<a href="${escapeHtml(video.poster)}" target="_blank" rel="noreferrer">打开封面</a><br />` : ''}<a href="${escapeHtml(video.url)}" target="_blank" rel="noreferrer">打开视频链接</a></p>
        </div>
      `,
    )
    .join('');
};

const renderImages = (data) => {
  const container = $('#image-container');
  const images = data.images || [];
  if (!images.length) {
    container.innerHTML = '<div class="empty">这份数据里没有图片。</div>';
    return;
  }
  container.innerHTML = images
    .map(
      (image, index) => `
        <article class="asset-card">
          <img src="${escapeHtml(image.url)}" alt="${escapeHtml(image.alt || `图片 ${index + 1}`)}" loading="lazy" />
          <div class="asset-body">
            <div class="asset-title">${escapeHtml(image.alt || `正文图片 ${index + 1}`)}</div>
            <div class="asset-actions">
              <a class="button secondary" href="${escapeHtml(image.url)}" target="_blank" rel="noreferrer">打开原图</a>
              ${image.local_path ? '<span class="chip active">已下载到本地</span>' : '<span class="chip">远程图片</span>'}
            </div>
          </div>
        </article>
      `,
    )
    .join('');
};

const renderData = (data) => {
  state.data = data;
  makeGeneratedDownloads(data);
  $('#article-title').textContent = data.title || '未命名文章';
  $('#article-summary').textContent = data.summary || '该文章页面未暴露摘要，这里展示正文内容和媒体资源。';
  $('#open-source').href = data.url || '#';
  $('#open-json').href = state.mode === 'sample' ? defaultDataUrl : state.generatedJsonUrl;
  $('#open-md').href = state.mode === 'sample' ? defaultMarkdownUrl : state.generatedMarkdownUrl;
  renderMeta(data);
  renderStats(data);
  renderText(data);
  renderVideos(data);
  renderImages(data);
};

const parseImportedData = (raw) => {
  const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (!data || typeof data !== 'object') throw new Error('JSON 格式不正确。');
  if (!('content_text' in data) || !('images' in data) || !('videos' in data)) {
    throw new Error('这不是预期的 article.json 结构。');
  }
  return data;
};

const fetchJson = async (url, options) => {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`加载失败：HTTP ${response.status}`);
  return response.json();
};

const readErrorMessage = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const payload = await response.json();
    return payload.error || `请求失败：HTTP ${response.status}`;
  }
  return (await response.text()) || `请求失败：HTTP ${response.status}`;
};

const loadSample = async () => {
  setStatus('正在加载示例数据...');
  const data = await fetchJson(defaultDataUrl);
  renderData(data);
  setStatus('已加载仓库内置示例数据，可以直接浏览。', 'success');
};

const loadRemote = async (inputUrl) => {
  const remoteUrl = normalizeUrl(inputUrl);
  if (!remoteUrl) throw new Error('请先输入远程 JSON 地址。');
  setStatus('正在加载远程 JSON...');
  const data = await fetchJson(remoteUrl);
  state.remoteUrl = remoteUrl;
  renderData(parseImportedData(data));
  setStatus('远程 JSON 加载成功。可以复制分享链接给别人直接打开。', 'success');
  const nextUrl = new URL(window.location.href);
  nextUrl.searchParams.delete('url');
  nextUrl.searchParams.set('data', remoteUrl);
  window.history.replaceState({}, '', nextUrl);
};

const loadUpload = async (file) => {
  if (!file) throw new Error('请先选择一个 article.json 文件。');
  setStatus('正在读取本地 JSON 文件...');
  renderData(parseImportedData(await file.text()));
  setStatus('本地 JSON 加载成功。这个模式不会上传你的文件。', 'success');
};

const extractOnline = async (inputUrl) => {
  const sourceUrl = normalizeUrl(inputUrl);
  if (!sourceUrl) throw new Error('请先输入公众号链接。');
  if (!apiBase) throw new Error('当前页面还没有配置在线 API。');
  setStatus('正在在线提取公众号文章，这一步可能需要十几秒...');
  const payload = await fetchJson(`${apiBase}/api/extract`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ url: sourceUrl }),
  });
  if (!payload.ok || !payload.data) {
    throw new Error(payload.error || '在线提取失败。');
  }
  state.extractedUrl = sourceUrl;
  renderData(payload.data);
  setStatus('在线提取成功，结果已经展示在当前页面。', 'success');
  const nextUrl = new URL(window.location.href);
  nextUrl.searchParams.delete('data');
  nextUrl.searchParams.set('url', sourceUrl);
  window.history.replaceState({}, '', nextUrl);
};

const downloadBundle = async ({ includeImages, includeVideos, label }) => {
  if (!state.data) throw new Error('请先加载一篇文章，再执行打包下载。');
  if (!apiBase) throw new Error('当前页面还没有配置在线 API，无法打包下载媒体。');
  if (includeImages && !(state.data.images || []).length && !includeVideos) {
    throw new Error('当前文章没有可下载的图片。');
  }
  if (includeVideos && !(state.data.videos || []).length && !includeImages) {
    throw new Error('当前文章没有可下载的视频。');
  }
  if (
    includeImages &&
    includeVideos &&
    !(state.data.images || []).length &&
    !(state.data.videos || []).length
  ) {
    throw new Error('当前文章没有可下载的图片或视频。');
  }

  setStatus(`正在打包${label}，媒体较多时可能需要几十秒，请稍等...`);
  const response = await fetch(`${apiBase}/api/bundle`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      article: state.data,
      includeImages,
      includeVideos,
    }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const filename =
    getFilenameFromDisposition(response.headers.get('content-disposition') || '') ||
    `wechat-assets-${Date.now()}.zip`;
  downloadBlob(await response.blob(), filename);
  setStatus(`${label}打包完成，zip 已开始下载。`, 'success');
};

const resetToSample = async () => {
  const nextUrl = new URL(window.location.href);
  nextUrl.searchParams.delete('data');
  nextUrl.searchParams.delete('url');
  window.history.replaceState({}, '', nextUrl);
  state.remoteUrl = '';
  state.extractedUrl = '';
  $('#remote-input').value = '';
  $('#extract-input').value = '';
  $('#file-input').value = '';
  setMode('sample');
  await loadSample();
};

const copyShareLink = async () => {
  const nextUrl = new URL(window.location.href);
  nextUrl.searchParams.delete('data');
  nextUrl.searchParams.delete('url');
  if (state.mode === 'remote' && state.remoteUrl) {
    nextUrl.searchParams.set('data', state.remoteUrl);
  } else if (state.mode === 'extract' && state.extractedUrl) {
    nextUrl.searchParams.set('url', state.extractedUrl);
  } else {
    setStatus('当前模式没有可直接分享的动态链接。请先加载远程 JSON 或在线提取结果。', 'error');
    return;
  }
  if (getSearch().get('api')) nextUrl.searchParams.set('api', getSearch().get('api'));
  await navigator.clipboard.writeText(nextUrl.toString());
  setStatus('分享链接已复制。', 'success');
};

const bindEvents = () => {
  document.querySelectorAll('#mode-switch .chip').forEach((chip) => {
    chip.addEventListener('click', () => setMode(chip.dataset.mode));
  });
  $('#view-preview').addEventListener('click', () => {
    state.textView = 'preview';
    if (state.data) renderText(state.data);
  });
  $('#view-full').addEventListener('click', () => {
    state.textView = 'full';
    if (state.data) renderText(state.data);
  });
  $('#load-button').addEventListener('click', async () => {
    try {
      if (state.mode === 'extract') await extractOnline($('#extract-input').value);
      else if (state.mode === 'sample') await loadSample();
      else if (state.mode === 'upload') await loadUpload($('#file-input').files[0]);
      else await loadRemote($('#remote-input').value);
    } catch (error) {
      setStatus(error.message || String(error), 'error');
    }
  });
  $('#reset-button').addEventListener('click', async () => {
    try {
      await resetToSample();
    } catch (error) {
      setStatus(error.message || String(error), 'error');
    }
  });
  $('#share-button').addEventListener('click', async () => {
    try {
      await copyShareLink();
    } catch (error) {
      setStatus(error.message || String(error), 'error');
    }
  });
  $('#download-images-button').addEventListener('click', async () => {
    try {
      await downloadBundle({ includeImages: true, includeVideos: false, label: '图片' });
    } catch (error) {
      setStatus(error.message || String(error), 'error');
    }
  });
  $('#download-videos-button').addEventListener('click', async () => {
    try {
      await downloadBundle({ includeImages: false, includeVideos: true, label: '视频' });
    } catch (error) {
      setStatus(error.message || String(error), 'error');
    }
  });
  $('#download-all-button').addEventListener('click', async () => {
    try {
      await downloadBundle({ includeImages: true, includeVideos: true, label: '图片和视频' });
    } catch (error) {
      setStatus(error.message || String(error), 'error');
    }
  });
};

const init = async () => {
  bindEvents();
  setApiNote();
  const search = getSearch();
  const remote = search.get('data');
  const articleUrl = search.get('url');
  try {
    if (articleUrl) {
      setMode('extract');
      $('#extract-input').value = articleUrl;
      await extractOnline(articleUrl);
    } else if (remote) {
      setMode('remote');
      $('#remote-input').value = remote;
      await loadRemote(remote);
    } else {
      setMode(apiBase ? 'extract' : 'sample');
      if (apiBase) setStatus('已就绪。输入公众号链接后点击“加载当前模式数据”。');
      else await loadSample();
    }
  } catch (error) {
    setStatus(error.message || String(error), 'error');
  }
};

window.addEventListener('beforeunload', revokeGeneratedUrls);
init();
