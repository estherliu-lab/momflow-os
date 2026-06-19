import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BarChart3, Home, Lightbulb, Link2, Mic, PenLine, Settings as SettingsIcon, Sun } from "lucide-react";
import { character, contentTypes, defaultDailyState, getMode, platforms, styles } from "./config";
import { detectCategory, generateLocalContent, statusValues, toPipeline } from "./lib/generator";
import { canInstall, isStandalone, promptInstall, requestReminderPermission, setBadge, showTestReminder } from "./lib/pwa";
import { storage } from "./lib/storage";
import { t } from "./i18n";
import { aiProviderPresets } from "./lib/ai/providers";
import type { AppSettings, DailyState, Idea, Language, PipelineItem, Tab } from "./types";

const defaultSettings: AppSettings = {
  language: "zh-CN",
  aiProvider: "local-template",
  apiKey: "",
  baseUrl: "",
  model: "",
  temperature: 0.7,
  remindersEnabled: false
};

function byNewest<T extends { createdAt: string }>(items: T[]) {
  return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export default function App() {
  const [tab, setTab] = useState<Tab>("home");
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [dailyState, setDailyState] = useState<DailyState>(defaultDailyState);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [pipeline, setPipeline] = useState<PipelineItem[]>([]);
  const [ideaText, setIdeaText] = useState("");
  const [createInput, setCreateInput] = useState("");
  const [platform, setPlatform] = useState(platforms[0]);
  const [contentType, setContentType] = useState(contentTypes[0]);
  const [style, setStyle] = useState(styles[0]);
  const [output, setOutput] = useState("");
  const [installReady, setInstallReady] = useState(false);
  const [listeningTarget, setListeningTarget] = useState<"idea" | "create" | null>(null);

  const language = settings.language;
  const mode = useMemo(() => getMode(dailyState), [dailyState]);
  const isZh = language === "zh-CN";
  const languageToggle = isZh ? "EN" : "ZH";
  const homeTitle = isZh ? "抱抱獭" : "MomFlow";
  const homeSubtitle = isZh ? "给碎片时间创作者的温柔 AI 工作台" : "A gentle AI workspace for fragmented creators";
  const feelingLabel = isZh ? "今天感觉怎么样？" : "How are you feeling today?";
  const energyOptions = isZh
    ? { low: "低电量", medium: "平静专注", high: "适合创作" }
    : { low: "Low Battery", medium: "Calm & Focused", high: "Ready to Create" };
  const environmentOptions = isZh
    ? { busy: "打扰多", normal: "普通", quiet: "安静", focus: "专注空档" }
    : { busy: "Busy", normal: "Normal", quiet: "Quiet", focus: "Focus window" };
  const localizedPlatforms = platforms.map((value) => [value, labelPlatform(value, language)] as [string, string]);
  const localizedContentTypes = contentTypes.map((value) => [value, labelContentType(value, language)] as [string, string]);
  const localizedStyles = styles.map((value) => [value, labelStyle(value, language)] as [string, string]);

  useEffect(() => {
    storage.getIdeas().then((items) => setIdeas(byNewest(items)));
    storage.getPipeline().then((items) => setPipeline(byNewest(items)));
    storage.getSettings().then((saved) => saved && setSettings(saved));
    setInstallReady(canInstall());
    const listener = () => setInstallReady(true);
    window.addEventListener("momflow-install-ready", listener);
    return () => window.removeEventListener("momflow-install-ready", listener);
  }, []);

  useEffect(() => {
    setBadge(pipeline.filter((item) => !item.archived && item.status !== "已发布").length);
  }, [pipeline]);

  async function updateSettings(next: AppSettings) {
    setSettings(next);
    await storage.saveSettings(next);
  }

  async function saveIdea(text = ideaText) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const category = detectCategory(trimmed);
    const idea: Idea = {
      id: crypto.randomUUID(),
      text: trimmed,
      category,
      tags: [category],
      createdAt: new Date().toISOString(),
      favorite: false
    };
    await storage.saveIdea(idea);
    setIdeas((items) => byNewest([idea, ...items]));
    setIdeaText("");
    setCreateInput(trimmed);
    setTab("create");
  }

  function quickAction(action: "tired" | "asleep" | "idea" | "interrupted" | "storyboard") {
    if (action === "tired") {
      setDailyState((state) => ({ ...state, energy: "low", sleep: "poor", time: "5" }));
      setTab("home");
      return;
    }
    if (action === "asleep") {
      setDailyState((state) => ({ ...state, child: "focus", time: "30" }));
      setTab("create");
      return;
    }
    if (action === "idea") {
      setTab("ideas");
      return;
    }
    if (action === "storyboard") {
      setContentType("视频分镜");
      setTab("create");
      return;
    }
    const checkpoint = toPipeline(
      isZh ? "我刚才被打断了" : "I was interrupted",
      t(language, "paused"),
      "MomFlow",
      isZh ? "断点恢复" : "Interruption recovery",
      language
    );
    checkpoint.status = "灵感池";
    checkpoint.interruptionCheckpoint = isZh ? "刚才做到一半，下一步只需要写一句继续。" : "You stopped midway. Next time, continue with one sentence.";
    storage.savePipeline(checkpoint).then(() => setPipeline((items) => byNewest([checkpoint, ...items])));
    setTab("pipeline");
  }

  async function generate() {
    const input = createInput.trim() || ideaText.trim();
    if (!input) return;
    const generated = generateLocalContent(input, labelPlatform(platform, language), contentType, labelStyle(style, language), language);
    setOutput(generated);
  }

  async function saveOutput() {
    const input = createInput.trim() || ideaText.trim();
    if (!input || !output) return;
    const item = toPipeline(input, output, platform, contentType, language);
    await storage.savePipeline(item);
    setPipeline((items) => byNewest([item, ...items]));
    setTab("pipeline");
  }

  async function exportData() {
    const data = await storage.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "momflow-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function clearData() {
    await storage.clearAll();
    setIdeas([]);
    setPipeline([]);
  }

  function startVoiceInput(target: "idea" | "create") {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      window.alert(isZh ? "当前浏览器暂不支持语音输入，可以先用系统键盘里的语音按钮。" : "This browser does not support voice input. Try the microphone on your system keyboard.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setListeningTarget(target);
    recognition.onend = () => setListeningTarget(null);
    recognition.onerror = () => setListeningTarget(null);
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0]?.transcript ?? "")
        .join("")
        .trim();
      if (!transcript) return;
      if (target === "idea") {
        setIdeaText((value) => [value, transcript].filter(Boolean).join(value ? "\n" : ""));
      } else {
        setCreateInput((value) => [value, transcript].filter(Boolean).join(value ? "\n" : ""));
      }
    };
    recognition.start();
  }

  return (
    <div className={`app-shell ${tab === "home" ? "home-shell" : ""}`}>
      {tab !== "home" && (
        <header className="topbar">
          <div>
            <p className="eyebrow">{t(language, "tagline")}</p>
            <h1>{t(language, "appName")}</h1>
          </div>
          <button className="language-pill" onClick={() => updateSettings({ ...settings, language: isZh ? "en-US" : "zh-CN" })}>
            {languageToggle}
          </button>
        </header>
      )}

      <main className="content">
        {tab === "home" && (
          <section className="screen home-screen">
            <section className="home-hero">
              <div className="home-brand-row">
                <div>
                  <h1>{homeTitle}</h1>
                  <p>{homeSubtitle}</p>
                </div>
                <button className="sun-button" aria-label={isZh ? "切换语言" : "Switch language"} onClick={() => updateSettings({ ...settings, language: isZh ? "en-US" : "zh-CN" })}>
                  <Icon name="sun" />
                  <span>{languageToggle}</span>
                </button>
              </div>

              <div className="otto-stage">
                <div className="paper-sun" />
                <div className="leaf-sprig">
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
                <img src="/icons/otto-reference.png" alt={isZh ? "抱抱獭" : "Otto"} />
                <div className="otto-copy">
                  <strong>Otto</strong>
                  <p>{isZh ? "先说一句，我帮你抱住灵感。" : "Say one line. I will hold the idea."}</p>
                </div>
                <div className="paper-birds"><span /><span /><span /></div>
                <div className="paper-hills" />
              </div>
            </section>

            <section className="feeling-card">
              <span>{feelingLabel}</span>
              <label>
                <i />
                <select value={dailyState.energy} onChange={(event) => setDailyState({ ...dailyState, energy: event.target.value as DailyState["energy"] })}>
                  <option value="low">{energyOptions.low}</option>
                  <option value="medium">{energyOptions.medium}</option>
                  <option value="high">{energyOptions.high}</option>
                </select>
              </label>
            </section>

            <div className="quick-grid">
              <ActionButton tone="oat" label={isZh ? "灵感" : "Ideas"} sublabel={t(language, "idea")} icon="bulb" onClick={() => quickAction("idea")} />
              <ActionButton tone="sage" label={isZh ? "创作" : "Create"} sublabel={t(language, "storyboard")} icon="pen" onClick={() => quickAction("storyboard")} />
              <ActionButton tone="pink" label={isZh ? "断点" : "Pause"} sublabel={t(language, "interrupted")} icon="link" onClick={() => quickAction("interrupted")} />
              <ActionButton tone="yellow" label={isZh ? "休息" : "Rest"} sublabel={t(language, "tired")} icon="bars" onClick={() => quickAction("tired")} />
            </div>

            <section className="next-step-card">
              <div className="round-leaf" />
              <div>
                <h3>{t(language, "minimumAction")}</h3>
                <p>{isZh ? mode.action : mode.actionEn}</p>
              </div>
              <button onClick={() => quickAction("idea")} aria-label={isZh ? "去灵感页" : "Go to ideas"}>
                <Icon name="arrow" />
              </button>
            </section>

            <InstallCard language={language} installReady={installReady} />

            <details className="panel mode-panel">
              <summary className="section-heading">
                <h3>{isZh ? mode.name : mode.en}</h3>
                <span>{isZh ? "今日模式" : "Mode"}</span>
              </summary>
              <p className="mode-message">{isZh ? mode.message : mode.messageEn}</p>
              <div className="selectors compact">
                <Select label={isZh ? "睡眠" : "Sleep"} value={dailyState.sleep} onChange={(sleep) => setDailyState({ ...dailyState, sleep })} options={isZh ? [["poor", "差"], ["normal", "一般"], ["good", "好"]] : [["poor", "Poor"], ["normal", "Okay"], ["good", "Good"]]} />
                <Select label={isZh ? "环境" : "Context"} value={dailyState.child} onChange={(child) => setDailyState({ ...dailyState, child })} options={[["busy", environmentOptions.busy], ["normal", environmentOptions.normal], ["quiet", environmentOptions.quiet], ["focus", environmentOptions.focus]]} />
                <Select label={isZh ? "时间" : "Time"} value={dailyState.time} onChange={(time) => setDailyState({ ...dailyState, time })} options={isZh ? [["5", "5 分钟"], ["10", "10 分钟"], ["30", "30 分钟"], ["60", "1 小时+"]] : [["5", "5 min"], ["10", "10 min"], ["30", "30 min"], ["60", "1 hour+"]]} />
              </div>
            </details>

            {ideas.length > 0 && <RecentList title={t(language, "recentIdeas")} items={ideas.map((idea) => idea.text)} empty={t(language, "noItems")} />}
          </section>
        )}

        {tab === "ideas" && (
          <section className="screen">
            <h2>{t(language, "ideas")}</h2>
            <div className="input-panel">
              <VoiceTextarea
                value={ideaText}
                onChange={setIdeaText}
                placeholder={t(language, "ideaPlaceholder")}
                isListening={listeningTarget === "idea"}
                onVoice={() => startVoiceInput("idea")}
                voiceLabel={isZh ? "语音输入" : "Voice input"}
                listeningLabel={isZh ? "正在听..." : "Listening..."}
              />
              <button className="primary" onClick={() => saveIdea()}>{t(language, "saveIdea")}</button>
            </div>
            <div className="list">
              {ideas.length === 0 && <p className="empty">{t(language, "noItems")}</p>}
              {ideas.map((idea) => (
                <article className="item" key={idea.id}>
                  <span>{labelCategory(idea.category, language)}</span>
                  <h3>{idea.text}</h3>
                  <button onClick={() => { setCreateInput(idea.text); setTab("create"); }}>{t(language, "generate")}</button>
                </article>
              ))}
            </div>
          </section>
        )}

        {tab === "create" && (
          <section className="screen">
            <h2>{t(language, "create")}</h2>
            <div className="input-panel">
              <VoiceTextarea
                value={createInput}
                onChange={setCreateInput}
                placeholder={t(language, "promptInput")}
                isListening={listeningTarget === "create"}
                onVoice={() => startVoiceInput("create")}
                voiceLabel={isZh ? "语音输入" : "Voice input"}
                listeningLabel={isZh ? "正在听..." : "Listening..."}
              />
              <div className="form-grid">
                <Select label={t(language, "platform")} value={platform} onChange={setPlatform} options={localizedPlatforms} />
                <Select label={t(language, "contentType")} value={contentType} onChange={setContentType} options={localizedContentTypes} />
                <Select label={t(language, "style")} value={style} onChange={setStyle} options={localizedStyles} />
              </div>
              <p className="hint">{t(language, "localMode")}</p>
              <button className="primary" onClick={generate}>{t(language, "generate")}</button>
            </div>
            {output && (
              <article className="output">
                <pre>{output}</pre>
                <div className="button-row">
                  <button onClick={() => navigator.clipboard?.writeText(output)}>{t(language, "copyAll")}</button>
                  <button className="primary" onClick={saveOutput}>{t(language, "savePipeline")}</button>
                </div>
              </article>
            )}
          </section>
        )}

        {tab === "pipeline" && (
          <section className="screen">
            <h2>{t(language, "pipeline")}</h2>
            <div className="status-row">
              {statusValues.map((status) => (
                <div className="status-chip" key={status}>
                  <strong>{pipeline.filter((item) => item.status === status).length}</strong>
                  <span>{labelStatus(status, language)}</span>
                </div>
              ))}
            </div>
            <div className="list">
              {pipeline.length === 0 && <p className="empty">{t(language, "noItems")}</p>}
              {pipeline.map((item) => (
                <article className="item" key={item.id}>
                  <span>{labelStatus(item.status, language)} / {labelPlatform(item.platform, language)}</span>
                  <h3>{item.title}</h3>
                  <p>{item.nextStep}</p>
                  {item.interruptionCheckpoint && <p className="checkpoint">{item.interruptionCheckpoint}</p>}
                </article>
              ))}
            </div>
          </section>
        )}

        {tab === "settings" && (
          <section className="screen">
            <h2>{t(language, "settings")}</h2>
            <section className="panel">
              <h3>{isZh ? "角色形象" : "Character"}</h3>
              <p><strong>{isZh ? character.name.zh : character.name.en}</strong></p>
              <p>{isZh ? character.description : "A gentle, focused otter who helps creators hold ideas, save checkpoints, and rest without guilt."}</p>
            </section>
            <section className="panel">
              <h3>{isZh ? "AI 生成设置" : "AI settings"}</h3>
              <label className="field">
                <span>{isZh ? "供应商预设" : "Provider preset"}</span>
                <select
                  value={settings.aiProvider}
                  onChange={(event) => {
                    const preset = aiProviderPresets.find((item) => item.id === event.target.value);
                    updateSettings({
                      ...settings,
                      aiProvider: event.target.value,
                      baseUrl: preset?.baseUrl ?? settings.baseUrl,
                      model: preset?.model ?? settings.model
                    });
                  }}
                >
                  {aiProviderPresets.map((provider) => (
                    <option key={provider.id} value={provider.id}>
                      {provider.mainlandReady ? (isZh ? "大陆可用 - " : "Mainland-ready - ") : ""}{isZh ? provider.labelZh : provider.labelEn}
                    </option>
                  ))}
                </select>
              </label>
              <input value={settings.model} onChange={(event) => updateSettings({ ...settings, model: event.target.value })} placeholder={isZh ? "模型名称" : "Model name"} />
              <input value={settings.baseUrl} onChange={(event) => updateSettings({ ...settings, baseUrl: event.target.value })} placeholder={isZh ? "自定义接口地址" : "Custom endpoint"} />
              <input value={settings.apiKey} onChange={(event) => updateSettings({ ...settings, apiKey: event.target.value })} placeholder={isZh ? "API Key 仅保存在本机" : "API Key stays local"} type="password" />
              <p className="hint">{t(language, "localMode")}</p>
              <p className="hint">{isZh ? "大陆用户建议优先选择 DeepSeek、阿里云百炼、智谱、火山方舟或百度千帆。正式上线时建议通过后端代理调用，避免 API Key 暴露在浏览器里。" : "For mainland China users, prefer DeepSeek, DashScope, Zhipu GLM, Volcengine Ark, or Baidu Qianfan. Use a backend proxy in production to protect API keys."}</p>
            </section>
            <section className="panel">
              <h3>{isZh ? "桌面提醒" : "Desktop reminders"}</h3>
              <div className="button-row">
                <button onClick={async () => {
                  const permission = await requestReminderPermission();
                  updateSettings({ ...settings, remindersEnabled: permission === "granted" });
                }}>{t(language, "enableReminder")}</button>
                <button onClick={showTestReminder}>{t(language, "testReminder")}</button>
              </div>
              <p className="hint">{isZh ? "PWA 能做桌面图标、角标、通知和长按快捷入口；真正桌面宠物需要后续原生 App 或小组件。" : "A PWA can provide a home-screen icon, badges, notifications, and long-press shortcuts. A true desktop pet would require a native app or widget."}</p>
            </section>
            <section className="panel">
              <h3>{isZh ? "数据" : "Data"}</h3>
              <div className="button-row">
                <button onClick={exportData}>{t(language, "exportData")}</button>
                <button onClick={clearData}>{t(language, "clearData")}</button>
              </div>
            </section>
          </section>
        )}
      </main>

      <nav className="bottom-nav">
        {(["home", "ideas", "create", "pipeline", "settings"] as Tab[]).map((item) => (
          <button className={tab === item ? "active" : ""} key={item} onClick={() => setTab(item)}>
            <Icon name={item === "home" ? "home" : item === "ideas" ? "bulb" : item === "create" ? "pen" : item === "pipeline" ? "link" : "gear"} />
            <span>{t(language, item)}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function InstallCard({ language, installReady }: { language: Language; installReady: boolean }) {
  const [hidden, setHidden] = useState(isStandalone());
  if (hidden) return null;
  return (
    <section className="install-card">
      <div>
        <h3>{t(language, "installTitle")}</h3>
        <p>{t(language, "installBody")}</p>
        <small>{t(language, "iosInstall")} {t(language, "androidInstall")}</small>
      </div>
      <button onClick={async () => {
        const result = await promptInstall();
        if (result === "accepted") setHidden(true);
      }}>{installReady ? t(language, "installButton") : t(language, "installFallback")}</button>
    </section>
  );
}

function Select<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (value: T) => void; options: [T, string][] }) {
  return (
    <label className="selector">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value as T)}>
        {options.map(([key, text]) => <option value={key} key={key}>{text}</option>)}
      </select>
    </label>
  );
}

