/**
 * 客户端生长数据存储（临时）
 * 后续对接 Supabase 后迁移到数据库
 */

import { calculateGardenStage } from './garden-stage';

const STORAGE_KEY = 'waiting-for-you-garden';

export interface TestProgress {
  section: 'big-five' | 'ecrr' | 'raven';
  qIndex: number;
  answers: {
    bigFive: Record<number, number>;
    ecrr: Record<number, number>;
    raven: Record<number, number>;
  };
}

export interface GardenData {
  growthMinutes: number;
  lastActiveDate: string | null;   // YYYY-MM-DD
  activeDays: number;
  answeredQuestions: number[];     // 已答题的 question_id
  lastHeartbeat: number | null;    // timestamp
  todaySeconds: number;            // 今日已累计秒数
  dailyCap: number;                // 每日上限（秒）, 默认 14400 (4h)
  sessionStart: number | null;     // 本次会话开始时间戳（C3 防连续挂机）
  name: string;
  userId: string;                  // 匹配系统用户 ID
  phone: string;                   // 手机号，用于登录查找
  testProgress: TestProgress | null; // 测评进度（可暂停恢复）
  testCompleted: boolean;           // 是否完成过测评
  photoDataUrl: string | null;      // 照片 base64
  photoPromise: boolean;            // 是否勾选真实承诺
  hasBadge: boolean;                // 是否获得徽章
  badges: { type: string; label: string; earnedAt: string }[];
  currentMatch: MatchData | null;
  matchHistory: MatchData[];
}

export interface MatchData {
  id: string;
  matchedUserId: string;
  matchedUserName: string;
  matchWeek: string;
  curatorNote: string;
  icebreaker: string;
  status: 'pending' | 'accepted' | 'skipped' | 'mutual';
  decidedAt: string | null;
  chatOpen: boolean;
  chatExpiresAt: string | null;
  createdAt: string;
  matchedPhoto: string | null;
  matchedBadges: { type: string; label: string }[];
  matchedCity: string;
  matchedBio: string;
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
    sessionStart: null,
    name: '',
    userId: '',
    phone: '',
    testProgress: null,
    testCompleted: false,
    photoDataUrl: null,
    photoPromise: false,
    hasBadge: false,
    badges: [],
    currentMatch: null,
    matchHistory: [],
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
  // 同时持久化到用户集合，跨会话保留
  if (data.userId) {
    localStorage.setItem(USER_COLLECTION_PREFIX + data.userId, JSON.stringify(data));
  }
}

// ─── 用户会话管理（测试模式：localStorage 多用户） ───

const USER_COLLECTION_PREFIX = 'waiting-for-you-garden-user-';
const PHONE_MAP_KEY = 'waiting-for-you-phone-map';

/** 注册新用户 */
export function registerAndLogin(name: string, phone: string): GardenData {
  const id = 'user_' + Date.now();
  const today = new Date().toISOString().slice(0, 10);
  const data: GardenData = {
    ...defaultGarden(),
    name,
    phone,
    userId: id,
    lastActiveDate: today,
    activeDays: 1,
  };
  // 保存到当前会话
  saveGarden(data);
  // 保存到用户集合
  localStorage.setItem(USER_COLLECTION_PREFIX + id, JSON.stringify(data));
  // 保存手机号映射
  const phoneMap = JSON.parse(localStorage.getItem(PHONE_MAP_KEY) || '{}');
  phoneMap[phone] = id;
  localStorage.setItem(PHONE_MAP_KEY, JSON.stringify(phoneMap));
  // 注册共享用户
  registerSharedUser(name, phone, id);
  return data;
}

/** 手机号登录 */
export function loginByPhone(phone: string): GardenData | null {
  const phoneMap = JSON.parse(localStorage.getItem(PHONE_MAP_KEY) || '{}');
  const userId = phoneMap[phone];
  if (!userId) return null;
  const raw = localStorage.getItem(USER_COLLECTION_PREFIX + userId);
  if (!raw) return null;
  const data = JSON.parse(raw) as GardenData;
  // 同步到当前会话
  saveGarden(data);
  return data;
}

