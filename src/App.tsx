import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BarChart3, Home, Lightbulb, Link2, Mic, PenLine, Settings as SettingsIcon, Sun } from "lucide-react";
import { character, contentTypes, defaultDailyState, getMode, platforms, styles } from "./config";
import { detectCategory, generateLocalContent, statusValues, toPipeline } from "./lib/generator";
import { canInstall, isStandalone, promptInstall, requestReminderPermission, setBadge, showTestReminder } from "./lib/pwa";
import { storage } from "./lib/storage";
import { t } from "./i18n";
import { aiProviderPresets } from "./lib/ai/providers";
import { generateWithAi } from "./lib/ai/adapter";
import type { AppSettings, DailyState, Idea, Language, PipelineItem, Tab } from "./types";

const defaultSettings: AppSettings = {
  language: "zh-CN",
  aiProvider: "deepseek",
  apiKey: "",
  baseUrl: "https://api.deepseek.com",
  model: "deepseek-chat",
  temperature: 0.7,
  remindersEnabled: false
};

function byNewest<T extends { createdAt: string }>(items: T[]) {
  return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function normalizeSettings(settings: AppSettings): AppSettings {
  if (settings.aiProvider === "local-template") {
    return {
      ...settings,
      aiProvider: "deepseek",
      baseUrl: settings.baseUrl || "https://api.deepseek.com",
      model: settings.model || "deepseek-chat"
    };
  }
  return settings;
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
  const [generationStatus, setGenerationStatus] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [voiceMessages, setVoiceMessages] = useState({ idea: "", create: "" });
  const [reminderStatus, setReminderStatus] = useState("");
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
    storage.getSettings().then((saved) => saved && setSettings(normalizeSettings(saved)));
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
    setIsGenerating(true);
    setGenerationStatus(isZh ? "正在生成..." : "Generating...");
    setOutput("");
    try {
      const prompt = buildGenerationPrompt({
        input,
        platform: labelPlatform(platform, language),
        contentType: labelContentType(contentType, language),
        style: labelStyle(style, language),
        language
      });
      const result = await generateWithAi({
        provider: settings.aiProvider,
        apiKey: settings.apiKey,
        baseUrl: settings.baseUrl,
        model: settings.model,
        temperature: settings.temperature,
        proxyUrl: import.meta.env.VITE_MOMFLOW_AI_PROXY_URL,
        prompt
      });
      if (result.mode === "ai") {
        setOutput(result.text);
        setGenerationStatus(isZh ? "已连接 DeepSeek / AI 生成。" : "Generated with DeepSeek / online AI.");
      } else {
        setGenerationStatus(
          isZh
            ? "DeepSeek 还没有真正连接。公开网页不能直接内置 API Key，需要配置后端代理，或在“我的”里填写自己的 DeepSeek API Key。"
            : "DeepSeek is not connected yet. A public static site cannot safely include an API key. Configure a backend proxy or add your own DeepSeek API key in Settings."
        );
      }
    } catch (error) {
      setGenerationStatus(
        isZh
          ? "DeepSeek 调用失败。常见原因是没有后端代理、API Key 错误、模型名错误，或浏览器被 CORS 拦截。"
          : "DeepSeek call failed. Common causes: missing backend proxy, wrong API key, wrong model name, or browser CORS restrictions."
      );
    } finally {
      setIsGenerating(false);
    }
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

  async function enableReminders() {
    const permission = await requestReminderPermission();
    const enabled = permission === "granted";
    await updateSettings({ ...settings, remindersEnabled: enabled });

    if (permission === "unsupported") {
      setReminderStatus(isZh ? "当前浏览器不支持桌面通知。手机端建议先添加到桌面后再试。" : "This browser does not support notifications. On mobile, add the app to your home screen first.");
      return;
    }
    if (permission === "denied") {
      setReminderStatus(isZh ? "通知权限被拒绝了。请到浏览器/系统设置里允许此网站通知。" : "Notification permission was denied. Allow notifications for this site in browser or system settings.");
      return;
    }
    if (permission !== "granted") {
      setReminderStatus(isZh ? "还没有获得通知权限。请在弹窗里选择允许。" : "Notification permission was not granted yet. Choose Allow in the browser prompt.");
      return;
    }

    const result = await showTestReminder({
      title: isZh ? "抱抱獭提醒已开启" : "MomFlow reminders are on",
      body: isZh ? "以后可以用通知把断点和下一步带回来。" : "Notifications can bring you back to your next tiny step."
    });
    setReminderStatus(
      result.ok
        ? (isZh ? "提醒已开启，并已发送一条测试通知。" : "Reminders are enabled. A test notification was sent.")
        : (isZh ? "权限已开启，但测试通知没有发出。手机端请确认已添加到桌面。" : "Permission is enabled, but the test notification did not show. On mobile, make sure the app is added to your home screen.")
    );
  }

  async function testReminder() {
    const result = await showTestReminder({
      title: isZh ? "抱抱獭帮你夹住这里了" : "MomFlow saved your place",
      body: isZh ? "不用重新开始，下次从这个断点继续就好。" : "No need to restart. Continue from this checkpoint next time."
    });
    if (result.ok) {
      setReminderStatus(isZh ? "测试提醒已发送。" : "Test reminder sent.");
      return;
    }
    if (result.reason === "unsupported") {
      setReminderStatus(isZh ? "当前浏览器不支持通知。请尝试 Chrome/Safari，并先添加到桌面。" : "This browser does not support notifications. Try Chrome/Safari and add it to the home screen first.");
      return;
    }
    if (result.reason === "denied") {
      setReminderStatus(isZh ? "通知权限被拒绝。请到浏览器/系统设置里重新允许。" : "Notifications are blocked. Re-enable them in browser or system settings.");
      return;
    }
    setReminderStatus(isZh ? "还没有开启通知权限，请先点“开启提醒”。" : "Notification permission is not enabled. Tap Enable reminders first.");
  }

  function startVoiceInput(target: "idea" | "create") {
    const setVoiceMessage = (message: string) => setVoiceMessages((current) => ({ ...current, [target]: message }));
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceMessage(isZh ? "当前浏览器不支持网页语音识别。可以点输入框后使用手机键盘自带的麦克风，或直接手动输入。" : "This browser does not support web speech recognition. Use your keyboard microphone or type manually.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => {
      setVoiceMessage(isZh ? "正在听，请说出你的灵感..." : "Listening. Say your idea...");
      setListeningTarget(target);
    };
    recognition.onend = () => setListeningTarget(null);
    recognition.onerror = () => {
      setListeningTarget(null);
      setVoiceMessage(isZh ? "这次没有识别成功。可以再试一次，或用手机键盘麦克风/手动输入继续。" : "Speech was not recognized. Try again, use your keyboard microphone, or type manually.");
    };
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0]?.transcript ?? "")
        .join("")
        .trim();
      if (!transcript) {
        setVoiceMessage(isZh ? "没有听到内容，可以再试一次。" : "No speech was captured. Try again.");
        return;
      }
      if (target === "idea") {
        setIdeaText((value) => [value, transcript].filter(Boolean).join(value ? "\n" : ""));
      } else {
        setCreateInput((value) => [value, transcript].filter(Boolean).join(value ? "\n" : ""));
      }
      setVoiceMessage(isZh ? "已识别并填入输入框。" : "Recognized and added to the input.");
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
                <img src={`${import.meta.env.BASE_URL}icons/otto-reference.png`} alt={isZh ? "抱抱獭" : "Otto"} />
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
                message={voiceMessages.idea}
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
                message={voiceMessages.create}
              />
              <div className="form-grid">
                <Select label={t(language, "platform")} value={platform} onChange={setPlatform} options={localizedPlatforms} />
                <Select label={t(language, "contentType")} value={contentType} onChange={setContentType} options={localizedContentTypes} />
                <Select label={t(language, "style")} value={style} onChange={setStyle} options={localizedStyles} />
              </div>
              <p className="hint">{isZh ? "默认使用 DeepSeek。若未配置安全代理或 API Key，系统会提示未连接，不再假装联网生成。" : "DeepSeek is the default provider. If no secure proxy or API key is configured, MomFlow will show a connection warning instead of fake generation."}</p>
              {generationStatus && <p className="hint">{generationStatus}</p>}
              <button className="primary" onClick={generate} disabled={isGenerating}>{isGenerating ? (isZh ? "生成中..." : "Generating...") : t(language, "generate")}</button>
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
              <p className="hint">{isZh ? "默认连接 DeepSeek。公开网页要让所有用户免配置使用，需要先部署后端代理保护 API Key。" : "DeepSeek is the default provider. To make it work for every visitor without setup, deploy a backend proxy to protect the API key first."}</p>
              <p className="hint">{isZh ? "大陆用户建议优先选择 DeepSeek、阿里云百炼、智谱、火山方舟或百度千帆。正式上线时建议通过后端代理调用，避免 API Key 暴露在浏览器里。" : "For mainland China users, prefer DeepSeek, DashScope, Zhipu GLM, Volcengine Ark, or Baidu Qianfan. Use a backend proxy in production to protect API keys."}</p>
            </section>
            <section className="panel">
              <h3>{isZh ? "桌面提醒" : "Desktop reminders"}</h3>
              <div className="button-row">
                <button onClick={enableReminders}>{t(language, "enableReminder")}</button>
                <button onClick={testReminder}>{t(language, "testReminder")}</button>
              </div>
              {reminderStatus && <p className="status-note">{reminderStatus}</p>}
              <p className="hint">{isZh ? "通知需要浏览器和系统允许。手机端建议先添加到桌面，再开启提醒；真正定时推送需要后端 Web Push。" : "Notifications require browser and system permission. On mobile, add the app to the home screen first. Scheduled push reminders require backend Web Push."}</p>
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
  const [showSteps, setShowSteps] = useState(false);
  const isZh = language === "zh-CN";
  if (hidden) return null;
  return (
    <section className="install-card">
      <div>
        <h3>{t(language, "installTitle")}</h3>
        <p>{t(language, "installBody")}</p>
        <small>{isZh ? "浏览器不会允许网页自动添加到桌面，需要你手动确认一次。" : "Browsers require users to confirm before adding a website to the home screen."}</small>
      </div>
      <button onClick={async () => {
        if (!installReady) {
          setShowSteps((value) => !value);
          return;
        }
        const result = await promptInstall();
        if (result === "accepted") {
          setHidden(true);
          return;
        }
        setShowSteps(true);
      }}>{installReady ? t(language, "installButton") : (isZh ? "查看安装步骤" : "View install steps")}</button>
      {showSteps && (
        <ol className="install-steps">
          <li>{isZh ? "iPhone：请用 Safari 打开网页，点底部分享按钮。" : "iPhone: open this page in Safari and tap the Share button."}</li>
          <li>{isZh ? "选择“添加到主屏幕”，再点“添加”。" : "Choose Add to Home Screen, then tap Add."}</li>
          <li>{isZh ? "Android：请用 Chrome 打开网页，点右上角菜单。" : "Android: open this page in Chrome and tap the menu."}</li>
          <li>{isZh ? "选择“安装应用”或“添加到主屏幕”。" : "Choose Install app or Add to Home screen."}</li>
        </ol>
      )}
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
  listeningLabel,
  message
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  isListening: boolean;
  onVoice: () => void;
  voiceLabel: string;
  listeningLabel: string;
  message?: string;
}) {
  return (
    <div className="voice-input">
      <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
      <button className={isListening ? "listening" : ""} type="button" onClick={onVoice}>
        <Mic />
        <span>{isListening ? listeningLabel : voiceLabel}</span>
      </button>
      {message && <p className="voice-message">{message}</p>}
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

function buildGenerationPrompt({
  input,
  platform,
  contentType,
  style,
  language
}: {
  input: string;
  platform: string;
  contentType: string;
  style: string;
  language: Language;
}) {
  if (language === "zh-CN") {
    return `请根据下面的真实灵感生成一份新内容，不要套固定模板。

灵感：${input}
平台：${platform}
内容类型：${contentType}
风格：${style}

要求：
1. 内容必须紧扣用户输入的灵感，不能泛泛而谈。
2. 给出标题、开头、正文/脚本结构、发布建议。
3. 如果是视频分镜，请按镜头列出时间、画面、字幕、声音和转场。
4. 语气温柔、实用、有一点陪伴感。`;
  }

  return `Create fresh content from this exact idea. Do not reuse a fixed template.

Idea: ${input}
Platform: ${platform}
Content type: ${contentType}
Style: ${style}

Requirements:
1. Stay specific to the user's idea.
2. Include title options, opening hook, body/script structure, and publishing advice.
3. If it is a storyboard, list time, shot, caption, sound, and transition.
4. Keep the tone warm, practical, and gently supportive.`;
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