function VoiceTextarea({
  value,
  onChange,
  placeholder,
  isListening,
  onVoice,
  voiceLabel,
  listeningLabel
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  isListening: boolean;
  onVoice: () => void;
  voiceLabel: string;
  listeningLabel: string;
}) {
  return (
    <div className="voice-input">
      <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
      <button className={isListening ? "listening" : ""} type="button" onClick={onVoice}>
        <Mic />
        <span>{isListening ? listeningLabel : voiceLabel}</span>
      </button>
    </div>
  );
}

function ActionButton({ label, sublabel, icon, tone, onClick }: { label: string; sublabel: string; icon: IconName; tone: string; onClick: () => void }) {
  return (
    <button className={`action-button ${tone}`} onClick={onClick}>
      <Icon name={icon} />
      <strong>{label}</strong>
      <small>{sublabel}</small>
    </button>
  );
}

function RecentList({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <section className="panel">
      <h3>{title}</h3>
      {items.length === 0 ? <p className="empty">{empty}</p> : items.slice(0, 3).map((item) => <p className="recent" key={item}>{item}</p>)}
    </section>
  );
}

function labelPlatform(value: string, language: Language) {
  if (language === "zh-CN") return value;
  const labels: Record<string, string> = {
    "小红书": "Xiaohongshu",
    "视频号": "WeChat Channels",
    "公众号": "WeChat Official Account",
    "朋友圈": "WeChat Moments",
    "X / Twitter": "X / Twitter",
    "TikTok": "TikTok",
    "YouTube Shorts": "YouTube Shorts"
  };
  return labels[value] ?? value;
}

