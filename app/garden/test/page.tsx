'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  BIG_FIVE_QUESTIONS,
  ECRR_QUESTIONS,
  RAVEN_QUESTIONS,
  TOTAL_QUESTIONS,
} from '@/lib/personality/questions';
import { calculateResults, type TestResults } from '@/lib/personality/scoring';
import { buildReport } from '@/lib/personality/narrative';
import { loadGarden, saveGarden } from '@/lib/garden-store';
import type { TestSection } from '@/lib/personality/questions';

type PageState = 'intro' | 'testing' | 'result';

/** 五级量表标签 */
const LIKERT_5 = [
  { value: 1, label: '非常不符合' },
  { value: 2, label: '比较不符合' },
  { value: 3, label: '中立' },
  { value: 4, label: '比较符合' },
  { value: 5, label: '非常符合' },
];

/** 七级量表标签 */
const LIKERT_7 = [
  { value: 1, label: '完全不同意' },
  { value: 2, label: '不同意' },
  { value: 3, label: '有点不同意' },
  { value: 4, label: '中立' },
  { value: 5, label: '有点同意' },
  { value: 6, label: '同意' },
  { value: 7, label: '完全同意' },
];

/** 注意检测题：随机插入 */
const ATTENTION_CHECKS = [
  { prompt: '请选择"符合"', correctValue: 4 },
  { prompt: '请选择"中立"', correctValue: 3 },
  { prompt: '请选择"非常不符合"', correctValue: 1 },
];

interface QuestionEntry {
  type: TestSection;
  sourceId: number; // 原题 ID
  text: string;
  likert: '5' | '7';
  isAttentionCheck?: boolean;
  attentionCorrectValue?: number;
  ravenOptions?: string[];
}

