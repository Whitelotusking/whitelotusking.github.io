const commentsDefaults = {
  enabled: false,
  provider: "giscus",
  repo: "Whitelotusking/whitelotusking.github.io",
  repoId: "",
  category: "Announcements",
  categoryId: "",
  mapping: "pathname",
  strict: "0",
  reactionsEnabled: "1",
  emitMetadata: "0",
  inputPosition: "bottom",
  lang: "zh-CN",
  loading: "lazy",
  themeLight: "light",
  themeDark: "dark",
  setupSteps: []
};

async function loadCommentsConfig() {
  try {
    const response = await fetch("./data/comments.json", { cache: "no-store" });
    if (!response.ok) throw new Error("comments config not found");
    const config = await response.json();
    return { ...commentsDefaults, ...config };
  } catch (error) {
    console.warn(error);
    return commentsDefaults;
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getCurrentGiscusTheme(config) {
  const isDark = document.documentElement.dataset.theme === "dark";
  return isDark ? config.themeDark : config.themeLight;
}

function hasRequiredGiscusConfig(config) {
  return Boolean(
    config.enabled &&
    config.provider === "giscus" &&
    config.repo &&
    config.repoId &&
    config.category &&
    config.categoryId
  );
}

function renderPlaceholder(config) {
  const root = document.querySelector("#comments-root");
  const steps = Array.isArray(config.setupSteps) && config.setupSteps.length > 0
    ? config.setupSteps
    : commentsDefaults.setupSteps;

  root.innerHTML = `
    <div class="comments-placeholder">
      <div>
        <strong>评论区还没有启用。</strong>
        <p>评论模块已经接入页面。补齐 <code>data/comments.json</code> 里的 giscus 配置后，会自动加载 GitHub Discussions 评论区。</p>
      </div>
      <ol class="comments-steps">
        ${steps.map(step => `<li>${escapeHtml(step)}</li>`).join("")}
      </ol>
      <div class="comments-actions">
        <a href="https://github.com/Whitelotusking/whitelotusking.github.io/settings" target="_blank" rel="noopener noreferrer">打开仓库设置</a>
        <a href="https://giscus.app/zh-CN" target="_blank" rel="noopener noreferrer">打开 giscus 配置页</a>
        <button type="button" id="comments-copy-path">复制配置文件路径</button>
      </div>
    </div>
  `;

  const copyButton = document.querySelector("#comments-copy-path");
  copyButton?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText("anime-blog/data/comments.json");
      copyButton.textContent = "已复制";
      window.setTimeout(() => { copyButton.textContent = "复制配置文件路径"; }, 1400);
    } catch (error) {
      copyButton.textContent = "路径：anime-blog/data/comments.json";
    }
  });
}

function loadGiscus(config) {
  const root = document.querySelector("#comments-root");
  root.innerHTML = `<div class="giscus"></div>`;

  const script = document.createElement("script");
  script.src = "https://giscus.app/client.js";
  script.async = true;
  script.crossOrigin = "anonymous";
  script.setAttribute("data-repo", config.repo);
  script.setAttribute("data-repo-id", config.repoId);
  script.setAttribute("data-category", config.category);
  script.setAttribute("data-category-id", config.categoryId);
  script.setAttribute("data-mapping", config.mapping || "pathname");
  script.setAttribute("data-strict", config.strict || "0");
  script.setAttribute("data-reactions-enabled", config.reactionsEnabled || "1");
  script.setAttribute("data-emit-metadata", config.emitMetadata || "0");
  script.setAttribute("data-input-position", config.inputPosition || "bottom");
  script.setAttribute("data-theme", getCurrentGiscusTheme(config));
  script.setAttribute("data-lang", config.lang || "zh-CN");
  script.setAttribute("data-loading", config.loading || "lazy");
  root.appendChild(script);
}

function syncGiscusTheme(config) {
  const iframe = document.querySelector("iframe.giscus-frame");
  if (!iframe) return;

  iframe.contentWindow?.postMessage({
    giscus: {
      setConfig: {
        theme: getCurrentGiscusTheme(config)
      }
    }
  }, "https://giscus.app");
}

function observeTheme(config) {
  const observer = new MutationObserver(() => syncGiscusTheme(config));
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"]
  });
}

async function initComments() {
  const root = document.querySelector("#comments-root");
  if (!root) return;

  const config = await loadCommentsConfig();
  const status = document.querySelector("#comments-status");

  if (!hasRequiredGiscusConfig(config)) {
    status.textContent = "待配置";
    renderPlaceholder(config);
    return;
  }

  status.textContent = "已启用";
  loadGiscus(config);
  observeTheme(config);
}

initComments();
