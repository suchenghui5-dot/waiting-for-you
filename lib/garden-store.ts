/**
 * 客户端生长数据存储（临时）
 * 后续对接 Supabase 后迁移到数据库
 */

import { calculateGardenStage } from './garden-stage';

const STORAGE_KEY = 'waiting-for-you-garden';

export interface GardenData {
  growthMinutes: number;
  lastActiveDate: string | null;   // YYYY-MM-DD
  activeDays: number;
  answeredQuestions: number[];     // 已答题的 question_id
  lastHeartbeat: number | null;    // timestamp
  todaySeconds: number;            // 今日已累计秒数
  dailyCap: number;                // 每日上限（秒）, 默认 14400 (4h)
  name: string;
}

function defaultGarden(): GardenData {
  return {
    growthMinutes: 0,
    lastActiveDate: null,
    activeDays: 0,
    answeredQuestions: [],
    lastHeartbeat: null,
    todaySeconds: 0,
    dailyCap: 14400,
    name: '',
  };
}

export function loadGarden(): GardenData {
  if (typeof window === 'undefined') return defaultGarden();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultGarden();
    const data = JSON.parse(raw) as GardenData;

    // 跨日检查：如果最后活跃日期不是今天，重置 todaySeconds
    const today = new Date().toISOString().slice(0, 10);
    if (data.lastActiveDate !== today) {
      data.todaySeconds = 0;
      data.lastActiveDate = today;
    }

    return data;
  } catch {
    return defaultGarden();
  }
}

export function saveGarden(data: GardenData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/** 累计生长分钟数 */
export function addGrowthTime(data: GardenData, seconds: number): GardenData {
  const minutes = seconds / 60;
  const today = new Date().toISOString().slice(0, 10);

  const updated = { ...data };

  // 跨日处理
  if (data.lastActiveDate !== today) {
    updated.activeDays += 1;
    updated.lastActiveDate = today;
    updated.todaySeconds = 0;
  }

  updated.growthMinutes = Math.round((data.growthMinutes + minutes) * 100) / 100;
  updated.todaySeconds += seconds;
  updated.lastHeartbeat = Date.now();

  saveGarden(updated);
  return updated;
}

/** 答题获得生长时间（每题 15 分钟） */
export function earnFromAnswer(data: GardenData, questionId: number): GardenData {
  if (data.answeredQuestions.includes(questionId)) return data;

  const updated = {
    ...data,
    growthMinutes: data.growthMinutes + 15,
    answeredQuestions: [...data.answeredQuestions, questionId],
  };

  // 同时计入活跃日
  const today = new Date().toISOString().slice(0, 10);
  if (updated.lastActiveDate !== today) {
    updated.activeDays += 1;
    updated.lastActiveDate = today;
  }

  saveGarden(updated);
  return updated;
}

/** 获取花园展示状态 */
export function getGardenDisplay(data: GardenData) {
  return calculateGardenStage(data.growthMinutes, data.activeDays);
}

/** 初始化（设置名字） */
export function initGarden(name: string): GardenData {
  const today = new Date().toISOString().slice(0, 10);
  const data: GardenData = {
    ...defaultGarden(),
    name,
    lastActiveDate: today,
    activeDays: 1,
  };
  saveGarden(data);
  return data;
}
