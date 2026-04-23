const dataUrl = './data/article.json';

const escapeHtml = (value = '') =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const summarizeParagraphs = (contentText) => {
  const segments = String(contentText || '')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 8);
  return segments.map((line) => `<p>${escapeHtml(line)}</p>`).join('');
};

const renderApp = (data) => {
  const app = document.querySelector('#app');
  const imageCount = data.images?.length || 0;
  const videoCount = data.videos?.length || 0;
  const imageCards = (data.images || []).slice(0, 6).map((image, index) => `
    <figure class="thumb">
      <img src="${escapeHtml(image.url)}" alt="${escapeHtml(image.alt || `图片 ${index + 1}`)}" loading="lazy" />
      <figcaption>${escapeHtml(image.alt || `正文图片 ${index + 1}`)}</figcaption>
    </figure>
  `).join('');
  const videoCards = (data.videos || []).map((video, index) => `
    <div class="video-item">
      <strong>视频 ${index + 1}</strong><br />
      <a href="${escapeHtml(video.url)}" target="_blank" rel="noreferrer">打开视频链接</a>
    </div>
  `).join('');

  app.innerHTML = `
    <h1>${escapeHtml(data.title || '未命名文章')}</h1>
    <ul class="meta">
      <li>公众号：${escapeHtml(data.account_name || '未知')}</li>
      <li>作者：${escapeHtml(data.author || '未知')}</li>
      <li>发布时间：${escapeHtml(data.publish_time || '未知')}</li>
    </ul>
    <ul class="stats">
      <li>${imageCount} 张图片</li>
      <li>${videoCount} 个视频</li>
      <li>${escapeHtml((data.content_text || '').length.toLocaleString())} 字正文文本</li>
    </ul>
    <div class="layout">
      <section class="card">
        <h2>文章摘要</h2>
        <p class="summary">${escapeHtml(data.summary || '该文章页面未暴露摘要，这里展示正文前几段。')}</p>
        <div class="text-block">${summarizeParagraphs(data.content_text)}</div>
        <div class="actions">
          <a class="button primary" href="${escapeHtml(data.url)}" target="_blank" rel="noreferrer">打开原文</a>
          <a class="button ghost" href="./data/article.json" target="_blank" rel="noreferrer">查看 JSON</a>
          <a class="button ghost" href="./data/article.md" target="_blank" rel="noreferrer">查看 Markdown</a>
        </div>
        <div class="footer-note">页面由本地提取脚本生成，可直接部署到 GitHub Pages。</div>
      </section>
      <section class="card">
        <h2>媒体概览</h2>
        <div class="media-grid">${imageCards || '<div class="error">未提取到图片</div>'}</div>
        <div style="height: 18px"></div>
        <div class="video-list">${videoCards || '<div class="error">未提取到视频</div>'}</div>
      </section>
    </div>
  `;
};

const renderError = (error) => {
  const app = document.querySelector('#app');
  app.innerHTML = `<div class="error">加载失败：${escapeHtml(error.message || String(error))}</div>`;
};

fetch(dataUrl)
  .then((response) => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  })
  .then(renderApp)
  .catch(renderError);
