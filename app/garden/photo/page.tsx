'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { loadGarden, saveGarden } from '@/lib/garden-store';

type Stage = 'upload' | 'preview' | 'promise' | 'done';

export default function PhotoPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>('upload');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [promised, setPromised] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件');
      return;
    }

    // 检查文件大小（最大 5MB）
    if (file.size > 5 * 1024 * 1024) {
      setError('图片不能超过 5MB');
      return;
    }

    setError('');
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
      setStage('preview');
    };
    reader.readAsDataURL(file);
  };

  const handleConfirm = () => {
    if (!previewUrl) return;

    const data = loadGarden();
    data.photoDataUrl = previewUrl;

    // 如果已勾选承诺，保存并给予徽章
    if (promised) {
      data.photoPromise = true;
      data.hasBadge = true;
      const badge = { type: 'real-photo', label: '真实承诺', earnedAt: new Date().toISOString() };
      const existing = Array.isArray(data.badges) ? data.badges : [];
      if (!existing.some((b: any) => b.type === 'real-photo')) {
        data.badges = [...existing, badge];
      }
    }

    saveGarden(data);
    setStage('done');
  };

  const handleSkip = () => {
    router.push('/garden');
  };

  return (
    <main className="min-h-screen bg-paper-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center space-y-6">

        {/* ===== 上传阶段 ===== */}
        {stage === 'upload' && (
          <>
            <div className="text-5xl animate-seed-grow">📸</div>
            <h1 className="font-calligraphy text-2xl text-ink-black">上传照片</h1>
            <p className="text-ink-gray text-sm leading-relaxed">
              一张真实、近期的照片。
              <br />
              这是你给其他人的第一印象。
            </p>

            <div className="garden-card">
              <div
                onClick={() => fileRef.current?.click()}
                className="w-36 h-36 mx-auto rounded-full bg-paper-aged flex items-center justify-center
                           cursor-pointer hover:bg-paper-cream transition-colors border-2 border-dashed border-ink-light"
              >
                <span className="text-4xl text-ink-light">+</span>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
              <p className="text-ink-light text-xs mt-4">点击上传 · 支持 JPG/PNG · 最大 5MB</p>
            </div>

            {error && <p className="text-seal-red text-xs">{error}</p>}

            <div className="space-y-3">
              <div className="text-xs text-ink-light">
                没有 AI 检测·全凭你的真诚
              </div>
              <button onClick={handleSkip} className="w-full text-sm text-ink-light underline hover:text-ink-gray">
                跳过，稍后再传
              </button>
            </div>
          </>
        )}

        {/* ===== 预览阶段 ===== */}
        {stage === 'preview' && previewUrl && (
          <>
            <h1 className="font-calligraphy text-2xl text-ink-black">预览</h1>
            <p className="text-ink-gray text-sm">这是你要上传的照片吗？</p>

            <div className="w-48 h-48 mx-auto rounded-full overflow-hidden border-4 border-paper-aged shadow-md">
              <img src={previewUrl} alt="预览" className="w-full h-full object-cover" />
            </div>

            <div className="space-y-3">
              <button onClick={() => { setStage('upload'); setPreviewUrl(null); }} className="btn-secondary w-full">
                重新选择
              </button>
              <button onClick={() => setStage('promise')} className="btn-primary w-full">
                使用这张照片
              </button>
            </div>
          </>
        )}

        {/* ===== 承诺阶段 ===== */}
        {stage === 'promise' && (
          <>
            <div className="text-5xl">🤝</div>
            <h1 className="font-calligraphy text-2xl text-ink-black">一个承诺</h1>
            <p className="text-ink-gray text-sm leading-relaxed">
              在「等你」，我们相信真诚的力量。
            </p>

            <div className="garden-card text-left space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={promised}
                  onChange={(e) => setPromised(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-ink-black"
                />
                <span className="text-sm text-ink-gray leading-relaxed">
                  我承诺这是我自己真实的、近期的照片。
                </span>
              </label>

              <p className="text-xs text-ink-light pl-7">
                勾选后，你将获得<span className="text-ink-black font-medium">「真实承诺」</span>徽章。
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleConfirm}
                disabled={!promised}
                className={`btn-primary w-full ${!promised ? 'opacity-30 cursor-not-allowed' : ''}`}
              >
                {promised ? '确认并上传' : '请先勾选承诺'}
              </button>
              <button onClick={() => setStage('preview')} className="w-full text-sm text-ink-light underline hover:text-ink-gray">
                返回
              </button>
            </div>
          </>
        )}

        {/* ===== 完成阶段 ===== */}
        {stage === 'done' && (
          <>
            <div className="text-6xl animate-seed-grow">🌻</div>
            <h1 className="font-calligraphy text-2xl text-ink-black">上传成功</h1>

            <div className="garden-card space-y-3">
              {promised && (
                <div className="inline-block bg-garden-leaf/10 text-garden-leaf text-xs px-3 py-1 rounded-full font-medium">
                  🏅 真实承诺
                </div>
              )}
              <p className="text-ink-gray text-sm leading-relaxed">
                你的照片已保存。
                <br />
                当匹配成功时，对方会看到真实的你。
              </p>
            </div>

            <button onClick={() => router.push('/garden')} className="btn-primary w-full">
              回到花园
            </button>
          </>
        )}

      </div>
    </main>
  );
}
