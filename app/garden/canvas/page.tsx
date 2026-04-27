'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  loadGarden,
  getStoryEntries,
  addStoryEntry,
  hasTodayReflection,
  autoGenerateMilestone,
  type StoryEntry,
  type GardenData,
} from '@/lib/garden-store';
import { calculateGardenStage } from '@/lib/garden-stage';

export default function CanvasPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<StoryEntry[]>([]);
  const [garden, setGarden] = useState<GardenData | null>(null);
  const [showWrite, setShowWrite] = useState(false);
  const [draft, setDraft] = useState('');
  const [writing, setWriting] = useState(false);

  useEffect(() => {
    const g = loadGarden();
    setGarden(g);

    // 自动生成里程碑
    autoGenerateMilestone('register', g);
    if (g.answeredQuestions.length > 0) autoGenerateMilestone('question', g);
    if (g.testCompleted) autoGenerateMilestone('test', g);
    if (g.photoDataUrl) autoGenerateMilestone('photo', g);

    // 检查是否已开花
    const stage = calculateGardenStage(g.growthMinutes, g.activeDays);
    if (stage.stage >= 4) autoGenerateMilestone('bloom', g);

    setEntries(getStoryEntries().sort((a, b) => b.date.localeCompare(a.date)));
  }, []);

  const todayLocked = garden ? hasTodayReflection() : false;

  const handleWrite = () => {
    const text = draft.trim();
    if (!text || writing) return;
    setWriting(true);
    addStoryEntry(text, 'reflection');
    setDraft('');
    setShowWrite(false);
    setEntries(getStoryEntries().sort((a, b) => b.date.localeCompare(a.date)));
    setWriting(false);
  };

  const totalPages = entries.length;
  const reflectionCount = entries.filter((e) => e.type === 'reflection').length;
  const milestoneCount = entries.filter((e) => e.type === 'milestone').length;

  return (
    <main className="min-h-screen bg-paper-white pb-24">
      {/* 头部 */}
      <header className="pt-12 pb-4 px-6 border-b border-paper-aged/50">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => router.push('/garden')}
            className="text-ink-light hover:text-ink-black text-sm"
          >
            ← 回到花园
          </button>
        </div>
        <div className="text-center">
          <div className="text-3xl mb-2">📖</div>
          <h1 className="font-calligraphy text-2xl text-ink-black">花园日记</h1>
          <p className="text-ink-light text-xs mt-1">
            第 {totalPages + 1} 页 · {milestoneCount} 个里程碑 · {reflectionCount} 篇日记
          </p>
        </div>
      </header>

      {/* 时间线 */}
      <div className="px-6 py-6 max-w-lg mx-auto">
        {entries.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🌱</div>
            <p className="text-ink-gray text-sm leading-relaxed mb-4">
              你的故事画板还是空的。
              <br />
              当你完成一些事情，这里会自动记录。
              <br />
              你也可以写下每天的感想。
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry, idx) => (
              <div key={entry.id} className="flex gap-4">
                {/* 时间线竖线 */}
                <div className="flex flex-col items-center shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                    entry.type === 'milestone'
                      ? 'bg-garden-bloom/20 text-garden-bloom'
                      : 'bg-paper-cream text-ink-light'
                  }`}>
                    {entry.type === 'milestone' ? '✨' : '📝'}
                  </div>
                  {idx < entries.length - 1 && (
                    <div className="w-0.5 flex-1 bg-paper-aged mt-1" />
                  )}
                </div>

                {/* 内容 */}
                <div className={`flex-1 min-w-0 pb-4 ${
                  entry.type === 'milestone' ? '' : ''
                }`}>
                  <p className="text-[10px] text-ink-light mb-1">
                    {entry.date}
                    {entry.type === 'reflection' && (
                      <span className="ml-2">日记</span>
                    )}
                    {entry.type === 'milestone' && (
                      <span className="ml-2 text-garden-bloom">里程碑</span>
                    )}
                  </p>
                  <div className={`rounded-petal px-4 py-3 text-sm leading-relaxed ${
                    entry.type === 'milestone'
                      ? 'bg-garden-bloom/5 border border-garden-bloom/20'
                      : 'bg-paper-cream'
                  }`}>
                    {entry.content}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 今日已满提示 */}
        {todayLocked && (
          <div className="text-center mt-6">
            <p className="text-ink-light text-xs">
              今天已经记录过了 🌙 明天再来写吧
            </p>
          </div>
        )}
      </div>

      {/* 浮动写日记按钮 */}
      <button
        onClick={() => setShowWrite(true)}
        disabled={todayLocked}
        className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-lg text-sm font-medium transition-all ${
          todayLocked
            ? 'bg-paper-aged text-ink-light cursor-not-allowed'
            : 'bg-ink-black text-paper-white hover:scale-105 active:scale-95'
        }`}
      >
        {todayLocked ? '今天已记录' : '✏️ 记录今天'}
      </button>

      {/* 写日记弹窗 */}
      {showWrite && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-ink-black/40" onClick={() => setShowWrite(false)} />
          <div className="relative bg-paper-white w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl">
            <div className="px-5 pt-5 pb-3 border-b border-paper-aged flex items-center justify-between">
              <h2 className="text-base font-medium text-ink-black">✏️ 记录今天</h2>
              <button
                onClick={() => setShowWrite(false)}
                className="text-ink-light hover:text-ink-black text-lg leading-none"
              >
                &times;
              </button>
            </div>
            <div className="px-5 py-4">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={`${garden?.name ? garden.name + '，' : ''}今天过得怎么样？\n\n你可以在日记里写下任何感受——\n关于自己、关于花园里的等待、\n或者关于你期待的那次相遇。`}
                rows={6}
                maxLength={500}
                className="input-field w-full resize-none text-sm leading-relaxed"
                autoFocus
              />
              <p className="text-[10px] text-ink-light text-right mt-1">
                {draft.length}/500
              </p>
            </div>
            <div className="px-5 pb-5">
              <button
                onClick={handleWrite}
                disabled={!draft.trim() || writing}
                className={`btn-primary w-full ${
                  !draft.trim() || writing ? 'opacity-30 cursor-not-allowed' : ''
                }`}
              >
                {writing ? '保存中...' : '保存到日记'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
