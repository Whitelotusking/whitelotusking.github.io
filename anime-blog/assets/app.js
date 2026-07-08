const state = {
  profile: null,
  posts: [],
  activeCategory: "全部",
  query: ""
};

const gradients = [
  ["#ff8fc7", "#8ac7ff"],
  ["#b49cff", "#ffcfef"],
  ["#8ac7ff", "#c9b6ff"],
  ["#ffb1d6", "#ffe6a8"]
];

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

function normalize(value) {
  return String(value || "").toLowerCase().trim();
}

function getPostUrl(post) {
  return `./post.html?id=${encodeURIComponent(post.slug || post.title || "")}`;
}

function getSortedPosts(posts) {
  return [...posts].sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
}

function renderProfile(profile) {
  document.title = profile.siteTitle || "白莲的小站";
  document.querySelector("#site-title").textContent = profile.siteTitle || "白莲的小站";
  document.querySelector("#site-subtitle").textContent = profile.subtitle || "在代码、日常与幻想之间记录碎片。";
  document.querySelector("#author-name").textContent = profile.author || "Whitelotusking";
  document.querySelector("#author-bio").textContent = profile.bio || "这里会放头像、简介、技能和联系方式。";

  const tags = Array.isArray(profile.tags) ? profile.tags : [];
  document.querySelector("#profile-tags").innerHTML = tags
    .map(tag => `<span class="chip">${escapeHtml(tag)}</span>`)
    .join("");
}

function getFilteredPosts() {
  const q = normalize(state.query);
  return getSortedPosts(state.posts).filter(post => {
    const category = post.category || "未分类";
    const categoryOk = state.activeCategory === "全部" || category === state.activeCategory;
    const searchable = [
      post.title,
      post.summary,
      post.category,
      ...(Array.isArray(post.tags) ? post.tags : [])
    ].map(normalize).join(" ");
    const queryOk = !q || searchable.includes(q);
    return categoryOk && queryOk;
  });
}

function renderCategoryFilters(posts) {
  const container = document.querySelector("#category-filters");
  const categories = ["全部", ...new Set(posts.map(post => post.category || "未分类"))];

  container.innerHTML = categories.map(category => `
    <button class="filter-btn ${category === state.activeCategory ? "is-active" : ""}" type="button" data-category="${escapeHtml(category)}">
      ${escapeHtml(category)}
    </button>
  `).join("");

  container.querySelectorAll("button").forEach(button => {
    button.addEventListener("click", () => {
      state.activeCategory = button.dataset.category;
      renderCategoryFilters(state.posts);
      renderPosts(getFilteredPosts());
    });
  });
}

function renderPosts(posts) {
  const list = document.querySelector("#post-list");

  if (!Array.isArray(posts) || posts.length === 0) {
    list.innerHTML = `<div class="empty-state">没有找到匹配的文章。可以换个关键词，或者切回“全部”分类。</div>`;
    return;
  }

  list.innerHTML = posts.map((post, index) => {
    const [a, b] = gradients[index % gradients.length];
    const tags = Array.isArray(post.tags) ? post.tags : [];
    return `
      <article class="post-card" style="--cover-a:${a}; --cover-b:${b};">
        <a class="post-card-link" href="${getPostUrl(post)}">
          <div class="post-meta-line">
            <time>${escapeHtml(post.date || "")}</time>
            <span class="post-category">${escapeHtml(post.category || "未分类")}</span>
          </div>
          <h3>${escapeHtml(post.title || "未命名文章")}</h3>
          <p>${escapeHtml(post.summary || "暂无摘要。")}</p>
          <div class="post-tags">
            ${tags.map(tag => `<span># ${escapeHtml(tag)}</span>`).join("")}
          </div>
          <span class="read-more">阅读全文</span>
        </a>
      </article>
    `;
  }).join("");
}

function renderArchive(posts) {
  const archive = document.querySelector("#archive-list");
  const grouped = getSortedPosts(posts).reduce((acc, post) => {
    const key = String(post.date || "未注明日期").slice(0, 7);
    if (!acc[key]) acc[key] = [];
    acc[key].push(post);
    return acc;
  }, {});

  archive.innerHTML = Object.entries(grouped).map(([month, items]) => `
    <section class="archive-group">
      <h3>${escapeHtml(month)}</h3>
      ${items.map(post => `
        <a class="archive-item" href="${getPostUrl(post)}">
          <time>${escapeHtml(post.date || "")}</time>
          <strong>${escapeHtml(post.title || "未命名文章")}</strong>
          <span>${escapeHtml(post.category || "未分类")}</span>
        </a>
      `).join("")}
    </section>
  `).join("");
}

function setupSearch() {
  const input = document.querySelector("#search-input");
  input.addEventListener("input", () => {
    state.query = input.value;
    renderPosts(getFilteredPosts());
  });
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

async function init() {
  setupTheme();
  setupSearch();
  document.querySelector("#year").textContent = new Date().getFullYear();

  const [profile, posts] = await Promise.all([
    getJson("./data/profile.json", {}),
    getJson("./data/posts.json", [])
  ]);

  state.profile = profile;
  state.posts = Array.isArray(posts) ? posts : [];
  renderProfile(profile);
  renderCategoryFilters(state.posts);
  renderPosts(getFilteredPosts());
  renderArchive(state.posts);
}

init();
