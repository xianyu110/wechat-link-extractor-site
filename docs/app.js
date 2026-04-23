const defaultDataUrl = "./data/article.json";
const defaultMarkdownUrl = "./data/article.md";

const state = {
  mode: "sample",
  data: null,
  textView: "preview",
  remoteUrl: "",
};

const $ = (selector) => document.querySelector(selector);

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const normalizeRemoteUrl = (value = "") => {
  const trimmed = String(value).trim();
  if (!trimmed) return "";
  try {
    return new URL(trimmed, window.location.href).toString();
  } catch {
    return trimmed;
  }
};

const summarizeParagraphs = (contentText, limit = 8) =>
  String(contentText || "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, limit);

const buildPreviewText = (contentText) =>
  summarizeParagraphs(contentText).map((line) => `<div class="text-card"><p>${escapeHtml(line)}</p></div>`).join("");

const buildFullText = (contentText) =>
  `<div class="text-card"><div class="text-full">${escapeHtml(contentText || "无正文")}</div></div>`;

const setStatus = (message, type = "") => {
  const node = $("#status-box");
  node.textContent = message;
  node.className = `status${type ? ` ${type}` : ""}`;
};

const setMode = (mode) => {
  state.mode = mode;
  document.querySelectorAll("#mode-switch .chip").forEach((chip) => {
    chip.classList.toggle("active", chip.dataset.mode === mode);
  });
  $("#upload-block").hidden = mode !== "upload";
  $("#remote-block").hidden = mode !== "remote";
};

const renderMeta = (data) => {
  const meta = [
    `公众号：${data.account_name || "未知"}`,
    `作者：${data.author || "未知"}`,
    `发布时间：${data.publish_time || "未知"}`,
  ];
  $("#article-meta").innerHTML = meta.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
};

const renderStats = (data) => {
  const stats = [
    `${(data.images || []).length} 张图片`,
    `${(data.videos || []).length} 个视频`,
    `${String((data.content_text || "").length)} 字正文`,
  ];
  $("#article-stats").innerHTML = stats.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
};

const renderText = (data) => {
  const container = $("#text-container");
  container.innerHTML =
    state.textView === "full"
      ? buildFullText(data.content_text)
      : buildPreviewText(data.content_text) || '<div class="empty">未提取到正文。</div>';
};

const renderVideos = (data) => {
  const container = $("#video-container");
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
          <p>${video.poster ? `封面：<a href="${escapeHtml(video.poster)}" target="_blank" rel="noreferrer">打开封面</a><br />` : ""}<a href="${escapeHtml(video.url)}" target="_blank" rel="noreferrer">打开视频链接</a></p>
        </div>
      `,
    )
    .join("");
};

const renderImages = (data) => {
  const container = $("#image-container");
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
              ${
                image.local_path
                  ? `<span class="chip active">已下载到本地</span>`
                  : `<span class="chip">远程图片</span>`
              }
            </div>
          </div>
        </article>
      `,
    )
    .join("");
};

const renderData = (data) => {
  state.data = data;
  $("#article-title").textContent = data.title || "未命名文章";
  $("#article-summary").textContent =
    data.summary || "该文章页面未暴露摘要，这里展示正文内容和媒体资源。";

  const sourceUrl = data.url || "#";
  $("#open-source").href = sourceUrl;

  if (state.mode === "sample") {
    $("#open-json").href = defaultDataUrl;
    $("#open-md").href = defaultMarkdownUrl;
  } else {
    $("#open-json").removeAttribute("href");
    $("#open-md").removeAttribute("href");
  }

  renderMeta(data);
  renderStats(data);
  renderText(data);
  renderVideos(data);
  renderImages(data);
};

const parseImportedData = (raw) => {
  const data = typeof raw === "string" ? JSON.parse(raw) : raw;
  if (!data || typeof data !== "object") {
    throw new Error("JSON 格式不正确。");
  }
  if (!("content_text" in data) || !("images" in data) || !("videos" in data)) {
    throw new Error("这不是预期的 article.json 结构。");
  }
  return data;
};

const fetchJson = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`加载失败：HTTP ${response.status}`);
  }
  return response.json();
};

const loadSample = async () => {
  setStatus("正在加载示例数据...");
  const data = await fetchJson(defaultDataUrl);
  renderData(data);
  setStatus("已加载仓库内置示例数据，可以直接浏览。", "success");
};

const loadRemote = async (inputUrl) => {
  const remoteUrl = normalizeRemoteUrl(inputUrl);
  if (!remoteUrl) {
    throw new Error("请先输入远程 JSON 地址。");
  }
  setStatus("正在加载远程 JSON...", "");
  const data = await fetchJson(remoteUrl);
  state.remoteUrl = remoteUrl;
  renderData(parseImportedData(data));
  setStatus("远程 JSON 加载成功。可以复制分享链接给别人直接打开。", "success");
  const nextUrl = new URL(window.location.href);
  nextUrl.searchParams.set("data", remoteUrl);
  window.history.replaceState({}, "", nextUrl);
};

const loadUpload = async (file) => {
  if (!file) {
    throw new Error("请先选择一个 article.json 文件。");
  }
  setStatus("正在读取本地 JSON 文件...", "");
  const text = await file.text();
  renderData(parseImportedData(text));
  setStatus("本地 JSON 加载成功。这个模式不会上传你的文件。", "success");
};

const resetToSample = async () => {
  const nextUrl = new URL(window.location.href);
  nextUrl.searchParams.delete("data");
  window.history.replaceState({}, "", nextUrl);
  state.remoteUrl = "";
  $("#remote-input").value = "";
  $("#file-input").value = "";
  setMode("sample");
  await loadSample();
};

const copyShareLink = async () => {
  if (state.mode !== "remote" || !state.remoteUrl) {
    setStatus("只有远程 JSON 模式才会生成可转发的分享链接。", "error");
    return;
  }
  const nextUrl = new URL(window.location.href);
  nextUrl.searchParams.set("data", state.remoteUrl);
  await navigator.clipboard.writeText(nextUrl.toString());
  setStatus("分享链接已复制。别人打开后会直接加载这份远程 JSON。", "success");
};

const bindEvents = () => {
  document.querySelectorAll("#mode-switch .chip").forEach((chip) => {
    chip.addEventListener("click", () => setMode(chip.dataset.mode));
  });

  $("#view-preview").addEventListener("click", () => {
    state.textView = "preview";
    if (state.data) renderText(state.data);
  });

  $("#view-full").addEventListener("click", () => {
    state.textView = "full";
    if (state.data) renderText(state.data);
  });

  $("#load-button").addEventListener("click", async () => {
    try {
      if (state.mode === "sample") {
        await loadSample();
      } else if (state.mode === "upload") {
        await loadUpload($("#file-input").files[0]);
      } else {
        await loadRemote($("#remote-input").value);
      }
    } catch (error) {
      setStatus(error.message || String(error), "error");
    }
  });

  $("#reset-button").addEventListener("click", async () => {
    try {
      await resetToSample();
    } catch (error) {
      setStatus(error.message || String(error), "error");
    }
  });

  $("#share-button").addEventListener("click", async () => {
    try {
      await copyShareLink();
    } catch (error) {
      setStatus(error.message || String(error), "error");
    }
  });
};

const init = async () => {
  bindEvents();

  const search = new URLSearchParams(window.location.search);
  const remote = search.get("data");

  try {
    if (remote) {
      setMode("remote");
      $("#remote-input").value = remote;
      await loadRemote(remote);
    } else {
      setMode("sample");
      await loadSample();
    }
  } catch (error) {
    setStatus(error.message || String(error), "error");
  }
};

init();
