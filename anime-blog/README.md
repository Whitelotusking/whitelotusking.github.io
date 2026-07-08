# Anime Blog

这是 `Whitelotusking/whitelotusking.github.io` 中的二次元风格博客子站点。

访问地址：

```text
https://whitelotusking.github.io/anime-blog/
```

## 数据文件

- `data/profile.json`：网站标题、作者、简介、个人标签。
- `data/posts.json`：文章列表、分类、标签、摘要和正文。
- `data/music.json`：环境音乐播放器的原创合成器曲目配置。
- `data/mascot.json`：Live2D 风格看板娘名称、提示语和闲置提示。

## 新增文章

在 `data/posts.json` 中追加一个对象即可：

```json
{
  "slug": "my-new-post",
  "title": "新文章标题",
  "date": "2026-07-08",
  "category": "Study",
  "summary": "文章摘要。",
  "tags": ["Tag1", "Tag2"],
  "body": [
    { "type": "p", "text": "正文段落。" },
    { "type": "h2", "text": "小标题" },
    { "type": "ul", "items": ["列表项 1", "列表项 2"] }
  ]
}
```

`slug` 会用于文章详情页地址，例如：

```text
post.html?id=my-new-post
```

## 当前阶段功能

- 首页文章卡片
- 文章详情页
- 分类筛选
- 关键词搜索
- 文章归档
- 暗黑模式
- Shoka 风格渐变与樱花动效
- 阅读进度条
- 返回顶部按钮
- 鼠标星光拖尾
- 原创 Web Audio 环境音乐播放器
- Live2D 风格看板娘
- 看板娘对话气泡
- 看板娘拖拽位置记忆
- 看板娘关闭与唤回
- 看板娘视线跟随鼠标

## 阶段记录

- Stage 1：博客核心功能，包含文章详情、分类筛选、关键词搜索和归档。已完成。
- Stage 2：音乐播放器、鼠标特效、阅读进度条、返回顶部和更多 Shoka 动效。已完成。
- Stage 3：轻量 Live2D 风格看板娘，包含对话、关闭、唤回、拖拽和视线跟随。已完成。
- Stage 4：评论区，建议使用 GitHub Discussions + giscus。
- Stage 5：如需要，再迁移到 Hexo/ShokaX 或 Astro 正式博客工程。

## 注意

当前音乐播放器不会加载外部版权音频，而是通过浏览器 Web Audio API 生成简单环境音。浏览器通常要求用户点击后才能播放音频，所以播放器不会自动播放。

当前看板娘是轻量 SVG/CSS/JS 实现，不加载第三方 Live2D 模型。这样可以避免版权、性能和外部资源失效问题。之后如果你有可合法使用的 Live2D 模型文件，可以替换成真正的 Live2D Cubism 加载方案。
