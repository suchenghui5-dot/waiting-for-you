import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-paper-white flex flex-col items-center justify-center px-6">
      {/* Logo + 月相动画 */}
      <div className="animate-moon-rise text-center mb-12">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-b from-garden-bloom to-garden-bud opacity-80" />
        <h1 className="font-calligraphy text-4xl text-ink-black tracking-wider">
          等你
        </h1>
        <p className="mt-3 text-ink-gray text-sm">
          不是等待。是主动选择不将就。
        </p>
      </div>

      {/* CTA */}
      <div className="w-full max-w-sm space-y-4">
        <Link
          href="/register"
          className="block w-full py-4 text-center bg-ink-black text-paper-white rounded-petal text-lg font-medium
                     hover:bg-ink-gray transition-colors"
        >
          进入花园
        </Link>
        <Link
          href="/login"
          className="block w-full py-4 text-center border border-ink-light text-ink-black rounded-petal text-lg
                     hover:border-ink-gray transition-colors"
        >
          我已经有种子了
        </Link>
      </div>

      {/* 底部标语 */}
      <p className="mt-16 text-ink-light text-xs text-center leading-relaxed">
        两个真实的人，<br />
        在准备好的时候，<br />
        恰好相遇。
      </p>

      <p className="mt-8 text-ink-light text-xs">
        需要邀请码？{' '}
        <Link href="/about" className="underline hover:text-ink-gray">
          了解「等你」
        </Link>
      </p>
    </main>
  );
}
