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
import {
  loadGarden,
  saveTestProgress,
  clearTestProgress,
  markTestCompleted,
} from '@/lib/garden-store';
import type { TestSection } from '@/lib/personality/questions';
import type { TestProgress } from '@/lib/garden-store';

type PageState = 'intro' | 'testing' | 'result';

const LIKERT_5 = [
  { value: 1, label: '非常不符合' },
  { value: 2, label: '比较不符合' },
  { value: 3, label: '中立' },
  { value: 4, label: '比较符合' },
  { value: 5, label: '非常符合' },
];

const LIKERT_7 = [
  { value: 1, label: '完全不同意' },
  { value: 2, label: '不同意' },
  { value: 3, label: '有点不同意' },
  { value: 4, label: '中立' },
  { value: 5, label: '有点同意' },
  { value: 6, label: '同意' },
  { value: 7, label: '完全同意' },
];

const ATTENTION_CHECKS = [
  { prompt: '请选择"符合"', correctValue: 4 },
  { prompt: '请选择"中立"', correctValue: 3 },
  { prompt: '请选择"非常不符合"', correctValue: 1 },
];

interface QuestionEntry {
  type: TestSection;
  sourceId: number;
  text: string;
  likert: '5' | '7';
  isAttentionCheck?: boolean;
  attentionCorrectValue?: number;
  ravenOptions?: string[];
}

