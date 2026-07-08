async function getJson(path, fallback) {
  try {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) throw new Error(`Failed to load ${path}`);
    return await response.json();
  } catch (error) {
    console.warn(error);
    return fallback;
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

function getPostUrl(post) {
  return `./post.html?id=${encodeURIComponent(post.slug || post.title || "")}`;
}

function renderBlocks(blocks) {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return `<p>这篇文章暂时没有正文。请在 <code>anime-blog/data/posts.json</code> 中补充 <code>body</code> 字段。</p>`;
  }

  return blocks.map(block => {
    if (block.type === "h2") {
      return `<h2>${escapeHtml(block.text || "")}</h2>`;
    }

    if (block.type === "ul") {
      const items = Array.isArray(block.items) ? block.items : [];
      return `<ul>${items.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
    }

    return `<p>${escapeHtml(block.text || "")}</p>`;
  }).join("");
}

function setupTheme() {
  const button = document.querySelector("#theme-toggle");
  const saved = localStorage.getItem("anime-blog-theme");
  const preferredDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = saved || (preferredDark ? "dark" : "light");

  document.documentElement.dataset.theme = theme;
  button.textContent = theme === "dark" ? "☀" : "☾";

  button.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    button.textContent = next === "dark" ? "☀" : "☾";
    localStorage.setItem("anime-blog-theme", next);
  });
}

function renderArticle(post) {
  const root = document.querySelector("#article-root");
  const tags = Array.isArray(post.tags) ? post.tags : [];

  document.title = `${post.title || "文章详情"} - 白莲的小站`;
  root.innerHTML = `
    <div class="article-topline">
      <time>${escapeHtml(post.date || "")}</time>
      <span>${escapeHtml(post.category || "未分类")}</span>
    </div>
    <h1 class="article-title">${escapeHtml(post.title || "未命名文章")}</h1>
    <p class="article-summary">${escapeHtml(post.summary || "")}</p>
    <div class="post-tags">
      ${tags.map(tag => `<span># ${escapeHtml(tag)}</span>`).join("")}
    </div>
    <div class="article-body">${renderBlocks(post.body)}</div>
    <div class="article-actions">
      <a class="btn primary" href="./">返回首页</a>
      <a class="btn ghost" href="./#archive">查看归档</a>
    </div>
  `;
}

function renderNotFound() {
  const root = document.querySelector("#article-root");
  root.innerHTML = `
    <p class="eyebrow">Not Found</p>
    <h1 class="article-title">没有找到这篇文章</h1>
    <p class="article-summary">请检查地址中的 <code>id</code> 是否和 <code>posts.json</code> 中的 <code>slug</code> 一致。</p>
    <div class="article-actions">
      <a class="btn primary" href="./">返回首页</a>
    </div>
  `;
}

function renderRelated(currentPost, posts) {
  const section = document.querySelector("#related-section");
  const list = document.querySelector("#related-list");
  const related = posts
    .filter(post => post.slug !== currentPost.slug)
    .filter(post => post.category === currentPost.category || (post.tags || []).some(tag => (currentPost.tags || []).includes(tag)))
    .slice(0, 3);

  if (related.length === 0) return;

  section.hidden = false;
  list.innerHTML = related.map(post => `
    <a href="${getPostUrl(post)}">
      <strong>${escapeHtml(post.title || "未命名文章")}</strong><br />
      <span>${escapeHtml(post.summary || "")}</span>
    </a>
  `).join("");
}

async function init() {
  setupTheme();
  document.querySelector("#year").textContent = new Date().getFullYear();

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id") || "";
  const posts = await getJson("./data/posts.json", []);
  const post = Array.isArray(posts)
    ? posts.find(item => item.slug === id || item.title === id)
    : null;

  if (!post) {
    renderNotFound();
    return;
  }

  renderArticle(post);
  renderRelated(post, posts);
}

init();
