export const aiProviderPresets = [
  {
    id: "local-template",
    labelZh: "本地模板",
    labelEn: "Local template",
    baseUrl: "",
    model: "",
    mainlandReady: true
  },
  {
    id: "deepseek",
    labelZh: "DeepSeek",
    labelEn: "DeepSeek",
    baseUrl: "https://api.deepseek.com",
    model: "deepseek-chat",
    mainlandReady: true
  },
  {
    id: "dashscope",
    labelZh: "阿里云百炼 / 通义千问",
    labelEn: "DashScope / Qwen",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    model: "qwen-plus",
    mainlandReady: true
  },
  {
    id: "bigmodel",
    labelZh: "智谱 GLM",
    labelEn: "Zhipu GLM",
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    model: "glm-4-flash",
    mainlandReady: true
  },
  {
    id: "volcengine-ark",
    labelZh: "火山方舟 / 豆包",
    labelEn: "Volcengine Ark / Doubao",
    baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
    model: "doubao-seed-1-6",
    mainlandReady: true
  },
  {
    id: "baidu-qianfan",
    labelZh: "百度千帆 / 文心",
    labelEn: "Baidu Qianfan / ERNIE",
    baseUrl: "",
    model: "",
    mainlandReady: true
  },
  {
    id: "openai-compatible",
    labelZh: "自定义 OpenAI 兼容接口",
    labelEn: "Custom OpenAI-compatible endpoint",
    baseUrl: "",
    model: "",
    mainlandReady: false
  },
  {
    id: "openai",
    labelZh: "OpenAI",
    labelEn: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4.1-mini",
    mainlandReady: false
  }
];

export const aiProviders = aiProviderPresets.map((provider) => provider.id);
