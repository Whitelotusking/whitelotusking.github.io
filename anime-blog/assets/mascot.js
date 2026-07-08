const mascotState = {
  config: {
    name: "小莲",
    title: "Lotus Garden 看板娘",
    messages: ["欢迎来到白莲的小站。"],
    idleMessages: ["我会安静一点，不影响阅读。"]
  },
  messageIndex: 0,
  idleTimer: null,
  dragging: false,
  dragStart: { x: 0, y: 0, left: 0, top: 0 }
};

async function loadMascotConfig() {
  try {
    const response = await fetch("./data/mascot.json", { cache: "no-store" });
    if (!response.ok) throw new Error("mascot data not found");
    const config = await response.json();
    mascotState.config = {
      ...mascotState.config,
      ...config,
      messages: Array.isArray(config.messages) && config.messages.length > 0 ? config.messages : mascotState.config.messages,
      idleMessages: Array.isArray(config.idleMessages) && config.idleMessages.length > 0 ? config.idleMessages : mascotState.config.idleMessages
    };
  } catch (error) {
    console.warn(error);
  }
}

function createMascotMarkup() {
  const host = document.createElement("section");
  host.className = "mascot-host";
  host.setAttribute("aria-label", "Live2D 风格看板娘");
  host.innerHTML = `
    <div class="mascot-bubble" role="status" aria-live="polite"></div>
    <div class="mascot-card" role="button" tabindex="0" aria-label="看板娘，点击切换提示，拖动可以移动位置">
      <div class="mascot-actions">
        <button class="mascot-action mascot-talk" type="button" aria-label="切换看板娘提示">?</button>
        <button class="mascot-action mascot-close" type="button" aria-label="隐藏看板娘">×</button>
      </div>
      <svg class="mascot-svg" viewBox="0 0 180 230" aria-hidden="true">
        <ellipse class="mascot-shadow" cx="91" cy="214" rx="52" ry="10" fill="rgba(43,36,64,.38)" />
        <path class="mascot-body" d="M48 167 C45 138 61 118 90 118 C120 118 136 139 132 168 L126 211 L55 211 Z" fill="url(#mascotBody)" />
        <path d="M63 142 C72 156 108 156 118 142 L122 204 L58 204 Z" fill="rgba(255,255,255,.52)" />
        <path class="mascot-ribbon" d="M83 153 L63 139 L79 134 L90 147 L101 134 L117 139 L97 153 L90 149 Z" fill="#ff7fc0" />
        <path class="mascot-ear left" d="M44 82 C25 54 28 34 52 22 C72 46 72 65 61 84 Z" fill="url(#mascotHair)" />
        <path class="mascot-ear right" d="M136 82 C155 54 152 34 128 22 C108 46 108 65 119 84 Z" fill="url(#mascotHair)" />
        <circle class="mascot-face" cx="90" cy="91" r="55" fill="#fff2f7" />
        <path class="mascot-hair" d="M36 91 C34 42 60 25 91 25 C122 25 148 43 144 92 C133 62 120 52 99 51 C99 69 88 75 72 78 C76 64 74 55 69 48 C56 56 46 69 36 91 Z" fill="url(#mascotHair)" />
        <circle class="mascot-cheek" cx="61" cy="102" r="9" fill="rgba(255,143,199,.38)" />
        <circle class="mascot-cheek" cx="119" cy="102" r="9" fill="rgba(255,143,199,.38)" />
        <g class="mascot-eye left-eye">
          <ellipse cx="69" cy="88" rx="8" ry="11" fill="#423254" />
          <circle cx="72" cy="84" r="3" fill="#fff" />
        </g>
        <g class="mascot-eye right-eye">
          <ellipse cx="111" cy="88" rx="8" ry="11" fill="#423254" />
          <circle cx="114" cy="84" r="3" fill="#fff" />
        </g>
        <path class="mascot-mouth" d="M82 111 Q90 119 98 111" fill="none" stroke="#7b536f" stroke-width="4" stroke-linecap="round" />
        <path d="M64 42 C57 56 58 72 69 83" fill="none" stroke="rgba(255,255,255,.48)" stroke-width="5" stroke-linecap="round" />
        <defs>
          <linearGradient id="mascotHair" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#a98cff" />
            <stop offset=".52" stop-color="#ff8fc7" />
            <stop offset="1" stop-color="#8ac7ff" />
          </linearGradient>
          <linearGradient id="mascotBody" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#ff8fc7" />
            <stop offset="1" stop-color="#8ac7ff" />
          </linearGradient>
        </defs>
      </svg>
      <div class="mascot-nameplate"></div>
    </div>
  `;

  const summon = document.createElement("button");
  summon.className = "mascot-summon";
  summon.type = "button";
  summon.textContent = "召唤小莲";
  summon.setAttribute("aria-label", "显示看板娘");

  document.body.append(host, summon);
}

