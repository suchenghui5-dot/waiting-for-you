'use client';

import { useState } from 'react';
import Link from 'next/link';
import { calculateGardenStage } from '@/lib/garden-stage';

export default function GardenPage() {
  // 模拟数据 — 后续对接真实用户数据
  const [growthMinutes] = useState(0);
  const [activeDays] = useState(0);

  const garden = calculateGardenStage(growthMinutes, activeDays);

  return (
    <main className="min-h-screen bg-paper-white">
      {/* 顶部 */}
      <header className="pt-12 pb-4 px-6">
        <div className="flex items-center justify-between">
          <h1 className="font-calligraphy text-xl text-ink-black">你的花园</h1>
          <Link href="/" className="text-xs text-ink-light underline hover:text-ink-gray">
            退出
          </Link>
        </div>
      </header>

      {/* 花园状态卡片 */}
      <div className="px-6 mb-8">
        <div className="garden-card text-center">
          {/* 当前阶段图标 */}
          <div className="w-24 h-24 mx-auto mb-4 rounded-full"
               style={{ backgroundColor: garden.color, opacity: 0.15 }} />

          <h2 className="font-calligraphy text-2xl text-ink-black mb-1">
            {garden.stageNameCN}
          </h2>
          <p className="text-ink-gray text-sm mb-4">
            {garden.message}
          </p>

          {/* 进度条 */}
          <div className="w-full bg-paper-aged rounded-full h-1.5 mb-2">
            <div
              className="h-1.5 rounded-full transition-all duration-1000"
              style={{
                width: `${garden.totalProgress * 100}%`,
                backgroundColor: garden.color,
              }}
            />
          </div>

          <div className="flex justify-between text-xs text-ink-light">
            <span>种子</span>
            <span>破土</span>
            <span>展叶</span>
            <span>花苞</span>
            <span>开花</span>
          </div>

          <div className="mt-4 pt-4 border-t border-paper-aged grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-ink-light">活跃时间</p>
              <p className="text-ink-black font-medium">
                {Math.floor(growthMinutes / 60)} 小时 {growthMinutes % 60} 分钟
              </p>
            </div>
            <div>
              <p className="text-ink-light">花园日记</p>
              <p className="text-ink-black font-medium">
                第 {activeDays + 1} 天
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 占位：后续功能入口 */}
      <div className="px-6 space-y-3">
        <div className="garden-card opacity-50 cursor-not-allowed">
          <p className="text-ink-gray text-sm">开放式问题</p>
          <p className="text-ink-light text-xs mt-1">完成生长日记后才能开始</p>
        </div>
        <div className="garden-card opacity-50 cursor-not-allowed">
          <p className="text-ink-gray text-sm">人格测评</p>
          <p className="text-ink-light text-xs mt-1">完成生长日记后才能开始</p>
        </div>
        <div className="garden-card opacity-50 cursor-not-allowed">
          <p className="text-ink-gray text-sm">本周匹配</p>
          <p className="text-ink-light text-xs mt-1">第 1 周 · 等待匹配中</p>
        </div>
      </div>
    </main>
  );
}