function labelContentType(value: string, language: Language) {
  if (language === "zh-CN") return value;
  const labels: Record<string, string> = {
    "图文": "Image post",
    "口播": "Talking script",
    "视频脚本": "Video script",
    "视频分镜": "Storyboard",
    "公众号文章": "Long article",
    "朋友圈文案": "Moments copy",
    "多平台改写": "Multi-platform rewrite",
    "断点恢复": "Checkpoint"
  };
  return labels[value] ?? value;
}

function labelStyle(value: string, language: Language) {
  if (language === "zh-CN") return value;
  const labels: Record<string, string> = {
    "温柔治愈": "Gentle healing",
    "专业理性": "Clear and professional",
    "生活化": "Everyday life",
    "情绪共鸣": "Emotional resonance",
    "干货教学": "Practical teaching",
    "个人 IP": "Personal brand"
  };
  return labels[value] ?? value;
}

function labelStatus(value: string, language: Language) {
  if (language === "zh-CN") return value;
  const labels: Record<string, string> = {
    "灵感池": "Ideas",
    "草稿池": "Drafts",
    "分镜池": "Storyboards",
    "待发布": "To publish",
    "已发布": "Published",
    "断点恢复": "Checkpoint"
  };
  return labels[value] ?? value;
}

function labelCategory(value: string, language: Language) {
  if (language === "zh-CN") return value;
  const labels: Record<string, string> = {
    "育儿生活": "Family life",
    "情绪共鸣": "Emotional resonance",
    "视频脚本": "Video script",
    "产品种草": "Product recommendation",
    "个人反思": "Personal reflection"
  };
  return labels[value] ?? value;
}

type IconName = "home" | "bulb" | "pen" | "link" | "bars" | "gear" | "sun" | "arrow";

function Icon({ name }: { name: IconName }) {
  if (name === "home") return <Home />;
  if (name === "bulb") return <Lightbulb />;
  if (name === "pen") return <PenLine />;
  if (name === "link") return <Link2 />;
  if (name === "bars") return <BarChart3 />;
  if (name === "gear") return <SettingsIcon />;
  if (name === "sun") return <Sun />;
  return <ArrowRight />;
}
