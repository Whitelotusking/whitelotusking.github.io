const state = {
  profile: null,
  posts: []
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

function renderPosts(posts) {
  const list = document.querySelector("#post-list");

  if (!Array.isArray(posts) || posts.length === 0) {
    list.innerHTML = `<article class="post-card"><h3>暂无文章</h3><p>在 <code>anime-blog/data/posts.json</code> 中添加文章数据即可显示。</p></article>`;
    return;
  }

  list.innerHTML = posts.map((post, index) => {
    const [a, b] = gradients[index % gradients.length];
    const tags = Array.isArray(post.tags) ? post.tags : [];
    return `
      <article class="post-card" style="--cover-a:${a}; --cover-b:${b};">
        <div class="post-date">${escapeHtml(post.date || "")}</div>
        <h3>${escapeHtml(post.title || "未命名文章")}</h3>
        <p>${escapeHtml(post.summary || "暂无摘要。")}</p>
        <div class="post-tags">
          ${tags.map(tag => `<span># ${escapeHtml(tag)}</span>`).join("")}
        </div>
      </article>
    `;
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

async function init() {
  setupTheme();
  document.querySelector("#year").textContent = new Date().getFullYear();

  const [profile, posts] = await Promise.all([
    getJson("./data/profile.json", {}),
    getJson("./data/posts.json", [])
  ]);

  state.profile = profile;
  state.posts = posts;
  renderProfile(profile);
  renderPosts(posts);
}

init();
