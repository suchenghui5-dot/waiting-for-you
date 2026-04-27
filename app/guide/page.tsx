'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const STEPS = [
  {
    title: '欢迎',
    subtitle: '你的故事，从这里开始',
    content: (
      <div className="text-center space-y-6 px-4">
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-b from-garden-bloom to-garden-soil opacity-70" />
        <p className="text-ink-gray leading-relaxed text-sm">
          你好。
          <br />
          这里不是另一个交友软件。
          <br />
          这是一座花园。
        </p>
      </div>
    ),
  },
  {
    title: '不是等待',
    subtitle: '是主动选择不将就',
    content: (
      <div className="text-center space-y-6 px-4">
        <p className="text-ink-gray leading-relaxed text-sm">
          在这里，你不"刷"别人。
          <br />
          你了解自己，也被别人了解。
        </p>
        <p className="text-ink-gray leading-relaxed text-sm">
          匹配不是靠算法瞬间完成的事。
          <br />
          是两个人，都在准备好的时候，
          <br />
          恰好相遇。
        </p>
      </div>
    ),
  },
  {
    title: '种子与花园',
    subtitle: '你投入的每一分钟，都在生长',
    content: (
      <div className="text-center space-y-6 px-4">
        <div className="flex justify-center gap-3">
          {['🌰', '🌱', '🌿', '🌷', '🌻'].map((emoji, i) => (
            <span
              key={i}
              className="text-2xl animate-seed-grow"
              style={{ animationDelay: `${i * 0.3}s` }}
            >
              {emoji}
            </span>
          ))}
        </div>
        <p className="text-ink-gray leading-relaxed text-sm">
          开始的时候，你是一颗种子。
          <br />
          当你认真回答问题、完成测评，
          <br />
          你会看到自己慢慢破土、展叶、含苞。
        </p>
        <p className="text-ink-light text-xs">
          大约需要 12 小时的用心投入
          <br />
          和至少 5 天的自然等待
        </p>
      </div>
    ),
  },
  {
    title: '关于你',
    subtitle: '我们想知道怎么称呼你',
    content: null, // 特殊处理：输入姓名
  },
  {
    title: '一个约定',
    subtitle: '让这座花园更真实',
    content: (
      <div className="text-center space-y-6 px-4">
        <p className="text-ink-gray leading-relaxed text-sm">
          在这座花园里，我们做一个简单的约定：
        </p>
        <div className="bg-paper-cream rounded-garden p-5 space-y-3">
          <p className="text-sm text-ink-black">
            「我承诺使用真实照片」
          </p>
          <div className="border-t border-paper-aged" />
          <p className="text-sm text-ink-black">
            「我承诺认真对待每一次了解」
          </p>
          <div className="border-t border-paper-aged" />
          <p className="text-sm text-ink-black">
            「我承诺，如果不确定，会坦诚说'我还需要时间'」
          </p>
        </div>
      </div>
    ),
  },
  {
    title: '准备好了',
    subtitle: '种子已经落入了土壤',
    content: (
      <div className="text-center space-y-6 px-4">
        {/* 仪式动画：月相升起 */}
        <div className="relative w-32 h-32 mx-auto">
          {/* 背景月晕 */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-b from-garden-bloom/20 to-transparent animate-pulse" />
          {/* 月相 */}
          <div className="absolute inset-4 rounded-full bg-gradient-to-br from-garden-bloom to-garden-bud opacity-90
                          animate-moon-rise shadow-lg shadow-garden-bloom/30" />
        </div>
        <p className="text-ink-gray text-sm leading-relaxed">
          你已经准备好，开始这段旅程。
        </p>
        <p className="font-calligraphy text-lg text-ink-black">
          欢迎来到「等你」
        </p>
      </div>
    ),
  },
];

