# 抱抱獭 MomFlow

给碎片时间创作者的温柔 AI 工作台。  
**MomFlow is a gentle AI workspace for fragmented creators.**

MomFlow 帮你在被打断、低电量、只有 5 分钟的日子里，先抱住一个灵感，再把它慢慢变成图文、口播、视频脚本或分镜。它可以作为 PWA 添加到手机桌面，像一个轻量 App 一样随时打开。

MomFlow helps creators capture tiny ideas, recover from interruptions, and turn scattered thoughts into posts, scripts, and storyboards. It is a lightweight PWA that can be installed to the phone home screen.

## Why It Feels Useful

- **一键抱住灵感 / Capture fast**: 打开就能写一句，支持语音输入。
- **断点恢复 / Resume gently**: 被打断时保存下一步，不用从头再来。
- **内容生成 / Create content**: 本地模板先跑通，后续可接 DeepSeek、Qwen、GLM、Doubao、OpenAI-compatible API。
- **内容池 / Pipeline**: 灵感池、草稿池、分镜池、待发布、已发布，轻量管理创作流程。
- **中英切换 / Bilingual UI**: 中文模式全中文，英文模式全英文。
- **手机桌面 / Home screen**: 支持 PWA 安装、离线页、通知权限、桌面角标预留。

## Product Name

- 中文名：抱抱獭
- 英文名：MomFlow
- 角色名：Otto
- 仓库名建议：`momflow-os`

## Quick Start

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, usually:

```text
http://localhost:5173/
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## How To Use

1. Open MomFlow and choose Chinese or English from the top language button.
2. Pick your current state: energy, sleep, context, and available time.
3. Save a quick idea in **Ideas**. Use voice input when typing feels heavy.
4. Move to **Create** and choose platform, content type, and style.
5. Generate a draft, copy it, or save it to the pipeline.
6. Use **Pipeline** to continue drafts, storyboards, and publishing tasks.
7. Add it to your phone home screen so it behaves like a tiny app.

## Add To Home Screen

**iPhone / Safari**

1. Open the deployed site in Safari.
2. Tap the Share button.
3. Choose **Add to Home Screen**.
4. Confirm the name and tap **Add**.

**Android / Chrome**

1. Open the deployed site in Chrome.
2. Tap **Install app** or **Add to Home screen**.
3. Confirm installation.

The app includes `manifest.json`, a service worker, icons, and an offline page, so it is ready for PWA deployment.

## AI Setup

MomFlow works even without an API key by using local templates. For stronger generation, connect a model provider in **Settings**:

- DeepSeek
- DashScope / Qwen
- Zhipu GLM
- Volcengine Ark / Doubao
- Baidu Qianfan / ERNIE
- Custom OpenAI-compatible endpoint
- OpenAI

For production, use a backend proxy instead of calling model APIs directly from the browser. This protects API keys and lets you add rate limits, user accounts, moderation, and billing later.

## Mainland China Notes

MomFlow can serve mainland China users, but deployment should avoid overseas-only dependencies:

- Host static assets on a mainland-accessible server or CDN.
- Keep icons and images inside `public/`.
- Prefer mainland-ready model providers such as DeepSeek, DashScope/Qwen, Zhipu GLM, Volcengine Ark/Doubao, or Baidu Qianfan.
- For a public mainland domain, complete required ICP filing and related compliance steps.

More details: [docs/mainland-china-guide.md](docs/mainland-china-guide.md)

## Project Structure

```text
src/
  App.tsx                  Main mobile-first PWA interface
  config.ts                Character, modes, platforms, styles
  i18n.ts                  Chinese and English copy
  lib/
    generator.ts           Local generation templates
    pwa.ts                 Install, reminders, service worker helpers
    storage.ts             IndexedDB storage
    ai/providers.ts        Model provider presets
public/
  manifest.json            PWA manifest
  sw.js                    Service worker
  offline.html             Offline fallback
  icons/                   Otto app icons
docs/
  mainland-china-guide.md  Mainland deployment and AI notes
  user-guide.md            End-user usage guide
```

## Roadmap

- Real AI generation through a backend proxy
- Content safety and platform-rule checks
- Scheduled reminders and Web Push
- Account sync and cloud backup
- Native widget or app version for richer desktop companion behavior

## License

MIT