function showMessage(text) {
  const bubble = document.querySelector(".mascot-bubble");
  if (!bubble) return;
  bubble.textContent = text;
  bubble.style.animation = "none";
  window.requestAnimationFrame(() => {
    bubble.style.animation = "";
  });
}

function nextMessage() {
  const messages = mascotState.config.messages;
  const message = messages[mascotState.messageIndex % messages.length];
  mascotState.messageIndex += 1;
  showMessage(message);
}

function randomIdleMessage() {
  const messages = mascotState.config.idleMessages;
  const message = messages[Math.floor(Math.random() * messages.length)];
  showMessage(message);
}

function startIdleMessages() {
  window.clearInterval(mascotState.idleTimer);
  mascotState.idleTimer = window.setInterval(() => {
    const hidden = localStorage.getItem("anime-blog-mascot-hidden") === "1";
    if (!hidden) randomIdleMessage();
  }, 16000);
}

function setHidden(hidden) {
  const host = document.querySelector(".mascot-host");
  const summon = document.querySelector(".mascot-summon");
  host.classList.toggle("is-hidden", hidden);
  summon.classList.toggle("is-visible", hidden);
  localStorage.setItem("anime-blog-mascot-hidden", hidden ? "1" : "0");
}

function restoreState() {
  const host = document.querySelector(".mascot-host");
  const nameplate = document.querySelector(".mascot-nameplate");
  const saved = localStorage.getItem("anime-blog-mascot-position");
  const hidden = localStorage.getItem("anime-blog-mascot-hidden") === "1";

  nameplate.textContent = mascotState.config.name || "小莲";

  if (saved) {
    try {
      const position = JSON.parse(saved);
      if (Number.isFinite(position.left) && Number.isFinite(position.top)) {
        host.style.left = `${Math.max(8, Math.min(position.left, window.innerWidth - 120))}px`;
        host.style.top = `${Math.max(8, Math.min(position.top, window.innerHeight - 120))}px`;
        host.style.bottom = "auto";
      }
    } catch (error) {
      console.warn(error);
    }
  }

  setHidden(hidden);
  nextMessage();
}

function savePosition() {
  const host = document.querySelector(".mascot-host");
  const rect = host.getBoundingClientRect();
  localStorage.setItem("anime-blog-mascot-position", JSON.stringify({ left: rect.left, top: rect.top }));
}

function setupDrag() {
  const host = document.querySelector(".mascot-host");
  const card = document.querySelector(".mascot-card");

  card.addEventListener("pointerdown", event => {
    if (event.target.closest("button")) return;
    const rect = host.getBoundingClientRect();
    mascotState.dragging = true;
    mascotState.dragStart = {
      x: event.clientX,
      y: event.clientY,
      left: rect.left,
      top: rect.top
    };
    card.setPointerCapture(event.pointerId);
  });

  card.addEventListener("pointermove", event => {
    if (!mascotState.dragging) return;
    const nextLeft = mascotState.dragStart.left + event.clientX - mascotState.dragStart.x;
    const nextTop = mascotState.dragStart.top + event.clientY - mascotState.dragStart.y;
    host.style.left = `${Math.max(8, Math.min(nextLeft, window.innerWidth - 120))}px`;
    host.style.top = `${Math.max(8, Math.min(nextTop, window.innerHeight - 120))}px`;
    host.style.bottom = "auto";
  });

  card.addEventListener("pointerup", event => {
    if (!mascotState.dragging) return;
    mascotState.dragging = false;
    savePosition();
    card.releasePointerCapture(event.pointerId);
    showMessage("位置已记住，下次还会在这里出现。");
  });
}

function setupEyeTracking() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  window.addEventListener("pointermove", event => {
    const svg = document.querySelector(".mascot-svg");
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = Math.max(-3, Math.min(3, (event.clientX - centerX) / 80));
    const dy = Math.max(-2, Math.min(2, (event.clientY - centerY) / 90));
    svg.style.setProperty("--eye-x", `${dx}px`);
    svg.style.setProperty("--eye-y", `${dy}px`);
  }, { passive: true });
}

function setupActions() {
  document.querySelector(".mascot-talk").addEventListener("click", event => {
    event.stopPropagation();
    nextMessage();
  });

  document.querySelector(".mascot-close").addEventListener("click", event => {
    event.stopPropagation();
    setHidden(true);
  });

  document.querySelector(".mascot-summon").addEventListener("click", () => {
    setHidden(false);
    showMessage("我回来了。继续一起完善这个博客吧。");
  });

  document.querySelector(".mascot-card").addEventListener("click", event => {
    if (event.target.closest("button")) return;
    nextMessage();
  });

  document.querySelector(".mascot-card").addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      nextMessage();
    }
  });
}

async function initMascot() {
  await loadMascotConfig();
  createMascotMarkup();
  restoreState();
  setupActions();
  setupDrag();
  setupEyeTracking();
  startIdleMessages();
}

initMascot();