export default function GuidePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [name, setName] = useState('');
  const [isCeremony, setIsCeremony] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const touchStart = useRef<number | null>(null);

  const isStep4 = currentStep === 3; // 输入姓名步骤
  const isLastStep = currentStep === STEPS.length - 1;

  const goNext = useCallback(() => {
    if (isStep4 && !name.trim()) return;
    if (isLastStep && !isCeremony) {
      // 触发仪式动画
      setIsCeremony(true);
      return;
    }

    if (currentStep < STEPS.length - 1) {
      setDirection('next');
      setFadeOut(true);
      setTimeout(() => {
        setCurrentStep((s) => s + 1);
        setFadeOut(false);
      }, 200);
    } else {
      // 完成引导 → 跳转到花园主页
      router.push('/garden');
    }
  }, [currentStep, isStep4, name, isLastStep, isCeremony, router]);

  const goPrev = useCallback(() => {
    if (currentStep > 0) {
      setDirection('prev');
      setFadeOut(true);
      setTimeout(() => {
        setCurrentStep((s) => s - 1);
        setFadeOut(false);
      }, 200);
    }
  }, [currentStep]);

  // 仪式动画完成后自动跳转
  useEffect(() => {
    if (isCeremony) {
      const timer = setTimeout(() => {
        router.push('/garden');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isCeremony, router]);

  // 触摸滑动支持
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(diff) > 50) {
      if (diff < 0) goNext();
      else goPrev();
    }
    touchStart.current = null;
  };

  if (isCeremony) {
    return (
      <main className="min-h-screen bg-ink-black flex flex-col items-center justify-center px-6">
        {/* 仪式：屏幕暗下，月相升起 */}
        <div className="animate-moon-rise text-center">
          <div className="w-32 h-32 mx-auto mb-8 rounded-full bg-gradient-to-b from-garden-bloom to-garden-bud
                          shadow-2xl shadow-garden-bloom/40" />
          <h1 className="font-calligraphy text-3xl text-paper-white tracking-wider animate-fade-mist">
            等你
          </h1>
          <p className="mt-4 text-paper-white/60 text-sm animate-fade-mist" style={{ animationDelay: '1s' }}>
            {name ? `${name}，你的种子已经落入了土壤。` : '种子已经落入了土壤。'}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-paper-white flex flex-col">
      {/* 顶部进度条 */}
      <div className="pt-12 px-8 pb-4">
        <div className="flex gap-1.5 justify-center">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-500 ${
                i === currentStep
                  ? 'w-8 bg-ink-black'
                  : i < currentStep
                  ? 'w-3 bg-ink-light'
                  : 'w-3 bg-paper-aged'
              }`}
            />
          ))}
        </div>
      </div>

      {/* 内容区域 */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-6"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className={`w-full max-w-sm transition-all duration-200 ${
            fadeOut
              ? direction === 'next'
                ? 'opacity-0 -translate-x-4'
                : 'opacity-0 translate-x-4'
              : 'opacity-100 translate-x-0'
          }`}
        >
          {/* 标题 */}
          <div className="text-center mb-10">
            <h2 className="font-calligraphy text-2xl text-ink-black mb-2">
              {STEPS[currentStep].title}
            </h2>
            <p className="text-ink-light text-xs">
              {STEPS[currentStep].subtitle}
            </p>
          </div>

          {/* 内容 */}
          {isStep4 ? (
            <div className="text-center space-y-6 px-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-paper-cream flex items-center justify-center">
                <span className="text-3xl">🌱</span>
              </div>
              <p className="text-ink-gray text-sm">
                你希望我们怎么称呼你？
              </p>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="你的名字"
                className="input-field text-center text-lg font-calligraphy tracking-wider"
                maxLength={20}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && name.trim() && goNext()}
              />
              {name.trim() && (
                <p className="text-ink-light text-xs animate-parabola-in">
                  {name}，很高兴认识你。
                </p>
              )}
            </div>
          ) : (
            STEPS[currentStep].content
          )}
        </div>
      </div>

      {/* 底部按钮 */}
      <div className="px-8 pb-12">
        {isStep4 ? (
          <button
            onClick={goNext}
            disabled={!name.trim()}
            className={`btn-primary w-full py-4 text-lg ${
              !name.trim() ? 'opacity-30 cursor-not-allowed' : ''
            }`}
          >
            {name.trim() ? `好的，${name}` : '输入你的名字'}
          </button>
        ) : isLastStep ? (
          <button
            onClick={goNext}
            className="btn-primary w-full py-4 text-lg"
          >
            准备好了
          </button>
        ) : (
          <button
            onClick={goNext}
            className="btn-primary w-full py-4 text-lg"
          >
            继续
          </button>
        )}

        {currentStep > 0 && !isLastStep && (
          <button
            onClick={goPrev}
            className="w-full mt-3 text-sm text-ink-light underline hover:text-ink-gray"
          >
            返回
          </button>
        )}
      </div>
    </main>
  );
}