export default function PersonalityTestPage() {
  const router = useRouter();
  const [state, setState] = useState<PageState>('intro');
  const [section, setSection] = useState<TestSection>('big-five');
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<{
    bigFive: Record<number, number>;
    ecrr: Record<number, number>;
    raven: Record<number, number>;
  }>({ bigFive: {}, ecrr: {}, raven: {} });
  const [results, setResults] = useState<TestResults | null>(null);
  const [animDir, setAnimDir] = useState<'next' | 'prev'>('next');
  const [animating, setAnimating] = useState(false);
  const [testProgress, setTestProgress] = useState(0); // 0-3: sections completed
  const [attentionFails, setAttentionFails] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 构建扁平问题列表
  const buildQuestions = useCallback((section: TestSection): QuestionEntry[] => {
    const list: QuestionEntry[] = [];

    if (section === 'big-five') {
      for (const q of BIG_FIVE_QUESTIONS) {
        list.push({
          type: 'big-five',
          sourceId: q.id,
          text: q.text,
          likert: '5',
        });
        // 每 10 题插一个注意力检测
        if (q.id % 10 === 0 && q.id < 50) {
          const check = ATTENTION_CHECKS[(q.id / 10 - 1) % ATTENTION_CHECKS.length];
          list.push({
            type: 'big-five',
            sourceId: -check.correctValue,
            text: check.prompt,
            likert: '5',
            isAttentionCheck: true,
            attentionCorrectValue: check.correctValue,
          });
        }
      }
    } else if (section === 'ecrr') {
      for (const q of ECRR_QUESTIONS) {
        list.push({
          type: 'ecrr',
          sourceId: q.id,
          text: q.text,
          likert: '7',
        });
        // 每 12 题插一个注意力检测
        if (q.id % 12 === 0 && q.id < 36) {
          const check = ATTENTION_CHECKS[((q.id / 12) + 2) % ATTENTION_CHECKS.length];
          list.push({
            type: 'ecrr',
            sourceId: -check.correctValue,
            text: check.prompt,
            likert: '7',
            isAttentionCheck: true,
            attentionCorrectValue: check.correctValue,
          });
        }
      }
    } else if (section === 'raven') {
      for (const q of RAVEN_QUESTIONS) {
        list.push({
          type: 'raven',
          sourceId: q.id,
          text: '',
          likert: '5',
          ravenOptions: q.options,
        });
      }
    }

    return list;
  }, []);

  const [questions, setQuestions] = useState<QuestionEntry[]>([]);

  // 切换到新的 section 时构建问题列表
  useEffect(() => {
    setQuestions(buildQuestions(section));
    setQIndex(0);
    setAnimating(false);
  }, [section, buildQuestions]);

  const currentQ = questions[qIndex];
  const isLastQ = qIndex >= questions.length - 1;

  const handleAnswer = useCallback((value: number) => {
    if (!currentQ || animating) return;

    setAnimDir('next');
    setAnimating(true);

    // 注意力检测
    if (currentQ.isAttentionCheck) {
      if (value !== currentQ.attentionCorrectValue) {
        setAttentionFails((f) => f + 1);
      }
    }

    // 记录答案
    setAnswers((prev) => {
      const key = currentQ.type;
      const id = currentQ.sourceId;
      if (currentQ.isAttentionCheck) return prev;
      return { ...prev, [key]: { ...prev[key], [id]: value } };
    });

    // 延迟后进入下一题
    setTimeout(() => {
      if (currentQ.isAttentionCheck) {
        // 注意力检测题直接进下一题，不计入答案
      }

      if (isLastQ) {
        // 当前 section 完成
        if (section === 'big-five') {
          setSection('ecrr');
          setTestProgress(1);
        } else if (section === 'ecrr') {
          setSection('raven');
          setTestProgress(2);
        } else {
          // 全部完成 → 计算结果
          setTestProgress(3);
          const r = calculateResults(answers.bigFive, answers.ecrr, answers.raven);
          setResults(r);
          setState('result');

          // 记录到 garden-store
          const g = loadGarden();
          g.growthMinutes += 60; // 完成测评 +60 分钟
          saveGarden(g);
        }
      } else {
        setQIndex((i) => i + 1);
      }

      setAnimating(false);
      scrollRef.current?.scrollTo(0, 0);
    }, 200);
  }, [currentQ, animating, isLastQ, section, answers]);

  // ─── 开始页面 ───
  if (state === 'intro') {
    return (
      <main className="min-h-screen bg-paper-white flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="text-5xl animate-seed-grow">🧠</div>
          <h1 className="font-calligraphy text-2xl text-ink-black">人格测评</h1>
          <p className="text-ink-gray text-sm leading-relaxed">
            这套测评包含三个部分：
          </p>

          <div className="garden-card text-left space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-lg mt-0.5">①</span>
              <div>
                <p className="text-ink-black text-sm font-medium">大五人格（50 题）</p>
                <p className="text-ink-light text-xs">你的基本性格画像</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-lg mt-0.5">②</span>
              <div>
                <p className="text-ink-black text-sm font-medium">ECR-R 亲密关系体验（36 题）</p>
                <p className="text-ink-light text-xs">你在亲密关系中的依恋类型</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-lg mt-0.5">③</span>
              <div>
                <p className="text-ink-black text-sm font-medium">瑞文推理（16 题）</p>
                <p className="text-ink-light text-xs">抽象推理能力</p>
              </div>
            </div>
          </div>

          <p className="text-ink-light text-xs">
            共 {TOTAL_QUESTIONS} 题 · 完成后获得 60 分钟生长时间
          </p>

          <button
            onClick={() => {
              setState('testing');
              setSection('big-five');
            }}
            className="btn-primary w-full"
          >
            开始测评
          </button>

          <button
            onClick={() => router.push('/garden')}
            className="w-full text-sm text-ink-light underline hover:text-ink-gray"
          >
            回到花园
          </button>
        </div>
      </main>
    );
  }

  // ─── 结果页面 ───
  if (state === 'result' && results) {
    const report = buildReport(results.bigFive, results.ecrr, results.raven);
    return (
      <main className="min-h-screen bg-paper-white">
        <div className="max-w-lg mx-auto px-6 py-12 space-y-6">
          {/* 标题 */}
          <div className="text-center">
            <div className="text-5xl mb-4 animate-moon-rise">🌻</div>
            <h1 className="font-calligraphy text-2xl text-ink-black mb-2">
              你的测评报告
            </h1>
            <p className="text-ink-gray text-sm">{report.summary}</p>
          </div>

          {/* 标签 */}
          <div className="flex flex-wrap gap-2 justify-center">
            {report.allTags.map((tag, i) => (
              <span
                key={i}
                className="text-xs bg-paper-cream text-ink-gray px-3 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* 大五人格详细 */}
          <div className="garden-card space-y-4">
            <h2 className="font-medium text-ink-black text-base">性格画像</h2>
            {report.bigFive.paragraphs.map((p, i) => (
              <div key={i} className="text-sm text-ink-gray leading-relaxed whitespace-pre-line">
                {p}
              </div>
            ))}
          </div>

          {/* 依恋类型 */}
          <div className="garden-card space-y-3">
            <h2 className="font-medium text-ink-black text-base">依恋类型</h2>
            <p className="text-sm text-ink-gray leading-relaxed whitespace-pre-line">
              {report.attachment.text}
            </p>
          </div>

          {/* 瑞文推理 */}
          <div className="garden-card space-y-3">
            <h2 className="font-medium text-ink-black text-base">推理能力</h2>
            <p className="text-sm text-ink-gray leading-relaxed">
              {report.raven.text}
            </p>
          </div>

          {/* 匹配建议 */}
          <div className="garden-card border-l-4" style={{ borderLeftColor: '#8BA4B6' }}>
            <h2 className="font-medium text-ink-black text-sm mb-2">匹配参考</h2>
            <p className="text-sm text-ink-gray leading-relaxed">
              {report.matchSuggestion}
            </p>
          </div>

          <button
            onClick={() => router.push('/garden')}
            className="btn-primary w-full"
          >
            回到花园
          </button>
        </div>
      </main>
    );
  }

  // ─── 测试进行中 ───
  if (!currentQ) {
    return (
      <main className="min-h-screen bg-paper-white flex items-center justify-center">
        <p className="text-ink-light">加载中...</p>
      </main>
    );
  }

  const sectionNames: Record<TestSection, { name: string; short: string }> = {
    'big-five': { name: '大五人格', short: '性格' },
    ecrr: { name: '亲密关系体验', short: '关系' },
    raven: { name: '瑞文推理', short: '推理' },
  };

  const sectionDone = testProgress;
  const totalSections = 3;
  const isRaven = section === 'raven';

  // 计算整体进度
  let totalAnswered = 0;
  if (testProgress === 0) totalAnswered = qIndex;
  else if (testProgress === 1) totalAnswered = 50 + qIndex; // BigFive done
  else if (testProgress === 2) totalAnswered = 50 + 36 + qIndex; // BigFive+ECRR done
  const overallProgress = Math.min(totalAnswered / TOTAL_QUESTIONS, 1);

  return (
    <main className="min-h-screen bg-paper-white flex flex-col">
      {/* 顶部进度 */}
      <header className="pt-12 px-6 pb-2">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => router.push('/garden')}
            className="text-ink-light text-sm hover:text-ink-gray"
          >
            ← 退出
          </button>
          <span className="text-ink-light text-xs">
            {sectionNames[section].name} · {sectionDone + 1}/{totalSections}
          </span>
        </div>

        {/* 整体进度条 */}
        <div className="w-full bg-paper-aged rounded-full h-1 mb-3">
          <div
            className="h-1 rounded-full bg-sky-blue transition-all duration-500"
            style={{ width: `${overallProgress * 100}%` }}
          />
        </div>

        {/* 分段进度 */}
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-0.5 flex-1 rounded-full transition-colors ${
                i < sectionDone ? 'bg-garden-leaf' : i === sectionDone ? 'bg-sky-blue' : 'bg-paper-aged'
              }`}
            />
          ))}
        </div>

        {/* 注意力检测警告 */}
        {attentionFails >= 2 && (
          <p className="text-seal-red text-xs text-center mt-2 animate-parabola-in">
            注意：请认真阅读每道题
          </p>
        )}
      </header>

      {/* 题目区域 */}
      <div ref={scrollRef} className="flex-1 flex flex-col px-6 pt-6">
        {/* 瑞文：显示图案矩阵 */}
        {isRaven && currentQ.ravenOptions && (
          <div className="mb-8">
            <p className="text-ink-light text-xs mb-4 text-center">
              请在下列选项中选出最适合填入矩阵空白处的图形
            </p>
            {/* 3×3 矩阵 */}
            <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto mb-6">
              {RAVEN_QUESTIONS[currentQ.sourceId - 1]?.matrix.map((cell, i) => (
                <div
                  key={i}
                  className={`aspect-square rounded-lg flex items-center justify-center text-lg font-mono
                    ${cell === null
                      ? 'bg-ink-black/10 border-2 border-dashed border-ink-light'
                      : 'bg-paper-cream border border-paper-aged'
                    }`}
                >
                  {cell ?? '?'}
                </div>
              ))}
            </div>
            {/* 选项 */}
            <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
              {currentQ.ravenOptions.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => {
                    // 记录瑞文答案
                    setAnswers((prev) => ({
                      ...prev,
                      raven: { ...prev.raven, [currentQ.sourceId]: i },
                    }));
                    handleAnswer(i);
                  }}
                  className="garden-card text-center py-4 text-lg font-mono hover:shadow-md hover:bg-paper-cream/80 transition-all active:scale-95"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 非瑞文：显示文字题目 */}
        {!isRaven && (
          <>
            {/* 题目类型标签 */}
            <span className="text-xs text-sky-dark bg-sky-light/20 px-2 py-0.5 rounded-full self-start mb-4">
              {currentQ.isAttentionCheck ? '注意力检测' : sectionNames[section].short}
            </span>

            {/* 题号 */}
            <p className="text-ink-light text-xs mb-3">
              第 {totalAnswered + 1} 题 / 共 {TOTAL_QUESTIONS} 题
            </p>

            {/* 题目文字 */}
            <h1 className="text-lg font-medium text-ink-black leading-relaxed mb-8">
              {currentQ.isAttentionCheck ? (
                <span className="text-seal-red">{currentQ.text}</span>
              ) : (
                currentQ.text
              )}
            </h1>

            {/* 量表选择 */}
            <div className="flex-1 flex flex-col justify-end pb-8">
              <p className="text-ink-light text-xs mb-4 text-center">
                {currentQ.likert === '5' ? '请选择最符合你的选项' : '请选择最符合你的选项'}
              </p>
              <div className="space-y-2">
                {(currentQ.likert === '5' ? LIKERT_5 : LIKERT_7).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleAnswer(opt.value)}
                    disabled={animating}
                    className={`w-full text-left px-4 py-3 rounded-petal border transition-all duration-150
                      ${animating
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:border-sky-blue hover:bg-sky-light/10 active:scale-[0.98]'
                      }
                      border-paper-aged bg-white text-ink-black text-sm`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* 提示小字 */}
        <div className="pb-6 text-center">
          <p className="text-ink-light text-xs">
            {currentQ.isAttentionCheck
              ? '这是注意力检测题'
              : isRaven
              ? '选出你认为正确的图案'
              : '没有对错，真实最重要'}
          </p>
        </div>
      </div>
    </main>
  );
}