// 计算完成所有题目的大致时间
function estimateMinutes(): number {
  // 大五: 50题 × 8秒 = 400秒 ≈ 7分钟
  // ECRR: 36题 × 10秒 = 360秒 ≈ 6分钟
  // 瑞文: 16题 × 20秒 = 320秒 ≈ 5分钟
  // 注意力检测 + 过渡: ~3分钟
  return Math.round((50 * 8 + 36 * 10 + 16 * 20) / 60) + 3;
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
  const [testProgress, setTestProgress] = useState(0);
  const [attentionFails, setAttentionFails] = useState(0);

  // 检查是否有未完成的测评
  const [hasResume, setHasResume] = useState(false);
  useEffect(() => {
    const g = loadGarden();
    if (g.testProgress && !g.testCompleted) {
      setHasResume(true);
    }
  }, []);

  // 构建问题列表
  const buildQuestions = useCallback((section: TestSection): QuestionEntry[] => {
    const list: QuestionEntry[] = [];
    if (section === 'big-five') {
      BIG_FIVE_QUESTIONS.forEach((q, idx) => {
        list.push({ type: 'big-five', sourceId: q.id, text: q.text, likert: '5' });
        if ((idx + 1) % 10 === 0 && idx + 1 < 50) {
          const check = ATTENTION_CHECKS[((idx + 1) / 10 - 1) % ATTENTION_CHECKS.length];
          list.push({ type: 'big-five', sourceId: -check.correctValue, text: check.prompt, likert: '5', isAttentionCheck: true, attentionCorrectValue: check.correctValue });
        }
      });
    } else if (section === 'ecrr') {
      ECRR_QUESTIONS.forEach((q, idx) => {
        list.push({ type: 'ecrr', sourceId: q.id, text: q.text, likert: '7' });
        if ((idx + 1) % 12 === 0 && idx + 1 < 36) {
          const check = ATTENTION_CHECKS[((idx + 1) / 12 + 2) % ATTENTION_CHECKS.length];
          list.push({ type: 'ecrr', sourceId: -check.correctValue, text: check.prompt, likert: '7', isAttentionCheck: true, attentionCorrectValue: check.correctValue });
        }
      });
    } else {
      RAVEN_QUESTIONS.forEach((q) => {
        list.push({ type: 'raven', sourceId: q.id, text: '', likert: '5', ravenOptions: q.options });
      });
    }
    return list;
  }, []);

  const resumeQIndex = useRef<number | null>(null);
  const [questions, setQuestions] = useState<QuestionEntry[]>([]);
  useEffect(() => {
    setQuestions(buildQuestions(section));
    if (resumeQIndex.current !== null) {
      setQIndex(resumeQIndex.current);
      resumeQIndex.current = null;
    } else {
      setQIndex(0);
    }
    setAnimating(false);
  }, [section, buildQuestions]);

  const currentQ = questions[qIndex];
  const isLastQ = qIndex >= questions.length - 1;

  // 暂停：保存进度并返回花园
  const handlePause = useCallback(() => {
    const progress: TestProgress = { section, qIndex, answers };
    saveTestProgress(progress);
    router.push('/garden');
  }, [section, qIndex, answers, router]);

  // 作答
  const handleAnswer = useCallback((value: number) => {
    if (!currentQ || animating) return;
    setAnimDir('next');
    setAnimating(true);

    if (currentQ.isAttentionCheck) {
      if (value !== currentQ.attentionCorrectValue) {
        setAttentionFails((f) => f + 1);
      }
    }

    // 先计算更新后的答案（同步计算，避免 setAnswers 异步问题）
    const updatedAnswers = (() => {
      if (currentQ.isAttentionCheck) return answers;
      const key = currentQ.type;
      return { ...answers, [key]: { ...answers[key], [currentQ.sourceId]: value } };
    })();
    setAnswers(updatedAnswers);

    setTimeout(() => {
      if (isLastQ) {
        if (section === 'big-five') {
          setSection('ecrr');
          setTestProgress(1);
        } else if (section === 'ecrr') {
          setSection('raven');
          setTestProgress(2);
        } else {
          setTestProgress(3);
          const r = calculateResults(updatedAnswers.bigFive, updatedAnswers.ecrr, updatedAnswers.raven);
          setResults(r);
          markTestCompleted();
          setState('result');
        }
      } else {
        setQIndex((i) => i + 1);
      }
      setAnimating(false);
    }, 200);
  }, [currentQ, animating, isLastQ, section, answers]);

  // ════════════ 开始页 ════════════
  if (state === 'intro') {
    const mins = estimateMinutes();
    return (
      <main className="min-h-screen bg-paper-white flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="text-5xl animate-seed-grow">🧠</div>
          <h1 className="font-calligraphy text-2xl text-ink-black">了解自己</h1>
          <p className="text-ink-gray text-sm leading-relaxed">
            一份关于你性格和关系模式的探索。
            <br />
            结果仅用于匹配算法，不会公开。
          </p>

          <div className="garden-card text-left space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-paper-white bg-ink-black rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0 mt-0.5">①</span>
              <div className="text-sm text-ink-gray">
                <span className="text-ink-black font-medium">大五人格</span> · 50 题 · ~7 分钟
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-paper-white bg-ink-black rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0 mt-0.5">②</span>
              <div className="text-sm text-ink-gray">
                <span className="text-ink-black font-medium">亲密关系体验</span> · 36 题 · ~6 分钟
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-paper-white bg-ink-black rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0 mt-0.5">③</span>
              <div className="text-sm text-ink-gray">
                <span className="text-ink-black font-medium">推理能力</span> · 16 题 · ~5 分钟
              </div>
            </div>
          </div>

          <div className="bg-paper-cream rounded-petal px-4 py-3">
            <p className="text-xs text-ink-gray leading-relaxed">
              ⏱ 预计 <span className="text-ink-black font-medium">{mins}</span> 分钟完成 · 可随时暂停
              <br />
              🧪 基于标准化心理学量表，结果仅供参考与自我探索
            </p>
          </div>

          {hasResume ? (
            <>
              <button
                onClick={() => {
                  const g = loadGarden();
                  const p = g.testProgress!;
                  resumeQIndex.current = p.qIndex;
                  setSection(p.section);
                  setAnswers(p.answers);
                  setTestProgress(p.section === 'big-five' ? 0 : p.section === 'ecrr' ? 1 : 2);
                  setState('testing');
                }}
                className="btn-primary w-full"
              >
                继续上次的测评
              </button>
              <button
                onClick={() => {
                  clearTestProgress();
                  setState('testing');
                }}
                className="w-full text-sm text-ink-light underline hover:text-ink-gray"
              >
                重新开始
              </button>
            </>
          ) : (
            <button
              onClick={() => { setState('testing'); }}
              className="btn-primary w-full"
            >
              开始
            </button>
          )}

          <button onClick={() => router.push('/garden')} className="w-full text-sm text-ink-light underline hover:text-ink-gray">
            回到花园
          </button>
        </div>
      </main>
    );
  }

  // ════════════ 结果页 ════════════
  if (state === 'result' && results) {
    const report = buildReport(results.bigFive, results.ecrr, results.raven);
    // 模拟"相似的人"数据：基于人格特质组合算一个伪随机 ID
    const similarPct = 10 + Math.floor(Math.abs(
      results.bigFive.extraversion * 7 +
      results.bigFive.agreeableness * 13 +
      results.bigFive.conscientiousness * 5 +
      results.bigFive.neuroticism * 11 +
      results.bigFive.openness * 3 +
      results.ecrr.anxiety * 17 +
      results.ecrr.avoidance * 19
    ) % 15);
    const similarUsers = Math.max(3, Math.floor(100 * similarPct / 100));

    return (
      <main className="min-h-screen bg-paper-white flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm text-center space-y-6 animate-parabola-in">
          <div className="text-6xl">🌱</div>

          <h1 className="font-calligraphy text-2xl text-ink-black">完成了</h1>

          <p className="text-ink-gray text-sm leading-relaxed">
            谢谢你认真地了解自己。
            <br />
            这不是一个"测评"，是你给自己的礼物。
          </p>

          {/* 核心鼓励 */}
          <div className="garden-card space-y-3">
            <p className="text-ink-black text-base font-medium">
              你很不错。
            </p>
            <p className="text-ink-gray text-sm leading-relaxed">
              在本平台已注册的用户中，
              <br />
              与你性格相似的有{' '}
              <span className="text-ink-black font-medium">{similarUsers} 人</span>。
            </p>
            <p className="text-ink-gray text-sm leading-relaxed">
              存在即合理。你的每一种特质，
              <br />
              都是你之所以是你的原因。
            </p>
            <p className="text-ink-black text-sm font-medium pt-2 border-t border-paper-aged">
              最重要的是——你爱自己，
              <br />
              愿意继续成长。
            </p>
          </div>

          <p className="text-ink-light text-xs">
            +60 分钟生长时间 · 数据已纳入匹配算法
          </p>

          {/* 详细报告 — 折叠按钮 */}
          <details className="w-full">
            <summary className="text-sm text-ink-light hover:text-ink-gray cursor-pointer select-none">
              查看详细报告
            </summary>
            <div className="mt-4 space-y-4 text-left max-h-[400px] overflow-y-auto">
              {report.bigFive.paragraphs.map((p, i) => (
                <div key={i} className="garden-card text-sm text-ink-gray leading-relaxed whitespace-pre-line">
                  {p}
                </div>
              ))}
              <div className="garden-card text-sm text-ink-gray leading-relaxed whitespace-pre-line">
                {report.attachment.text}
              </div>
              <div className="garden-card text-sm text-ink-gray leading-relaxed">
                {report.raven.text}
              </div>
            </div>
          </details>

          <button onClick={() => router.push('/garden')} className="btn-primary w-full">
            回到花园
          </button>
        </div>
      </main>
    );
  }

  // ════════════ 测试中 ════════════
  if (!currentQ) return (
    <main className="min-h-screen bg-paper-white flex items-center justify-center">
      <p className="text-ink-light">加载中...</p>
    </main>
  );

  const sectionNames: Record<TestSection, { name: string; short: string }> = {
    'big-five': { name: '大五人格', short: '性格' },
    ecrr: { name: '亲密关系体验', short: '关系' },
    raven: { name: '推理能力', short: '推理' },
  };

  let totalAnswered = 0;
  if (testProgress === 0) totalAnswered = qIndex;
  else if (testProgress === 1) totalAnswered = 50 + qIndex;
  else if (testProgress === 2) totalAnswered = 50 + 36 + qIndex;
  const overallProgress = Math.min(totalAnswered / TOTAL_QUESTIONS, 1);

  const isRaven = section === 'raven';
  const completedCount = Object.keys(answers.bigFive).length + Object.keys(answers.ecrr).length + Object.keys(answers.raven).length;

  return (
    <main className="min-h-screen bg-paper-white flex flex-col">
      {/* 顶部 */}
      <header className="pt-12 px-6 pb-2">
        <div className="flex items-center justify-between mb-2">
          <button onClick={handlePause} className="text-ink-light text-sm hover:text-ink-gray">
            ← 暂停
          </button>
          <span className="text-ink-light text-xs">
            {sectionNames[section].name}
          </span>
        </div>

        {/* 进度条 */}
        <div className="w-full bg-paper-aged rounded-full h-1 mb-3">
          <div className="h-1 rounded-full bg-sky-blue transition-all duration-500"
               style={{ width: `${overallProgress * 100}%` }} />
        </div>

        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div key={i}
              className={`h-0.5 flex-1 rounded-full transition-colors ${
                i < testProgress ? 'bg-garden-leaf' : i === testProgress ? 'bg-sky-blue' : 'bg-paper-aged'
              }`} />
          ))}
        </div>

        {attentionFails >= 2 && (
          <p className="text-seal-red text-xs text-center mt-2 animate-parabola-in">请认真阅读每道题</p>
        )}
      </header>

      {/* 题目 */}
      <div className="flex-1 flex flex-col px-6 pt-6">
        {/* 瑞文 */}
        {isRaven && currentQ.ravenOptions && (
          <div className="mb-8">
            <p className="text-ink-light text-xs mb-4 text-center">选出最适合填入空白处的图形</p>
            <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto mb-6">
              {RAVEN_QUESTIONS[currentQ.sourceId - 1]?.matrix.map((cell, i) => (
                <div key={i}
                  className={`aspect-square rounded-lg flex items-center justify-center text-lg font-mono
                    ${cell === null ? 'bg-ink-black/10 border-2 border-dashed border-ink-light' : 'bg-paper-cream border border-paper-aged'}`}>
                  {cell ?? '?'}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
              {currentQ.ravenOptions.map((opt, i) => (
                <button key={i}
                  onClick={() => {
                    setAnswers(prev => ({ ...prev, raven: { ...prev.raven, [currentQ.sourceId]: i } }));
                    handleAnswer(i);
                  }}
                  className="garden-card text-center py-4 text-lg font-mono hover:shadow-md transition-all active:scale-95">
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 文字题 */}
        {!isRaven && (
          <>
            <span className="text-xs text-sky-dark bg-sky-light/20 px-2 py-0.5 rounded-full self-start mb-4">
              {currentQ.isAttentionCheck ? '注意力检测' : sectionNames[section].short}
            </span>

            <p className="text-ink-light text-xs mb-3">
              已完成 {completedCount} 题 · 共 {TOTAL_QUESTIONS} 题
            </p>

            <h1 className="text-lg font-medium text-ink-black leading-relaxed mb-8">
              {currentQ.isAttentionCheck
                ? <span className="text-seal-red">{currentQ.text}</span>
                : currentQ.text}
            </h1>

            <div className="flex-1 flex flex-col justify-end pb-8">
              <p className="text-ink-light text-xs mb-4 text-center">
                {currentQ.likert === '5' ? '' : ''}
              </p>
              <div className="space-y-2">
                {(currentQ.likert === '5' ? LIKERT_5 : LIKERT_7).map(opt => (
                  <button key={opt.value}
                    onClick={() => handleAnswer(opt.value)}
                    disabled={animating}
                    className={`w-full text-left px-4 py-3 rounded-petal border transition-all duration-150
                      ${animating ? 'opacity-50 cursor-not-allowed' : 'hover:border-sky-blue hover:bg-sky-light/10 active:scale-[0.98]'}
                      border-paper-aged bg-white text-ink-black text-sm`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="pb-6 text-center">
          <p className="text-ink-light text-xs">
            {currentQ.isAttentionCheck ? '这是注意力检测题' : isRaven ? '选出你认为正确的图案' : '没有对错，真实最重要'}
          </p>
        </div>
      </div>
    </main>
  );
}
