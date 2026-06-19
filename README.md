# MomFlow

[English](#english) | [中文](#中文)

A tiny multilingual AI workspace for fragmented creators.

[Open the app](https://ezekielgarden-arch.github.io/momflow-os/) | [GitHub repository](https://github.com/ezekielgarden-arch/momflow-os)

<p>
  <strong>Scan to open MomFlow</strong><br />
  <img src="public/momflow-qr.png" alt="MomFlow QR code" width="160" />
</p>

MomFlow is a lightweight PWA that helps creators save ideas, recover from interruptions, and turn scattered thoughts into posts, scripts, and storyboards. It is warm, practical, slightly cute, and designed for real-life days when time never arrives in one perfect block.

---

## English

### What It Is

MomFlow is a gentle AI workspace for fragmented creators.

It helps you capture tiny ideas, recover from interruptions, and turn scattered thoughts into useful content assets. You can install it to your phone home screen as a PWA, so it feels like a small app you can open at the exact moment an idea appears.

### Try It

Open MomFlow here:

[https://ezekielgarden-arch.github.io/momflow-os/](https://ezekielgarden-arch.github.io/momflow-os/)

### Why It Is Useful

- **Capture fast**: write one sentence immediately, with voice input support.
- **Resume gently**: save the next step when interrupted instead of starting over.
- **Create content**: local templates work by default, with room for real model providers later.
- **Manage a pipeline**: Ideas, Drafts, Storyboards, To Publish, and Published.
- **Bilingual UI**: Chinese mode is fully Chinese; English mode is fully English.
- **Home-screen ready**: PWA install, offline page, notification permission, and shortcut support.

### Product Names

- English name: MomFlow
- Chinese name: 抱抱獭
- Character name: Otto
- Repository name: `momflow-os`

### Quick Start

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

### How To Use

1. Open MomFlow and choose Chinese or English from the top language button.
2. Pick your current state: energy, sleep, context, and available time.
3. Save a quick idea in **Ideas**. Use voice input when typing feels heavy.
4. Move to **Create** and choose platform, content type, and style.
5. Generate a draft, copy it, or save it to the pipeline.
6. Use **Pipeline** to continue drafts, storyboards, and publishing tasks.
7. Add it to your phone home screen so it behaves like a tiny app.

### Add To Home Screen

**iPhone / Safari**

1. Open the deployed site in Safari.
2. Tap the Share button.
3. Choose **Add to Home Screen**.
4. Confirm the name and tap **Add**.

**Android / Chrome**

1. Open the deployed site in Chrome.
2. Tap **Install app** or **Add to Home screen**.
3. Confirm installation.

### AI Setup

MomFlow works even without an API key by using local templates. For real online generation, connect a model provider in **Settings** by adding provider, endpoint, model, and API key:

- DeepSeek
- DashScope / Qwen
- Zhipu GLM
- Volcengine Ark / Doubao
- Baidu Qianfan / ERNIE
- Custom OpenAI-compatible endpoint
- OpenAI

For production, use a backend proxy instead of calling model APIs directly from the browser. This protects API keys and lets you add rate limits, user accounts, moderation, and billing later.

DeepSeek proxy guide: [docs/deepseek-proxy.md](docs/deepseek-proxy.md)

### Voice Input Note

Voice input uses the browser's built-in speech recognition when available. Some mobile browsers and in-app browsers do not support it. In that case, tap the text box and use your phone keyboard microphone, or type manually.

### Mainland China Notes

MomFlow can serve mainland China users, but deployment should avoid overseas-only dependencies:

- Host static assets on a mainland-accessible server or CDN.
- Keep icons and images inside `public/`.
- Prefer mainland-ready model providers such as DeepSeek, DashScope/Qwen, Zhipu GLM, Volcengine Ark/Doubao, or Baidu Qianfan.
- For a public mainland domain, complete required ICP filing and related compliance steps.

More details: [docs/mainland-china-guide.md](docs/mainland-china-guide.md)

### Project Structure

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

### Roadmap

- Real AI generation through a backend proxy
- Content safety and platform-rule checks
- Scheduled reminders and Web Push
- Account sync and cloud backup
- Native widget or app version for richer desktop companion behavior

---

## 中文

### 它是什么

MomFlow 是给碎片时间创作者的温柔 AI 工作台。

它帮助你在被打断、低电量、只有几分钟的日子里，先抱住一个灵感，再把它慢慢变成图文、口播、视频脚本或分镜。它可以作为 PWA 添加到手机桌面，像一个轻量 App 一样随时打开。

### 立即体验

打开 MomFlow：

[https://ezekielgarden-arch.github.io/momflow-os/](https://ezekielgarden-arch.github.io/momflow-os/)

### 为什么它有用

- **快速保存灵感**：打开就能写一句，支持语音输入。
- **断点恢复**：被打断时保存下一步，不用从头再来。
- **内容生成**：本地模板先跑通，后续可接真实模型供应商。
- **内容池管理**：灵感池、草稿池、分镜池、待发布、已发布，轻量管理创作流程。
- **中英切换**：App 内中文模式全中文，英文模式全英文。
- **添加到桌面**：支持 PWA 安装、离线页、通知权限和桌面快捷入口。

### 名字

- 英文名：MomFlow
- 中文名：抱抱獭
- 小动物角色名：Otto
- 仓库名：`momflow-os`

### 快速运行

```bash
npm install
npm run dev
```

通常打开：

```text
http://localhost:5173/
```

生产构建：

```bash
npm run build
```

预览生产构建：

```bash
npm run preview
```

### 怎么使用

1. 打开 MomFlow，在右上角选择中文或英文。
2. 在首页选择今天的状态：能量、睡眠、环境和可用时间。
3. 在“灵感”里保存一句想法，懒得打字时可以用语音输入。
4. 到“生成”页选择平台、内容类型和风格。
5. 生成草稿后，可以复制，也可以保存到内容池。
6. 在“内容池”里继续推进草稿、分镜和待发布内容。
7. 把它添加到手机桌面，下次有灵感时直接打开。

### 添加到手机桌面

**iPhone / Safari**

1. 用 Safari 打开部署后的网站。
2. 点分享按钮。
3. 选择“添加到主屏幕”。
4. 确认名称后点“添加”。

**Android / Chrome**

1. 用 Chrome 打开网站。
2. 点“安装应用”或“添加到桌面”。
3. 确认安装。

### AI 设置

不填 API Key 也能使用本地模板。想要真实联网生成，需要在“我的 / 设置”里填写供应商、接口地址、模型和 API Key：

- DeepSeek
- 阿里云百炼 / 通义千问
- 智谱 GLM
- 火山方舟 / 豆包
- 百度千帆 / 文心
- 自定义 OpenAI-compatible 接口
- OpenAI

正式上线时建议使用后端代理调用模型，避免 API Key 暴露在浏览器里。

DeepSeek 代理配置说明：[docs/deepseek-proxy.md](docs/deepseek-proxy.md)

### 语音输入说明

语音输入会优先使用浏览器自带语音识别。部分手机浏览器、微信内置浏览器可能不支持网页语音识别。这种情况下，可以点输入框后使用手机键盘自带麦克风，或直接手动输入。

### 中国大陆使用说明

MomFlow 可以面向中国大陆用户使用，但部署时建议：

- 静态资源部署在大陆可访问的服务器或 CDN。
- 图片和图标都放在项目 `public/` 里。
- 优先选择 DeepSeek、通义千问、智谱 GLM、豆包、百度千帆等大陆用户更容易访问的模型。
- 如果使用中国大陆正式域名，按需完成 ICP 备案和相关合规步骤。

更多说明：[docs/mainland-china-guide.md](docs/mainland-china-guide.md)

### 项目结构

```text
src/
  App.tsx                  手机优先的 PWA 主界面
  config.ts                角色、模式、平台、风格配置
  i18n.ts                  中文和英文文案
  lib/
    generator.ts           本地生成模板
    pwa.ts                 安装、提醒、Service Worker 辅助函数
    storage.ts             IndexedDB 本地存储
    ai/providers.ts        AI 供应商预设
public/
  manifest.json            PWA manifest
  sw.js                    Service Worker
  offline.html             离线页
  icons/                   Otto 图标
docs/
  mainland-china-guide.md  中国大陆部署和 AI 接入说明
  user-guide.md            用户使用指南
```

### 后续路线

- 通过后端代理接入真实 AI 生成
- 增加内容安全和平台规则检查
- 增加定时提醒和 Web Push
- 增加账号同步和云备份
- 做原生小组件或 App 版本，让 Otto 有更丰富的桌面陪伴能力

## License

MIT
