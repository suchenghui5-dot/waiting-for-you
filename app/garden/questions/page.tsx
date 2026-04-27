'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { loadGarden, earnFromAnswer, getGardenDisplay } from '@/lib/garden-store';
import { matchFeedback } from '@/lib/match-feedback';

/** 预设问题（对应数据库 open_questions 表） */
const QUESTIONS = [
  { id: 1, text: '你人生中最重要的一个转折点是什么？', type: 'required' as const },
  { id: 2, text: '你觉得什么样的人会让你感到安全？', type: 'required' as const },
  { id: 3, text: '你正在学习放下的一件事情是什么？', type: 'required' as const },
  { id: 4, text: '如果有一个完全自由的周末，你会怎么度过？', type: 'optional' as const },
  { id: 5, text: '有没有一本书/一部电影改变了你对爱情的理解？', type: 'optional' as const },
  { id: 6, text: '你最想让未来的伴侣知道的关于你的一件事是什么？', type: 'optional' as const },
];

/** 预设反馈模板（对应 feedback_templates 表的关键词匹配） */
const FEEDBACK_TEMPLATES = [
  { trigger_keywords: ['离开', '告别', '失去', '放下'], template_text: '你提到了"离开"。有时候，离开一个地方，其实是走向一个自己。' },
  { trigger_keywords: ['改变', '转折', '决定'], template_text: '那个转折点——你回头看的时候，它是什么颜色的？' },
  { trigger_keywords: ['家庭', '父母', '妈妈', '爸爸'], template_text: '家庭是我们最早学会爱的地方。你在那里学到了什么？' },
  { trigger_keywords: ['梦想', '想', '希望', '未来'], template_text: '你的梦想里，住着一个什么样的自己？' },
  { trigger_keywords: ['害怕', '恐惧', '担心', '不敢'], template_text: '恐惧常常指向我们真正在意的东西。' },
  { trigger_keywords: ['坚持', '熬', '扛', '忍'], template_text: '坚持了很久——这个过程中你照顾过自己吗？' },
  { trigger_keywords: ['自己', '我', '了解'], template_text: '了解自己是一生的功课。你刚才写下的，是其中很美的一页。' },
  { trigger_keywords: ['时间', '等待', '慢慢'], template_text: '等待不是什么都不做。等待是在土壤里生长。' },
  { trigger_keywords: ['自由', '周末', '旅行'], template_text: '自由——你描述的那个周末里，藏着你对生活的向往。' },
  { trigger_keywords: ['真实', '真诚', '诚实'], template_text: '真实需要勇气。你在这里选择真实，这座花园也因此更好。' },
  { trigger_keywords: ['爱', '喜欢', '心动'], template_text: '爱——你写下这个字的时候，心里浮现的是什么画面？' },
];

function matchLocalFeedback(text: string): string {
  for (const tpl of FEEDBACK_TEMPLATES) {
    for (const kw of tpl.trigger_keywords) {
      if (text.includes(kw)) {
        return tpl.template_text;
      }
    }
  }
  return '谢谢你认真写下这段话。它很重要。';
}

