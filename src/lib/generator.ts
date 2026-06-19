import type { Language, PipelineItem } from "../types";

const now = () => new Date().toISOString();

export const statusValues = ["灵感池", "草稿池", "分镜池", "待发布", "已发布"] as const;

export function detectCategory(text: string) {
  if (/孩子|妈妈|育儿|亲子|家庭/.test(text)) return "育儿生活";
  if (/累|焦虑|情绪|压力|内耗|打断/.test(text)) return "情绪共鸣";
  if (/视频|分镜|口播|脚本/.test(text)) return "视频脚本";
  if (/产品|种草|好物|工具/.test(text)) return "产品种草";
  return "个人反思";
}

export function generateLocalContent(input: string, platform: string, contentType: string, style: string, language: Language) {
  const isEn = language === "en-US";
  if (contentType === "视频分镜") {
    return isEn
      ? `Video title: A tiny honest moment
Positioning: gentle creator reflection
Opening 3 seconds: "Maybe you are not lazy. Maybe your time keeps breaking."

Storyboard:
1. 0-3s | quiet desk | hook line | soft piano | close shot
2. 3-8s | interrupted notes | "I tried to start again three times" | handwritten caption | cut on movement
3. 8-15s | Otto holding a bookmark | "Paused is not failed" | warm caption | slow push-in
4. 15-24s | phone note saved | "Save the next step, not the whole plan" | light tap sound | screen insert
5. 24-30s | lamp turns off | "Come back from here tomorrow" | gentle ending | fade out`
      : `视频标题：不是你效率低，是时间一直被打断
视频定位：温柔但有记忆点的碎片创作表达
开头 3 秒：不是你不努力，是你的时间从来不完整。

分镜表：
1. 0-3 秒｜桌面上一张没写完的便签｜不是你效率低｜轻钢琴｜近景切入
2. 3-8 秒｜手机弹出生活打断｜你只是一直被迫重启｜轻提示音｜快切
3. 8-15 秒｜抱抱獭拿书签夹住纸页｜暂停不代表失败｜暖色字幕｜慢推
4. 15-24 秒｜把下一步写成一句话｜下次从这里继续｜纸笔声｜俯拍
5. 24-30 秒｜小台灯亮起又慢慢关掉｜今天先到这里，也很好｜渐弱音乐｜淡出`;
  }

  if (contentType === "多平台改写") {
    return isEn
      ? `Original idea: ${input}

Xiaohongshu version:
Title: You are not inefficient. Your time keeps getting cut into pieces.
Body: Do not force a complete output today. Save one real moment first. That moment is already a seed.
Tags: #FragmentedTime #CreatorLife #GentleProductivity

Moments version:
Today I realized I am not slow. My day just arrives in small pieces. Keeping one idea alive already counts.

X / Twitter:
You are not inefficient. Your time has never arrived in one piece. Save the next small step, not the whole perfect plan.

Short video script:
If you kept getting interrupted today, do not blame yourself. Save the idea, write one next step, and come back from there. Creation can pause without starting over.`
      : `原始灵感：${input}

小红书版：
标题：不是你效率低，是你的时间一直被切碎
正文：今天先不用逼自己完整输出。把一个真实瞬间保存下来，它已经是内容的种子。
标签：#碎片时间 #创作者日常 #温柔效率

朋友圈版：
今天发现，很多时候不是我做得慢，而是一天被切成了很多小块。能把一个想法留下来，已经算没有断线。

X / Twitter：
You are not inefficient. Your time has never arrived in one piece. Save the next small step, not the whole perfect plan.

短视频口播：
如果你今天一直被打断，不要急着责备自己。先把灵感保存下来，再写一句下一步。创作可以暂停，但不用归零。`;
  }

  return isEn
    ? `Platform: ${platform}
Style: ${style}

5 title options:
1. You are not inefficient. Your time is fragmented.
2. The hardest part of creating is being interrupted over and over.
3. One tiny step today still keeps the thread alive.
4. How to turn messy life moments into content ideas.
5. When you are tired, save the idea first. Do not push for output.

3 cover copy options:
- I am not slow. My time is fragmented.
- Hold one idea first.
- Interrupted does not mean done.

Post structure:
1. Emotional opening: name the tiredness and interruptions.
2. Reframe: this is not low efficiency, it is fragmented time.
3. Minimum action: save one sentence.
4. Return point: write the next step.
5. Gentle close: staying connected is enough today.

Body copy:
${input}

If this feels familiar, do not ask yourself to finish a whole piece right now. Save this sentence, give it a title, and write the next smallest step. Fragmented time can still create, but it needs a system that does not blame you.

Comment prompt:
What is one idea you want to hold onto today?`
    : `平台：${platform}
风格：${style}

爆款标题 5 个：
1. 不是你效率低，是你的时间从来不完整
2. 创作者最难的不是忙，是一直被打断
3. 今天只做一小步，也算没有断线
4. 把生活琐碎变成内容灵感的方法
5. 疲惫时，先保存灵感，不要逼自己高产

封面文案 3 组：
- 不是我慢，是时间太碎
- 今天先抱住一个灵感
- 被打断，也可以继续

图文页结构：
1. 情绪开场：承认疲惫和打断
2. 重新解释：不是低效，是时间不完整
3. 最小动作：保存一句灵感
4. 下次继续：写下下一步
5. 温柔收尾：今天不断线就很好

正文文案：
${input}

如果你也有这种感觉，先不要急着要求自己完成一整篇内容。把这句话留下来，给它一个标题，再写一个最小下一步。碎片时间不是不能创作，只是需要一个不会责备你的系统。

评论区引导：
你今天最想先抱住的一个灵感是什么？`;
}

export function toPipeline(input: string, output: string, platform: string, contentType: string, language: Language): PipelineItem {
  const isStoryboard = contentType === "视频分镜";
  return {
    id: crypto.randomUUID(),
    title: input.slice(0, 24) || (language === "zh-CN" ? "未命名灵感" : "Untitled idea"),
    originalIdea: input,
    platform,
    contentType,
    status: isStoryboard ? "分镜池" : "草稿池",
    energyLevel: "medium",
    timeNeeded: isStoryboard ? "30" : "10",
    tags: [detectCategory(input), platform],
    createdAt: now(),
    updatedAt: now(),
    nextStep: language === "zh-CN"
      ? (isStoryboard ? "按镜头补充素材" : "挑一个标题继续写")
      : (isStoryboard ? "Add material for each shot" : "Pick one title and keep writing"),
    generatedOutputs: output,
    language,
    favorite: false,
    archived: false
  };
}
