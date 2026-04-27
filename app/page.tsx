import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-paper-white">
      {/* ═══════════════ 1. Hero ═══════════════ */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 pt-16 pb-12 relative overflow-hidden">
        {/* 装饰光晕 */}
        <div className="absolute -top-40 w-96 h-96 rounded-full bg-gradient-to-b from-garden-bloom/8 to-transparent" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-gradient-to-tr from-sky-blue/5 to-transparent" />

        {/* 月相动画 */}
        <div className="animate-moon-rise text-center mb-10 relative">
          <div className="w-28 h-28 mx-auto mb-6 rounded-full bg-gradient-to-b from-garden-bloom to-garden-bud opacity-80
                          shadow-2xl shadow-garden-bloom/20" />
          <h1 className="font-calligraphy text-5xl md:text-6xl text-ink-black tracking-wider mb-4">
            等你
          </h1>
          <p className="text-ink-gray text-base md:text-lg leading-relaxed max-w-sm mx-auto">
            不是等待。
            <br />
            是主动选择不将就。
          </p>
        </div>

        {/* CTA */}
        <div className="w-full max-w-sm space-y-3 relative z-10">
          <Link
            href="/register"
            className="block w-full py-4 text-center bg-ink-black text-paper-white rounded-petal text-lg font-medium
                       hover:bg-ink-gray transition-all active:scale-[0.98]"
          >
            进入花园
          </Link>
          <Link
            href="/login"
            className="block w-full py-4 text-center border border-ink-light/40 text-ink-black rounded-petal text-base
                       hover:border-ink-gray transition-all active:scale-[0.98]"
          >
            我已经有种子了
          </Link>
        </div>

        {/* 引语 */}
        <p className="mt-14 text-ink-light text-sm text-center leading-relaxed max-w-xs">
          &ldquo;两个真实的人，
          <br />
          在准备好的时候，
          <br />
          恰好相遇。&rdquo;
        </p>

        {/* 滚动提示 */}
        <div className="absolute bottom-6 animate-bounce text-ink-light text-lg opacity-40">
          ↓
        </div>
      </section>

      {/* ═══════════════ 2. 理念 ═══════════════ */}
      <section className="px-6 py-20 bg-gradient-to-b from-paper-white to-paper-cream/30">
        <div className="max-w-lg mx-auto text-center">
          <p className="text-xs text-ink-light tracking-widest mb-4">CONCEPT</p>
          <h2 className="font-calligraphy text-3xl text-ink-black mb-6">
            这不是另一个交友软件
          </h2>
          <p className="text-ink-gray text-sm leading-relaxed mb-4">
            在这里，你不刷别人。你了解自己，也被别人了解。
          </p>
          <p className="text-ink-gray text-sm leading-relaxed">
            匹配不是靠算法瞬间完成的事。是两个人，都在准备好的时候，恰好相遇。
          </p>
        </div>
      </section>

      {/* ═══════════════ 3. 运作方式 ═══════════════ */}
      <section className="px-6 py-20">
        <div className="max-w-lg mx-auto">
          <p className="text-xs text-ink-light tracking-widest text-center mb-4">HOW IT WORKS</p>
          <h2 className="font-calligraphy text-3xl text-ink-black text-center mb-12">
            在花园里，慢慢来
          </h2>

          <div className="space-y-8">
            {[
              { step: '01', icon: '🌰', title: '种下种子', desc: '进入花园，回答几个关于自己的问题。不用急，你有一整个花园的时间。' },
              { step: '02', icon: '🌱', title: '用心生长', desc: '完成人格测评、上传真实照片。每一次用心的投入，都会让你更了解自己。' },
              { step: '03', icon: '🌻', title: '自然花开', desc: '当你准备好了——大约需要 12 小时的用心投入——花会自然开。' },
              { step: '04', icon: '💌', title: '恰好相遇', desc: '创始人每周日手动匹配。你们会看到彼此的真诚，从一个问题开始对话。' },
            ].map((item) => (
              <div key={item.step} className="flex gap-5 items-start">
                <div className="shrink-0 w-12 h-12 rounded-full bg-paper-cream flex items-center justify-center">
                  <span className="text-xl">{item.icon}</span>
                </div>
                <div className="min-w-0 pt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] text-ink-light font-mono">{item.step}</span>
                    <h3 className="text-sm font-medium text-ink-black">{item.title}</h3>
                  </div>
                  <p className="text-xs text-ink-gray leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 4. 价值观 ═══════════════ */}
      <section className="px-6 py-20 bg-gradient-to-b from-paper-cream/30 to-paper-white">
        <div className="max-w-lg mx-auto">
          <p className="text-xs text-ink-light tracking-widest text-center mb-4">VALUES</p>
          <h2 className="font-calligraphy text-3xl text-ink-black text-center mb-12">
            三个约定
          </h2>

          <div className="space-y-4">
            {[
              { icon: '📸', title: '真实照片', desc: '不使用滤镜或旧照。我们希望通过照片看到的，是今天的你。' },
              { icon: '💬', title: '认真对话', desc: '不群发、不敷衍。每一次对话都值得被认真对待。' },
              { icon: '⏳', title: '坦诚说不', desc: '不确定的时候，坦诚说"我还需要时间"。不将就，也不勉强。' },
            ].map((item) => (
              <div key={item.title} className="garden-card">
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <h3 className="text-sm font-medium text-ink-black mb-0.5">{item.title}</h3>
                    <p className="text-xs text-ink-gray leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 5. FAQ ═══════════════ */}
      <section className="px-6 py-20">
        <div className="max-w-lg mx-auto">
          <p className="text-xs text-ink-light tracking-widest text-center mb-4">FAQ</p>
          <h2 className="font-calligraphy text-3xl text-ink-black text-center mb-12">
            常见问题
          </h2>

          <div className="space-y-3">
            {[
              { q: '需要付费吗？', a: '内测期间完全免费。正式上线后，基础功能永久免费。' },
              { q: '多久能匹配到人？', a: '创始人每周日手动匹配。完成冷却期（约 12 小时活跃 + 5 天）后进入匹配池。' },
              { q: '有 App 吗？', a: '目前是 Web 应用。在手机浏览器添加到主屏幕，体验和 App 一样。' },
              { q: '隐私安全吗？', a: '你的数据只用于匹配算法。未经允许，不会展示给任何人。' },
              { q: '需要邀请码吗？', a: '内测需要邀请码。早期用户每人有 3 个邀请码，可以邀请朋友。' },
            ].map((faq) => (
              <details key={faq.q} className="garden-card group open:border-ink-black/20 transition-all">
                <summary className="text-sm text-ink-black font-medium cursor-pointer list-none flex items-center justify-between py-1">
                  {faq.q}
                  <span className="text-ink-light text-xs transition-transform group-open:rotate-180">▼</span>
                </summary>
                <p className="text-xs text-ink-gray leading-relaxed mt-3 pt-3 border-t border-paper-aged">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 6. Final CTA ═══════════════ */}
      <section className="px-6 py-20 text-center bg-gradient-to-t from-paper-cream/30 to-paper-white">
        <div className="max-w-sm mx-auto">
          <div className="text-4xl mb-4">🌙</div>
          <h2 className="font-calligraphy text-3xl text-ink-black mb-4">
            准备好了吗？
          </h2>
          <p className="text-ink-gray text-sm leading-relaxed mb-8">
            你的故事，从一颗种子开始。
          </p>
          <Link
            href="/register"
            className="block w-full py-4 text-center bg-ink-black text-paper-white rounded-petal text-lg font-medium
                       hover:bg-ink-gray transition-all active:scale-[0.98]"
          >
            进入花园
          </Link>
          <p className="mt-4 text-ink-light text-xs">
            已有种子？<Link href="/login" className="underline hover:text-ink-gray">登录</Link>
          </p>
        </div>
      </section>

      {/* ═══════════════ 7. Footer ═══════════════ */}
      <footer className="px-6 py-10 text-center border-t border-paper-aged">
        <p className="font-calligraphy text-lg text-ink-black mb-2">等你</p>
        <p className="text-ink-light text-xs leading-relaxed">
          Waiting for You · 不是等待，是主动选择不将就
        </p>
        <p className="text-ink-light text-[10px] mt-4">
          内测阶段 · 100 人限量
        </p>
      </footer>
    </main>
  );
}
