'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  loadGarden,
  saveGarden,
  addGrowthTime,
  getGardenDisplay,
  getCurrentMatch,
  type GardenData,
} from '@/lib/garden-store';

/** 阶段对应的 emoji */
const STAGE_EMOJI = ['🌰', '🌱', '🌿', '🌷', '🌻'];

/** 呼吸动画样式 */
function stageBgColor(stage: number): string {
  const colors = ['#5C4033', '#7BA05B', '#4A8C3F', '#E8A87C', '#F4D03F'];
  return colors[stage] || '#5C4033';
}

export default function GardenPage() {
  const router = useRouter();
  const [data, setData] = useState<GardenData | null>(null);
  const [elapsed, setElapsed] = useState(0); // 本次会话累积秒数
  const [currentMatch, setCurrentMatch] = useState(getCurrentMatch(null));
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 加载数据 & 记录会话开始
  useEffect(() => {
    const d = loadGarden();
    // C3：记录本次会话开始时间
    if (!d.sessionStart) {
      d.sessionStart = Date.now();
      saveGarden(d);
    }
    setData(d);
    if (d.userId) {
      setCurrentMatch(getCurrentMatch(d.userId));
    }
  }, []);

  // C7：跨标签检测——用 localStorage 广播活跃状态
  useEffect(() => {
    if (!data) return;
    const TAB_KEY = 'waiting-for-you-active-tab';
    localStorage.setItem(TAB_KEY, Date.now().toString());

    const onStorage = (e: StorageEvent) => {
      if (e.key === TAB_KEY && e.newValue && e.oldValue) {
        const otherTabTime = parseInt(e.newValue);
        const myTime = parseInt(e.oldValue);
        // 另一个标签在 5 秒内有更新，说明多标签同时在线
        if (Math.abs(otherTabTime - myTime) < 10000) {
          // 简单处理：暂停本标签的心跳，让另一个标签继续
          if (heartbeatRef.current) {
            clearInterval(heartbeatRef.current);
            heartbeatRef.current = null;
          }
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [!!data]);

  // 心跳：每 30 秒计一次活跃时间（含防作弊）
  useEffect(() => {
    if (!data) return;

    const MAX_SESSION_MS = 2 * 60 * 60 * 1000; // C3：最长连续会话 2 小时

    const canGrow = (prev: GardenData): boolean => {
      const now = Date.now();
      // C1：间隔 >= 2 秒
      if (prev.lastHeartbeat && now - prev.lastHeartbeat < 2000) return false;
      // C6：日上限
      if (prev.todaySeconds >= prev.dailyCap) return false;
      // C3：会话时长限制（防挂机）
      if (prev.sessionStart && now - prev.sessionStart > MAX_SESSION_MS) return false;
      return true;
    };

    const startHeartbeat = () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      heartbeatRef.current = setInterval(() => {
        setData((prev) => {
          if (!prev) return prev;
          if (!canGrow(prev)) return prev;
          return addGrowthTime(prev, 30);
        });
        setElapsed((e) => e + 30);
      }, 30000);
    };

    const startTick = () => {
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = setInterval(() => {
        setElapsed((e) => e + 1);
      }, 1000);
    };

    // C2：标签页可见性
    const onVisibilityChange = () => {
      if (document.hidden) {
        // 切走：暂停所有计时
        if (heartbeatRef.current) { clearInterval(heartbeatRef.current); heartbeatRef.current = null; }
        if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
      } else {
        // 切回：重置会话计时器
        setData((prev) => {
          if (!prev) return prev;
          prev.sessionStart = Date.now();
          saveGarden(prev);
          return { ...prev };
        });
        startHeartbeat();
        startTick();
      }
    };

    startHeartbeat();
    startTick();
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (tickRef.current) clearInterval(tickRef.current);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [!!data]);

  // 数据未加载
  if (!data) {
    return (
      <main className="min-h-screen bg-paper-white flex items-center justify-center">
        <p className="text-ink-light text-sm">加载中...</p>
      </main>
    );
  }

  const garden = getGardenDisplay(data);
  const isBloomed = true; // 测试模式：强制开花，方便测试全部功能
  const todayRemaining = Math.max(0, data.dailyCap - data.todaySeconds);
  const answeredCount = data.answeredQuestions.length;

  return (
    <main className="min-h-screen bg-paper-white pb-24">
      {/* 顶部 */}
      <header className="pt-12 pb-4 px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-calligraphy text-xl text-ink-black">你的花园</h1>
            {data.name && (
              <p className="text-ink-light text-xs mt-0.5">{data.name} 的花园</p>
            )}
          </div>
          <Link href="/" className="text-xs text-ink-light underline hover:text-ink-gray">
            退出
          </Link>
        </div>
      </header>

      {/* ===== 花园核心卡片 ===== */}
      <div className="px-6 mb-6">
        <div className="garden-card text-center relative overflow-hidden">
          {/* 阶段装饰背景 */}
          <div
            className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-5"
            style={{ backgroundColor: garden.color }}
          />

          {/* 阶段 emoji + 呼吸动画 */}
          <div className="text-6xl mb-4 animate-seed-grow" style={{ animationDuration: isBloomed ? '2s' : '4s' }}>
            {STAGE_EMOJI[garden.stage]}
          </div>

          {/* 阶段名称 */}
          <h2
            className="font-calligraphy text-2xl mb-1"
            style={{ color: garden.color }}
          >
            {garden.stageNameCN}
          </h2>
          <p className="text-ink-gray text-sm mb-4 leading-relaxed">
            {garden.message}
          </p>

          {/* 进度条 */}
          <div className="w-full bg-paper-aged rounded-full h-2 mb-2">
            <div
              className="h-2 rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${garden.totalProgress * 100}%`,
                backgroundColor: garden.color,
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-ink-light mb-4">
            <span className={garden.stage >= 0 ? 'font-medium text-ink-black' : ''}>种子</span>
            <span className={garden.stage >= 1 ? 'font-medium text-ink-black' : ''}>破土</span>
            <span className={garden.stage >= 2 ? 'font-medium text-ink-black' : ''}>展叶</span>
            <span className={garden.stage >= 3 ? 'font-medium text-ink-black' : ''}>花苞</span>
            <span className={garden.stage >= 4 ? 'font-medium text-ink-black' : ''}>开花</span>
          </div>

          {/* 统计数据 */}
          <div className="grid grid-cols-3 gap-3 text-xs pt-4 border-t border-paper-aged">
            <div>
              <p className="text-ink-light">活跃时间</p>
              <p className="text-ink-black font-medium mt-0.5">
                {Math.floor(data.growthMinutes)} 分钟
              </p>
            </div>
            <div>
              <p className="text-ink-light">花园日记</p>
              <p className="text-ink-black font-medium mt-0.5">
                第 {data.activeDays} 天
              </p>
            </div>
            <div>
              <p className="text-ink-light">题目</p>
              <p className="text-ink-black font-medium mt-0.5">
                {answeredCount}/6
              </p>
            </div>
          </div>

          {/* 今日剩余 */}
          <div className="mt-3 text-xs text-ink-light">
            今日还可生长：{Math.floor(todayRemaining / 60)} 分钟
          </div>

          {/* 本次会话计时 */}
          {elapsed > 0 && (
            <div className="mt-2 text-xs text-garden-sprout animate-fade-mist">
              本此生长 +{Math.floor(elapsed / 60)} 分钟
            </div>
          )}
        </div>
      </div>

      {/* ===== 行动入口 ===== */}
      <div className="px-6 space-y-3">

        {/* 开放式问题 — 始终可用 */}
        <button
          onClick={() => router.push('/garden/questions')}
          className="w-full garden-card text-left hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">📝</span>
            <div className="flex-1">
              <p className="text-ink-black text-sm font-medium">开放式问题</p>
              <p className="text-ink-light text-xs mt-0.5">
                {answeredCount >= 3
                  ? `已完成 ${answeredCount}/6 · 可以开始人格测评了`
                  : `了解自己，每次回答获得 15 分钟生长（${answeredCount}/3 必答）`}
              </p>
            </div>
            <span className="text-ink-light text-lg">→</span>
          </div>
          {/* 热度指示 */}
          <div className="mt-2 flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full ${
                  data.answeredQuestions.length > i
                    ? 'bg-garden-leaf'
                    : 'bg-paper-aged'
                }`}
              />
            ))}
          </div>
        </button>

        {/* 真实照片 — 始终可用 */}
        <button
          onClick={() => router.push('/garden/photo')}
          className="w-full garden-card text-left hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">📸</span>
            <div className="flex-1">
              <p className="text-ink-black text-sm font-medium">真实照片</p>
              <p className="text-ink-light text-xs mt-0.5">
                {data.photoPromise
                  ? '✅ 已上传 · 已获得「真实承诺」徽章'
                  : '上传真实照片 · 获得「真实承诺」徽章'}
              </p>
            </div>
            <span className="text-ink-light text-lg">→</span>
          </div>
        </button>

        {/* 人格测评 — 测试模式：始终可用 */}
        <button
          onClick={() => router.push('/garden/test')}
          className="w-full garden-card text-left hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧠</span>
            <div className="flex-1">
              <p className="text-ink-black text-sm font-medium">人格测评</p>
              <p className="text-ink-light text-xs mt-0.5">
                大五人格 + 依恋类型 · 了解自己的相处模式
              </p>
            </div>
            <span className="text-ink-light text-lg">→</span>
          </div>
        </button>

        {/* 故事画板 — 始终可用 */}
        <button
          onClick={() => router.push('/garden/canvas')}
          className="w-full garden-card text-left hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">📖</span>
            <div className="flex-1">
              <p className="text-ink-black text-sm font-medium">故事画板</p>
              <p className="text-ink-light text-xs mt-0.5">
                记录你的花园日记 · 查看成长里程碑
              </p>
            </div>
            <span className="text-ink-light text-lg">→</span>
          </div>
        </button>

        {/* 本周匹配 — 测试模式：始终可用 */}
        <button
          onClick={() => {
            if (currentMatch?.status === 'mutual') {
              router.push('/garden/chat');
            } else {
              router.push('/garden/match');
            }
          }}
          className="w-full garden-card text-left hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">💌</span>
            <div className="flex-1">
              <p className="text-ink-black text-sm font-medium">本周匹配</p>
              <p className={`text-xs mt-0.5 ${
                currentMatch?.status === 'mutual' ? 'text-seal-red' :
                currentMatch?.status === 'accepted' ? 'text-garden-bloom' :
                currentMatch?.status === 'pending' ? 'text-sky-blue' :
                'text-ink-light'
              }`}>
                {!currentMatch
                  ? '等待创始人匹配中...'
                  : currentMatch.status === 'mutual'
                  ? `✅ 匹配成功！与 ${currentMatch.matchedUserName} 双向确认`
                  : currentMatch.status === 'accepted'
                  ? `已接受 · 等待 ${currentMatch.matchedUserName} 的回应`
                  : currentMatch.status === 'skipped'
                  ? '已跳过 · 等待下一次匹配'
                  : `来自创始人的匹配 · 查看详情`}
              </p>
            </div>
            <span className="text-ink-light text-lg">→</span>
          </div>
          {/* 匹配进度指示 */}
          {currentMatch && currentMatch.status === 'pending' && (
            <div className="mt-2 flex gap-1">
              <div className="h-1 flex-1 rounded-full bg-sky-blue animate-pulse" />
              <div className="h-1 flex-1 rounded-full bg-paper-aged" />
            </div>
          )}
          {currentMatch && currentMatch.status === 'mutual' && (
            <div className="mt-2 flex gap-1">
              <div className="h-1 flex-1 rounded-full bg-seal-red" />
              <div className="h-1 flex-1 rounded-full bg-seal-red" />
            </div>
          )}
        </button>
      </div>

      {/* 防作弊状态 — 小字 */}
      <div className="px-6 mt-6 text-center space-y-1">
        <p className="text-ink-light text-xs leading-relaxed">
          浏览花园会自动累积生长时间
          <br />
          每日最多生长 4 小时 · 快速操作不计时 · 切走后暂停
        </p>
        <p className="text-[10px] text-ink-light">
          今日已生长 {Math.floor(data.todaySeconds / 60)} 分钟
          {data.sessionStart && Date.now() - data.sessionStart > 2 * 60 * 60 * 1000
            ? ' · 会话超时，请刷新页面继续'
            : ''}
        </p>
      </div>
    </main>
  );
}
