const state = {
  profile: null,
  site: null,
  links: [],
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

function getAllTags(posts) {
  return posts.reduce((acc, post) => {
    const tags = Array.isArray(post.tags) ? post.tags : [];
    tags.forEach(tag => acc.set(tag, (acc.get(tag) || 0) + 1));
    return acc;
  }, new Map());
}

function renderProfile(profile) {
  const title = profile.siteTitle || "白莲的小站";
  const subtitle = profile.subtitle || "在代码、日常与幻想之间记录碎片。";

  document.title = title;
  document.querySelector("#site-title").textContent = title;
  document.querySelector("#site-subtitle").textContent = subtitle;

  const tags = Array.isArray(profile.tags) ? profile.tags : [];
  const profileTagNode = document.querySelector("#profile-tags");
  if (profileTagNode) {
    profileTagNode.innerHTML = tags.map(tag => `<span class="chip">${escapeHtml(tag)}</span>`).join("");
  }
}

function renderSite(site, posts) {
  document.querySelector("#hero-label").textContent = site.heroLabel || "GitHub Pages · Anime Blog";
  document.querySelector("#hero-note").textContent = site.heroNote || "一个逐步完善的二次元风格个人博客。";

  const tagCount = getAllTags(posts).size;
  const categoryCount = new Set(posts.map(post => post.category || "未分类")).size;
  const values = {
    posts: posts.length,
    tags: tagCount,
    categories: categoryCount
  };

  const statusCards = Array.isArray(site.statusCards) ? site.statusCards : [];
  document.querySelector("#hero-stats").innerHTML = statusCards.map(card => {
    const value = card.value === "auto" ? values[card.source] : card.value;
    return `
      <div class="stat-card">
        <strong>${escapeHtml(value ?? "-")}</strong>
        <span>${escapeHtml(card.label || "Stat")}</span>
      </div>
    `;
  }).join("");

  const quickLinks = Array.isArray(site.quickLinks) ? site.quickLinks : [];
  document.querySelector("#quick-links").innerHTML = quickLinks.map(link => `
    <a href="${escapeHtml(link.href || "#")}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.label || "Link")}</a>
  `).join("");
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
      document.querySelector("#posts")?.scrollIntoView({ behavior: "smooth", block: "start" });
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
          <span class="cover-symbol" aria-hidden="true">${escapeHtml(post.coverSymbol || "✧")}</span>
        </a>
      </article>
    `;
  }).join("");
}

function renderTagCloud(posts) {
  const container = document.querySelector("#tag-cloud");
  const tags = [...getAllTags(posts).entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  container.innerHTML = tags.map(([tag, count]) => `
    <button type="button" data-tag="${escapeHtml(tag)}"># ${escapeHtml(tag)} <span>${count}</span></button>
  `).join("");

  container.querySelectorAll("button").forEach(button => {
    button.addEventListener("click", () => {
      state.query = button.dataset.tag;
      document.querySelector("#search-input").value = button.dataset.tag;
      renderPosts(getFilteredPosts());
      document.querySelector("#posts")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
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

function renderFriendLinks(links) {
  const container = document.querySelector("#friend-links");
  if (!Array.isArray(links) || links.length === 0) {
    container.innerHTML = `<div class="empty-state">暂无友链。可以在 <code>data/links.json</code> 中添加。</div>`;
    return;
  }

  container.innerHTML = links.map(link => `
    <a class="friend-link-card" href="${escapeHtml(link.url || "#")}" target="_blank" rel="noopener noreferrer">
      <span class="tag">${escapeHtml(link.tag || "Link")}</span>
      <h3>${escapeHtml(link.name || "Friend")}</h3>
      <p>${escapeHtml(link.desc || "")}</p>
    </a>
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

  const [profile, site, posts, links] = await Promise.all([
    getJson("./data/profile.json", {}),
    getJson("./data/site.json", {}),
    getJson("./data/posts.json", []),
    getJson("./data/links.json", [])
  ]);

  state.profile = profile;
  state.site = site;
  state.links = Array.isArray(links) ? links : [];
  state.posts = Array.isArray(posts) ? posts : [];

  renderProfile(profile);
  renderSite(site, state.posts);
  renderCategoryFilters(state.posts);
  renderPosts(getFilteredPosts());
  renderTagCloud(state.posts);
  renderArchive(state.posts);
  renderFriendLinks(state.links);
}

init();
