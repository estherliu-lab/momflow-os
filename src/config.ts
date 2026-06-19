import type { DailyState } from "./types";

export const character = {
  name: { zh: "抱抱獭", en: "Otto" },
  avatar: "/icons/otto-reference.png",
  description: "一只温柔、认真、会整理灵感的小水獭。",
  scenes: [
    { key: "idea", prop: "小星星", line: "先抱住，不展开。" },
    { key: "interrupted", prop: "书签", line: "我帮你夹住这里，下次从这继续。" },
    { key: "tired", prop: "小毯子", line: "今天不冲刺，先保住自己。" },
    { key: "asleep", prop: "小台灯", line: "现在只做一个最小闭环。" },
    { key: "creating", prop: "便签", line: "正在把灵感变成内容。" },
    { key: "rest", prop: "关灯", line: "今天够了，明天再继续。" }
  ]
};

export const platforms = ["小红书", "视频号", "公众号", "朋友圈", "X / Twitter", "TikTok", "YouTube Shorts"];
export const contentTypes = ["图文", "口播", "视频脚本", "视频分镜", "公众号文章", "朋友圈文案", "多平台改写"];
export const styles = ["温柔治愈", "专业理性", "生活化", "情绪共鸣", "干货教学", "个人 IP"];

export const defaultDailyState: DailyState = {
  energy: "medium",
  sleep: "normal",
  child: "normal",
  time: "10",
  pressure: "medium"
};

export function getMode(state: DailyState) {
  if (state.energy === "low" || state.sleep === "poor" || state.child === "busy") {
    return {
      name: "低电量模式",
      en: "Low Battery Mode",
      message: "今天不冲刺。只做一个能让账号不断线的小动作。",
      messageEn: "No pushing today. Just keep one tiny thread alive.",
      action: "保存一个灵感，或写一个标题。",
      actionEn: "Save one idea, or write one title."
    };
  }
  if (state.time === "5" || state.time === "10") {
    return {
      name: "轻产出模式",
      en: "Light Creation Mode",
      message: "今天适合做一点点，但不适合透支。",
      messageEn: "A little progress is enough today.",
      action: "生成一个封面句，或整理一条草稿。",
      actionEn: "Create one cover line, or tidy one draft."
    };
  }
  if (state.time === "30") {
    return {
      name: "正常推进模式",
      en: "Steady Flow Mode",
      message: "今天可以完成一个内容小闭环。",
      messageEn: "Today is good for one complete content loop.",
      action: "完成一篇图文方案，或生成一版视频分镜。",
      actionEn: "Finish one post plan, or create one storyboard."
    };
  }
  return {
    name: "深度创作模式",
    en: "Deep Creation Mode",
    message: "状态不错，但不要把明天的力气也用掉。",
    messageEn: "You have energy today. Do not spend tomorrow's energy too.",
    action: "批量生成选题，但设定强制收工提醒。",
    actionEn: "Batch ideas, but set a stop point."
  };
}