export default function QuestionsPage() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [garden, setGarden] = useState(loadGarden());
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const questionStartRef = useRef<number>(Date.now()); // C5：记录每题的开始时间

  // 切换题目时重置计时
  useEffect(() => {
    questionStartRef.current = Date.now();
  }, [currentIndex]);
  const unanswered = QUESTIONS.filter(
    (q) => !garden.answeredQuestions.includes(q.id)
  );
  // 先排 required，后排 optional
  const sorted = [
    ...unanswered.filter((q) => q.type === 'required'),
    ...unanswered.filter((q) => q.type === 'optional'),
  ];
  const current = sorted[currentIndex];
  const isAllRequiredDone =
    QUESTIONS.filter((q) => q.type === 'required').every((q) =>
      garden.answeredQuestions.includes(q.id)
    );

  // 切换题目时聚焦输入框
  useEffect(() => {
    textareaRef.current?.focus();
  }, [currentIndex]);

  // 防作弊 C2：切走后重置计时，防止后台答题
  useEffect(() => {
    const onVisibility = () => {
      if (!document.hidden) {
        questionStartRef.current = Date.now();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const handleSubmit = async () => {
    if (!current || !answer.trim() || submitting) return;

    // 防作弊 C5：每题至少停留 3 秒
    const elapsed = (Date.now() - questionStartRef.current) / 1000;
    if (elapsed < 3) {
      await new Promise((r) => setTimeout(r, (3 - elapsed) * 1000));
    }

    setSubmitting(true);

    // 模拟短暂延迟（给人"提交"的感觉）
    await new Promise((r) => setTimeout(r, 600));

    // 获取反馈
    const fb = matchLocalFeedback(answer);

    // 保存
    const updated = earnFromAnswer(garden, current.id);
    setGarden(updated);
    setFeedback(fb);

    setSubmitting(false);
  };

  const handleNext = () => {
    setFeedback(null);
    setAnswer('');

    if (currentIndex < sorted.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setDone(true);
    }
  };

  // 全部答完
  if (done || sorted.length === 0) {
    const display = getGardenDisplay(garden);
    return (
      <main className="min-h-screen bg-paper-white flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="text-6xl animate-seed-grow">🌱</div>
          <h1 className="font-calligraphy text-2xl text-ink-black">
            完成！
          </h1>
          <p className="text-ink-gray text-sm leading-relaxed">
            你已经回答了所有问题。
            <br />
            每道题都让你的种子更接近土壤。
          </p>

          <div className="garden-card">
            <p className="text-ink-black font-medium text-lg">
              {display.stageNameCN}
            </p>
            <div className="w-full bg-paper-aged rounded-full h-1.5 mt-3">
              <div
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: `${display.totalProgress * 100}%`,
                  backgroundColor: display.color,
                }}
              />
            </div>
            <p className="text-ink-light text-xs mt-2">
              共获得 {garden.growthMinutes} 分钟生长 · 第 {garden.activeDays} 天
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

  // 当前已回答完显示反馈
  if (feedback) {
    return (
      <main className="min-h-screen bg-paper-white flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm text-center space-y-6 animate-parabola-in">
          <div className="text-4xl">💬</div>

          <div className="garden-card">
            <p className="text-ink-gray text-sm leading-relaxed italic">
              &ldquo;{feedback}&rdquo;
            </p>
          </div>

          <p className="text-ink-light text-xs">
            +15 分钟生长时间
          </p>

          <button
            onClick={handleNext}
            className="btn-primary w-full"
          >
            {currentIndex < sorted.length - 1 ? '下一题' : '查看结果'}
          </button>
        </div>
      </main>
    );
  }

  // 没有更多未答题
  if (!current) {
    return (
      <main className="min-h-screen bg-paper-white flex flex-col items-center justify-center px-6">
        <div className="text-center space-y-4">
          <p className="text-ink-gray">所有问题已回答</p>
          <button onClick={() => router.push('/garden')} className="btn-primary">
            回到花园
          </button>
        </div>
      </main>
    );
  }

  const total = unanswered.length;
  const doneCount = QUESTIONS.length - total;

  return (
    <main className="min-h-screen bg-paper-white flex flex-col">
      {/* 顶部 */}
      <header className="pt-12 px-6 pb-2">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => router.push('/garden')}
            className="text-ink-light text-sm hover:text-ink-gray"
          >
            ← 花园
          </button>
          <span className="text-ink-light text-xs">
            {doneCount + currentIndex + 1} / {QUESTIONS.length}
          </span>
        </div>

        {/* 进度条 */}
        <div className="w-full bg-paper-aged rounded-full h-1">
          <div
            className="h-1 rounded-full bg-garden-leaf transition-all duration-500"
            style={{
              width: `${((doneCount + currentIndex) / QUESTIONS.length) * 100}%`,
            }}
          />
        </div>
      </header>

      {/* 题目内容 */}
      <div className="flex-1 flex flex-col px-6 pt-8">
        <div className="flex-1">
          {/* 类型标签 */}
          <span
            className={`inline-block text-xs px-2 py-0.5 rounded-full mb-4 ${
              current.type === 'required'
                ? 'bg-seal-red/10 text-seal-red'
                : 'bg-sky-light/30 text-sky-dark'
            }`}
          >
            {current.type === 'required' ? '必答' : '选答'}
          </span>

          <h1 className="text-xl font-medium text-ink-black leading-relaxed mb-6">
            {current.text}
          </h1>

          {/* 输入区域 */}
          <textarea
            ref={textareaRef}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="写下你想说的话..."
            className="input-field min-h-[160px] resize-none text-sm leading-relaxed"
            maxLength={1000}
            disabled={submitting}
          />

          <div className="flex justify-between mt-2">
            <p className="text-ink-light text-xs">
              {answer.length > 0
                ? `${answer.length}/1000 · 最少 10 个字`
                : '写下你的真实想法，没有标准答案'}
            </p>
            <p className="text-ink-light text-xs">
              +15 分钟生长
            </p>
          </div>

          {/* 必答提示 */}
          {current.type === 'required' && !isAllRequiredDone && (
            <p className="text-ink-light text-xs mt-4 text-center">
              完成 3 道必答后，可解锁人格测评
            </p>
          )}
        </div>

        {/* 提交按钮 */}
        <div className="pb-12">
          <button
            onClick={handleSubmit}
            disabled={answer.trim().length < 10 || submitting}
            className={`btn-primary w-full py-4 text-lg ${
              answer.trim().length < 10 || submitting
                ? 'opacity-30 cursor-not-allowed'
                : ''
            }`}
          >
            {submitting ? '提交中...' : '写下这段话'}
          </button>
          {answer.trim().length > 0 && answer.trim().length < 10 && (
            <p className="text-seal-red text-xs text-center mt-2">
              再多写一点吧（至少 10 个字）
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
