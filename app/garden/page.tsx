'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  loadGarden,
  addGrowthTime,
  getGardenDisplay,
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
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 加载数据
  useEffect(() => {
    const d = loadGarden();
    setData(d);
  }, []);

  // 心跳：每 30 秒计一次活跃时间
  useEffect(() => {
    if (!data) return;

    heartbeatRef.current = setInterval(() => {
      setData((prev) => {
        if (!prev) return prev;
        // 防作弊 C1：检查是否在 2 秒内重复心跳
        const now = Date.now();
        if (prev.lastHeartbeat && now - prev.lastHeartbeat < 2000) {
          return prev; // 跳过
        }
        // 防作弊 C6：检查日上限
        if (prev.todaySeconds >= prev.dailyCap) {
          return prev; // 今天已满
        }
        return addGrowthTime(prev, 30);
      });
      setElapsed((e) => e + 30);
    }, 30000);

    // 本地秒数计时（实时展示）
    tickRef.current = setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (tickRef.current) clearInterval(tickRef.current);
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
  const isBloomed = data.growthMinutes >= 720 && data.activeDays >= 5;
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
          {elapsed > 0 && !isBloomed && (
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

        {/* 人格测评 — 完成 3 必答后解锁 */}
        <div
          className={`w-full garden-card text-left ${
            answeredCount < 3
              ? 'opacity-40 cursor-not-allowed'
              : 'hover:shadow-md transition-shadow cursor-pointer'
          }`}
          onClick={() => answeredCount >= 3 && router.push('/garden/test')}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧠</span>
            <div className="flex-1">
              <p className="text-ink-black text-sm font-medium">人格测评</p>
              <p className="text-ink-light text-xs mt-0.5">
                {answeredCount < 3
                  ? `完成 3 道必答问题后解锁（还差 ${3 - answeredCount} 题）`
                  : '大五人格 + 依恋类型 · 了解自己的相处模式'}
              </p>
            </div>
            <span className="text-ink-light text-lg">
              {answeredCount >= 3 ? '→' : '🔒'}
            </span>
          </div>
        </div>

        {/* 本周匹配 — 花开后解锁 */}
        <div
          className={`w-full garden-card text-left ${
            !isBloomed
              ? 'opacity-40 cursor-not-allowed'
              : 'hover:shadow-md transition-shadow cursor-pointer'
          }`}
          onClick={() => isBloomed && router.push('/garden/match')}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">💌</span>
            <div className="flex-1">
              <p className="text-ink-black text-sm font-medium">本周匹配</p>
              <p className="text-ink-light text-xs mt-0.5">
                {!isBloomed
                  ? `花开后才能匹配 · 还需 ${Math.max(0, 720 - data.growthMinutes)} 分钟生长`
                  : '查看本周围你匹配的人'}
              </p>
            </div>
            <span className="text-ink-light text-lg">
              {isBloomed ? '→' : '🔒'}
            </span>
          </div>
        </div>
      </div>

      {/* 防作弊说明 — 小字 */}
      <div className="px-6 mt-6 text-center">
        <p className="text-ink-light text-xs leading-relaxed">
          浏览花园会自动累积生长时间
          <br />
          每日最多生长 4 小时 · 快速操作不计时
        </p>
      </div>
    </main>
  );
}