/** 注销（保存到用户集合，清空当前会话） */
export function logoutUser(): void {
  const data = loadGarden();
  if (data.userId) {
    localStorage.setItem(USER_COLLECTION_PREFIX + data.userId, JSON.stringify(data));
  }
  localStorage.removeItem(STORAGE_KEY);
}

/** 切换用户（保存当前，加载目标） */
export function switchToUser(userId: string): GardenData | null {
  const current = loadGarden();
  if (current.userId) {
    localStorage.setItem(USER_COLLECTION_PREFIX + current.userId, JSON.stringify(current));
  }
  const raw = localStorage.getItem(USER_COLLECTION_PREFIX + userId);
  if (!raw) return null;
  const data = JSON.parse(raw) as GardenData;
  saveGarden(data);
  return data;
}

/** 获取所有已注册用户（用于切换） */
export function getAllUsers(): SharedUserData[] {
  return loadSharedUsers();
}

// 修改 registerSharedUser 接受 phone 和 id 参数
/** 注册时同步用户到共享数据 */
export function registerSharedUser(name: string, phone?: string, id?: string): string {
  const users = loadSharedUsers();
  const userId = id || 'user_' + Date.now();
  users.push({
    id: userId,
    name,
    phone: phone || '',
    coolingCompleted: false,
    coolingMinutes: 0,
    activeDays: 1,
    answeredCount: 0,
    testCompleted: false,
    photoDataUrl: null,
    hasBadge: false,
    badges: [],
    city: '',
    bio: '正在了解自己。',
    matchId: null,
  });
  saveSharedUsers(users);
  return userId;
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
export function initGarden(name: string, userId?: string): GardenData {
  const today = new Date().toISOString().slice(0, 10);
  const data: GardenData = {
    ...defaultGarden(),
    name,
    userId: userId || '',
    lastActiveDate: today,
    activeDays: 1,
  };
  saveGarden(data);
  return data;
}

/** 保存测评进度（暂停时调用） */
export function saveTestProgress(progress: TestProgress): void {
  const data = loadGarden();
  data.testProgress = progress;
  saveGarden(data);
}

/** 清除测评进度 */
export function clearTestProgress(): void {
  const data = loadGarden();
  data.testProgress = null;
  saveGarden(data);
}

// ─── 匹配系统 ───
// MVP 使用 "shared-users" localStorage key 模拟多用户
// 后续对接 Supabase 后迁移到数据库

const SHARED_KEY = 'waiting-for-you-shared';

export interface SharedUserData {
  id: string;
  name: string;
  phone: string;
  coolingCompleted: boolean;
  coolingMinutes: number;
  activeDays: number;
  answeredCount: number;
  testCompleted: boolean;
  photoDataUrl: string | null;
  hasBadge: boolean;
  badges: { type: string; label: string }[];
  city: string;
  bio: string;
  matchId: string | null; // 当前匹配到的用户 ID
}

export function loadSharedUsers(): SharedUserData[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SHARED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveSharedUsers(users: SharedUserData[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SHARED_KEY, JSON.stringify(users));
}

/** 获取所有已开花的用户（可匹配） */
export function getMatchableUsers(currentUserId: string): SharedUserData[] {
  return loadSharedUsers().filter(u =>
    u.id !== currentUserId && u.coolingCompleted
  );
}

/** 生成匹配 */
export function createMatch(
  userIdA: string,
  userIdB: string,
  curatorNote: string,
  icebreaker: string
): { userAMatch: MatchData; userBMatch: MatchData } | null {
  const users = loadSharedUsers();
  const uA = users.find(u => u.id === userIdA);
  const uB = users.find(u => u.id === userIdB);
  if (!uA || !uB) return null;

  const now = new Date().toISOString();
  const week = new Date().toISOString().slice(0, 10);
  const matchId = 'match_' + Date.now();

  const matchDataBase = {
    id: matchId,
    matchWeek: week,
    curatorNote,
    icebreaker,
    status: 'pending' as const,
    decidedAt: null,
    chatOpen: false,
    chatExpiresAt: null,
    createdAt: now,
  };

  const matchA: MatchData = {
    ...matchDataBase,
    matchedUserId: userIdB,
    matchedUserName: uB.name,
    matchedPhoto: uB.photoDataUrl,
    matchedBadges: uB.badges,
    matchedCity: uB.city,
    matchedBio: uB.bio,
  };

  const matchB: MatchData = {
    ...matchDataBase,
    matchedUserId: userIdA,
    matchedUserName: uA.name,
    matchedPhoto: uA.photoDataUrl,
    matchedBadges: uA.badges,
    matchedCity: uA.city,
    matchedBio: uA.bio,
  };

  // 写入双方 localStorage
  const gA = JSON.parse(localStorage.getItem('waiting-for-you-garden-user-' + userIdA) || '{}');
  if (gA && typeof gA === 'object') {
    gA.currentMatch = matchA;
    localStorage.setItem('waiting-for-you-garden-user-' + userIdA, JSON.stringify(gA));
  }

  const gB = JSON.parse(localStorage.getItem('waiting-for-you-garden-user-' + userIdB) || '{}');
  if (gB && typeof gB === 'object') {
    gB.currentMatch = matchB;
    localStorage.setItem('waiting-for-you-garden-user-' + userIdB, JSON.stringify(gB));
  }

  // 更新共享数据
  uA.matchId = matchId;
  uB.matchId = matchId;
  saveSharedUsers(users);

  return { userAMatch: matchA, userBMatch: matchB };
}

/** 获取当前花园用户的匹配信息 */
export function getCurrentMatch(userId: string | null): MatchData | null {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem('waiting-for-you-garden-user-' + userId);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data.currentMatch || null;
  } catch { return null; }
}

/** 用户做出决定 */
export function decideMatch(userId: string, matchId: string, decision: 'accept' | 'skip'): MatchData | null {
  const raw = localStorage.getItem('waiting-for-you-garden-user-' + userId);
  if (!raw) return null;
  const data = JSON.parse(raw);
  if (!data.currentMatch || data.currentMatch.id !== matchId) return null;

  const now = new Date().toISOString();
  data.currentMatch.status = decision === 'accept' ? 'accepted' : 'skipped';
  data.currentMatch.decidedAt = now;
  localStorage.setItem('waiting-for-you-garden-user-' + userId, JSON.stringify(data));

  return data.currentMatch;
}

/** 创始人确认双向匹配（双方都接受后调用） */
export function confirmMutual(userIdA: string, userIdB: string, matchId: string): boolean {
  const rawA = localStorage.getItem('waiting-for-you-garden-user-' + userIdA);
  const rawB = localStorage.getItem('waiting-for-you-garden-user-' + userIdB);
  if (!rawA || !rawB) return false;

  const dataA = JSON.parse(rawA);
  const dataB = JSON.parse(rawB);

  if (dataA.currentMatch?.id !== matchId || dataB.currentMatch?.id !== matchId) return false;

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  dataA.currentMatch.status = 'mutual';
  dataA.currentMatch.chatOpen = true;
  dataA.currentMatch.chatExpiresAt = expiresAt;
  localStorage.setItem('waiting-for-you-garden-user-' + userIdA, JSON.stringify(dataA));

  dataB.currentMatch.status = 'mutual';
  dataB.currentMatch.chatOpen = true;
  dataB.currentMatch.chatExpiresAt = expiresAt;
  localStorage.setItem('waiting-for-you-garden-user-' + userIdB, JSON.stringify(dataB));

  return true;
}

/** 标记测评完成 */
export function markTestCompleted(): void {
  const data = loadGarden();
  data.testProgress = null;
  data.testCompleted = true;
  data.growthMinutes += 60; // 完成奖励
  saveGarden(data);
}

// ──────────── 聊天系统 ────────────

export interface ChatMessage {
  id: string;
  matchId: string;
  senderId: 'me' | string;    // 'me' 表示当前用户
  text: string;
  createdAt: string;
  type: 'text' | 'nvc';
}

const CHAT_PREFIX = 'waiting-for-you-chat-';

export function getChatMessages(matchId: string): ChatMessage[] {
  try {
    const raw = localStorage.getItem(CHAT_PREFIX + matchId);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function sendChatMessage(matchId: string, text: string, type: 'text' | 'nvc' = 'text'): ChatMessage {
  const messages = getChatMessages(matchId);
  const msg: ChatMessage = {
    id: 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    matchId,
    senderId: 'me',
    text: text.trim(),
    createdAt: new Date().toISOString(),
    type,
  };
  messages.push(msg);
  localStorage.setItem(CHAT_PREFIX + matchId, JSON.stringify(messages));
  return msg;
}

/** 模拟对方回复（MVP 自问自答模式） */
export function simulateReply(matchId: string, userName: string, text: string): ChatMessage {
  const messages = getChatMessages(matchId);
  const msg: ChatMessage = {
    id: 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    matchId,
    senderId: userName,
    text: text.trim(),
    createdAt: new Date().toISOString(),
    type: 'text',
  };
  messages.push(msg);
  localStorage.setItem(CHAT_PREFIX + matchId, JSON.stringify(messages));
  return msg;
}

/** 获取聊天剩余天数 */
export function getChatRemainingDays(expiresAt: string | null): number {
  if (!expiresAt) return 0;
  const remaining = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(remaining / (1000 * 60 * 60 * 24)));
}

/** 判断聊天是否过期 */
export function isChatExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return true;
  return Date.now() > new Date(expiresAt).getTime();
}

// ──────────── 故事画板（花园日记） ────────────

export interface StoryEntry {
  id: string;
  date: string;              // YYYY-MM-DD
  content: string;
  type: 'reflection' | 'milestone';
  milestoneType?: 'register' | 'question' | 'test' | 'photo' | 'bloom' | 'match';
  createdAt: string;
}

const CANVAS_KEY = 'waiting-for-you-canvas';

export function getStoryEntries(): StoryEntry[] {
  try {
    const raw = localStorage.getItem(CANVAS_KEY);
    const entries: StoryEntry[] = raw ? JSON.parse(raw) : [];
    // 去重（修复旧数据中的重复 ID）
    const seen = new Set<string>();
    const deduped = entries.filter((e) => {
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    });
    if (deduped.length !== entries.length) {
      localStorage.setItem(CANVAS_KEY, JSON.stringify(deduped));
    }
    return deduped;
  } catch {
    return [];
  }
}

export function addStoryEntry(content: string, type: StoryEntry['type']): StoryEntry {
  const entries = getStoryEntries();
  const today = new Date().toISOString().slice(0, 10);
  const entry: StoryEntry = {
    id: 'story_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    date: today,
    content,
    type,
    createdAt: new Date().toISOString(),
  };
  entries.push(entry);
  localStorage.setItem(CANVAS_KEY, JSON.stringify(entries));
  return entry;
}

/** 自动生成里程碑（不会重复创建） */
export function autoGenerateMilestone(type: StoryEntry['milestoneType'], garden: GardenData): StoryEntry | null {
  const entries = getStoryEntries();
  // 检查是否已存在同类型里程碑
  if (entries.some((e) => e.type === 'milestone' && e.milestoneType === type)) return null;

  const milestoneTexts: Record<string, string> = {
    register: `🌱 种下了一颗种子。从今天开始，用心生长。`,
    question: `🌿 完成了 ${garden.answeredQuestions.length} 道开放式问题。对自己有了新的认识。`,
    test: `🧠 完成了人格测评。102 道题，是一次耐心的自我探索。`,
    photo: `📸 上传了真实照片。勇敢做真实的自己。`,
    bloom: `🌻 花儿开了！经过了 ${garden.growthMinutes} 分钟的生长和 ${garden.activeDays} 天的等待。`,
    match: `💌 收到创始人的匹配。有人正在向你走来。`,
  };

  const text = type ? milestoneTexts[type] : null;
  if (!text) return null;

  const entry = addStoryEntry(text, 'milestone');
  entry.milestoneType = type;
  // 覆写以包含 milestoneType
  const all = getStoryEntries();
  const idx = all.findIndex((e) => e.id === entry.id);
  if (idx !== -1) {
    all[idx] = entry;
    localStorage.setItem(CANVAS_KEY, JSON.stringify(all));
  }
  return entry;
}

/** 检查今天是否已写日记 */
export function hasTodayReflection(): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return getStoryEntries().some((e) => e.type === 'reflection' && e.date === today);
}
