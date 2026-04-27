'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  loadGarden,
  getCurrentMatch,
  decideMatch,
  type MatchData,
} from '@/lib/garden-store';

type ViewState = 'loading' | 'no-match' | 'pending' | 'decided-accept' | 'decided-skip' | 'mutual' | 'history';

export default function MatchPage() {
  const router = useRouter();
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [match, setMatch] = useState<MatchData | null>(null);
  const [matchHistory, setMatchHistory] = useState<MatchData[]>([]);
  const [deciding, setDeciding] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const garden = loadGarden();
    if (!garden.userId) {
      setViewState('no-match');
      return;
    }

    const current = getCurrentMatch(garden.userId);
    const history = garden.matchHistory || [];

    setMatch(current);
    setMatchHistory(history);

    if (!current) {
      setViewState('no-match');
    } else if (current.status === 'mutual') {
      setViewState('mutual');
    } else if (current.status === 'accepted') {
      setViewState('decided-accept');
    } else if (current.status === 'skipped') {
      setViewState('decided-skip');
    } else {
      setViewState('pending');
    }
  }, []);

  const handleDecide = (decision: 'accept' | 'skip') => {
    if (!match || deciding) return;
    setDeciding(true);

    const garden = loadGarden();
    const updated = decideMatch(garden.userId, match.id, decision);
    if (updated) {
      setMatch(updated);
      setViewState(decision === 'accept' ? 'decided-accept' : 'decided-skip');
    }
    setDeciding(false);
  };

  // ════════════ 加载中 ════════════
  if (viewState === 'loading') {
    return (
      <main className="min-h-screen bg-paper-white flex items-center justify-center">
        <p className="text-ink-light text-sm">加载中...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-paper-white pb-24">
      {/* 顶部 */}
      <header className="pt-12 pb-4 px-6">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push('/garden')} className="text-ink-light text-sm hover:text-ink-gray">
            ← 回到花园
          </button>
          {matchHistory.length > 0 && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-xs text-ink-light underline hover:text-ink-gray"
            >
              {showHistory ? '收起记录' : `历史匹配 (${matchHistory.length})`}
            </button>
          )}
        </div>
      </header>

      {/* ═══ 无匹配 ═══ */}
      {viewState === 'no-match' && (
        <div className="px-6 mt-12">
          <div className="garden-card text-center py-16">
            <div className="text-5xl mb-4">🌱</div>
            <h2 className="font-calligraphy text-xl text-ink-black mb-3">等待花开</h2>
            <p className="text-ink-gray text-sm leading-relaxed mb-6">
              你还未开花，或创始人正在为你寻找合适的匹配。
              <br />
              请耐心等待——有些相遇需要时间。
            </p>
            <div className="text-ink-light text-xs space-y-1">
              <p>完成冷却期后，创始人会在每周日为你匹配</p>
              <p>匹配后你会在这里看到对方的信息</p>
            </div>
          </div>
        </div>
      )}

      {/* ═══ 等待决定 ═══ */}
      {viewState === 'pending' && match && <MatchCard match={match} onDecide={handleDecide} deciding={deciding} />}

      {/* ═══ 已接受，等待对方 ═══ */}
      {viewState === 'decided-accept' && match && (
        <div className="px-6 mt-12">
          <div className="garden-card text-center py-12">
            <div className="text-5xl mb-4 animate-seed-grow">💌</div>
            <h2 className="font-calligraphy text-xl text-ink-black mb-3">你已经接受了</h2>
            <p className="text-ink-gray text-sm leading-relaxed mb-6">
              感谢你的信任。
              <br />
              现在等待对方的回应。
            </p>
            <div className="bg-paper-cream rounded-petal p-4 text-left space-y-2">
              <p className="text-xs text-ink-light">匹配回顾</p>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-ink-black">{match.matchedUserName}</span>
                {match.matchedCity && <span className="text-xs text-ink-light">· {match.matchedCity}</span>}
              </div>
              <p className="text-xs text-ink-gray italic">&ldquo;{match.curatorNote}&rdquo;</p>
            </div>
            <p className="text-ink-light text-xs mt-6">
              如果双方都接受，创始人会开启对话通道
            </p>
          </div>
        </div>
      )}

      {/* ═══ 已跳过 ═══ */}
      {viewState === 'decided-skip' && match && (
        <div className="px-6 mt-12">
          <div className="garden-card text-center py-12">
            <div className="text-5xl mb-4">🍂</div>
            <h2 className="font-calligraphy text-xl text-ink-black mb-3">已跳过此匹配</h2>
            <p className="text-ink-gray text-sm leading-relaxed mb-6">
              没有关系——不合适就是不合适。
              <br />
              下一次匹配会更好。
            </p>
            <button onClick={() => router.push('/garden')} className="btn-primary w-full">
              回到花园，继续生长
            </button>
          </div>
        </div>
      )}

      {/* ═══ 双向确认 ═══ */}
      {viewState === 'mutual' && match && (
        <div className="px-6 mt-12">
          <div className="garden-card text-center py-12 animate-parabola-in">
            <div className="text-6xl mb-4 animate-seed-grow" style={{ animationDuration: '2s' }}>🎉</div>
            <h2 className="font-calligraphy text-2xl text-garden-bloom mb-3">匹配成功！</h2>
            <p className="text-ink-gray text-sm leading-relaxed mb-6">
              你和 {match.matchedUserName} 都选择了接受。
              <br />
              这是双向的确认——你们可以开始对话了。
            </p>

            {/* 匹配详情 */}
            <div className="bg-paper-cream rounded-petal p-4 text-left space-y-3 mb-6">
              <div className="flex items-center gap-4">
                {match.matchedPhoto ? (
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-paper-aged shrink-0">
                    <img src={match.matchedPhoto} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-paper-aged flex items-center justify-center shrink-0">
                    <span className="text-2xl">👤</span>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-ink-black">{match.matchedUserName}</p>
                  {match.matchedCity && <p className="text-xs text-ink-light">{match.matchedCity}</p>}
                  {match.matchedBadges.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {match.matchedBadges.map((b, i) => (
                        <span key={i} className="text-[10px] bg-paper-aged px-1.5 py-0.5 rounded-full">
                          {b.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {match.matchedBio && (
                <p className="text-xs text-ink-gray leading-relaxed">{match.matchedBio}</p>
              )}
              <p className="text-xs text-ink-light italic border-t border-paper-aged pt-2">
                {match.curatorNote}
              </p>
            </div>

            {/* 破冰问题 */}
            <div className="garden-card mb-6">
              <p className="text-ink-light text-xs mb-2">从这个问题开始对话</p>
              <p className="text-ink-black text-sm font-medium leading-relaxed">{match.icebreaker}</p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => router.push('/garden/chat')}
                className="btn-primary w-full"
              >
                开始对话 💬
              </button>
              <button
                onClick={() => router.push('/garden')}
                className="w-full text-sm text-ink-light underline hover:text-ink-gray"
              >
                回到花园
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ 历史匹配 ═══ */}
      {showHistory && matchHistory.length > 0 && (
        <div className="px-6 mt-6">
          <h3 className="text-sm font-medium text-ink-black mb-3">历史匹配</h3>
          <div className="space-y-2">
            {matchHistory.map((m, i) => (
              <div key={i} className="garden-card flex items-center justify-between">
                <div>
                  <p className="text-sm text-ink-black">{m.matchedUserName}</p>
                  <p className="text-xs text-ink-light">{new Date(m.createdAt).toLocaleDateString('zh-CN')}</p>
                </div>
                <span className={`text-xs ${
                  m.status === 'mutual' ? 'text-seal-red' :
                  m.status === 'accepted' ? 'text-garden-leaf' :
                  'text-ink-light'
                }`}>
                  {m.status === 'mutual' ? '双向确认' :
                   m.status === 'accepted' ? '已接受' :
                   m.status === 'skipped' ? '已跳过' : '待决定'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

/** 匹配卡片（待决定状态） */
function MatchCard({
  match,
  onDecide,
  deciding,
}: {
  match: MatchData;
  onDecide: (d: 'accept' | 'skip') => void;
  deciding: boolean;
}) {
  return (
    <div className="px-6 mt-6 space-y-6">
      {/* 匹配信息 */}
      <div className="garden-card">
        <p className="text-ink-light text-xs mb-4 text-center">
          创始人认为你们可能合得来
        </p>

        {/* 对方信息 */}
        <div className="flex flex-col items-center text-center mb-6">
          {match.matchedPhoto ? (
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-paper-aged shadow-md mb-4">
              <img src={match.matchedPhoto} alt="" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-24 h-24 rounded-full bg-paper-aged flex items-center justify-center mb-4">
              <span className="text-4xl">👤</span>
            </div>
          )}

          <h2 className="text-xl font-calligraphy text-ink-black mb-1">{match.matchedUserName}</h2>

          {match.matchedCity && (
            <p className="text-xs text-ink-light mb-2">{match.matchedCity}</p>
          )}

          {match.matchedBadges.length > 0 && (
            <div className="flex gap-2 mb-3">
              {match.matchedBadges.map((b, i) => (
                <span key={i} className="text-xs bg-paper-cream px-2 py-0.5 rounded-full text-ink-light">
                  {b.label}
                </span>
              ))}
            </div>
          )}

          {match.matchedBio && (
            <p className="text-sm text-ink-gray leading-relaxed max-w-xs">{match.matchedBio}</p>
          )}
        </div>

        {/* 馆长笔记 */}
        <div className="bg-paper-cream rounded-petal p-4 mb-4">
          <p className="text-ink-light text-[10px] mb-1">创始人笔记</p>
          <p className="text-sm text-ink-black leading-relaxed italic">&ldquo;{match.curatorNote}&rdquo;</p>
        </div>
      </div>

      {/* 破冰问题 */}
      <div className="garden-card">
        <p className="text-ink-light text-xs mb-2">试试用这个问题开始了解对方</p>
        <p className="text-ink-black text-sm font-medium leading-relaxed">{match.icebreaker}</p>
      </div>

      {/* 决定按钮 */}
      <div className="space-y-3">
        <button
          onClick={() => onDecide('accept')}
          disabled={deciding}
          className="btn-primary w-full text-base py-4"
        >
          {deciding ? '处理中...' : '接受匹配'}
        </button>
        <button
          onClick={() => onDecide('skip')}
          disabled={deciding}
          className="w-full text-sm text-ink-light underline hover:text-ink-gray disabled:opacity-30"
        >
          跳过
        </button>
      </div>

      <p className="text-ink-light text-xs text-center leading-relaxed">
        双方都接受后将开启对话通道
        <br />
        跳过不代表不好，只是不适合现在的你
      </p>
    </div>
  );
}
