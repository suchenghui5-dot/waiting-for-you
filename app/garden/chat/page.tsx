'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  loadGarden,
  getCurrentMatch,
  getChatMessages,
  sendChatMessage,
  simulateReply,
  getChatRemainingDays,
  isChatExpired,
  type ChatMessage,
} from '@/lib/garden-store';
import NvcModal from './nvc-modal';

type ChatState = 'loading' | 'no-match' | 'expired' | 'ready';

export default function ChatPage() {
  const router = useRouter();
  const [state, setState] = useState<ChatState>('loading');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [matchName, setMatchName] = useState('');
  const [matchPhoto, setMatchPhoto] = useState<string | null>(null);
  const [matchId, setMatchId] = useState('');
  const [icebreaker, setIcebreaker] = useState('');
  const [remainingDays, setRemainingDays] = useState(0);
  const [sending, setSending] = useState(false);
  const [showNvc, setShowNvc] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const garden = loadGarden();
    if (!garden.userId) {
      setState('no-match');
      return;
    }

    const match = getCurrentMatch(garden.userId);
    if (!match || match.status !== 'mutual') {
      setState('no-match');
      return;
    }

    if (isChatExpired(match.chatExpiresAt)) {
      setState('expired');
      return;
    }

    setMatchId(match.id);
    setMatchName(match.matchedUserName);
    setMatchPhoto(match.matchedPhoto);
    setIcebreaker(match.icebreaker);
    setRemainingDays(getChatRemainingDays(match.chatExpiresAt));
    setMessages(getChatMessages(match.id));
    setState('ready');
  }, []);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 聚焦输入框
  useEffect(() => {
    if (state === 'ready') inputRef.current?.focus();
  }, [state]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || sending) return;

    setSending(true);
    const sent = sendChatMessage(matchId, text);
    setMessages((prev) => [...prev, sent]);
    setInput('');

    // 模拟对方自动回复（MVP 本地模拟）
    setTimeout(() => {
      const replies = [
        `嗯，${text}，说起来我也想过这个问题...`,
        `哈哈，你这么说让我想到了另一件事。`,
        `有意思。你为什么这么想？`,
        `我明白你的意思。对我来说，感受不太一样。`,
        `这个话题挺好的，我之前没这么想过。`,
        `对，我也有类似的感受。`,
        `哦？展开说说？`,
      ];
      const replyText = replies[Math.floor(Math.random() * replies.length)];
      const reply = simulateReply(matchId, matchName, replyText);
      setMessages((prev) => [...prev, reply]);
      setSending(false);
    }, 1500 + Math.random() * 2000);
  };

  const handleNvcSend = (text: string, templateId: string) => {
    const sent = sendChatMessage(matchId, text, 'nvc');
    setMessages((prev) => [...prev, sent]);
    setShowNvc(false);

    // 模拟对方回复
    setTimeout(() => {
      const replies = [
        `谢谢你的坦诚，这对我很重要。`,
        `我收到了。我也想和你说说我的感受。`,
        `谢谢用这种方式表达，让我更容易理解。`,
        `嗯，我明白你的意思了。让我想想...`,
      ];
      const replyText = replies[Math.floor(Math.random() * replies.length)];
      const reply = simulateReply(matchId, matchName, replyText);
      setMessages((prev) => [...prev, reply]);
      setSending(false);
    }, 1500 + Math.random() * 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ─── 加载中 ───
  if (state === 'loading') {
    return (
      <main className="min-h-screen bg-paper-white flex items-center justify-center">
        <p className="text-ink-light text-sm">加载中...</p>
      </main>
    );
  }

  // ─── 无匹配 ───
  if (state === 'no-match') {
    return (
      <main className="min-h-screen bg-paper-white flex items-center justify-center px-6">
        <div className="text-center">
          <div className="text-5xl mb-4">💬</div>
          <h2 className="font-calligraphy text-xl text-ink-black mb-3">还没有开启的对话</h2>
          <p className="text-ink-gray text-sm leading-relaxed mb-6">
            只有双向确认的匹配才能开启对话通道。
            <br />
            完成匹配后，对话会在 7 天后关闭。
          </p>
          <button onClick={() => router.push('/garden')} className="btn-primary w-full max-w-xs">
            回到花园
          </button>
        </div>
      </main>
    );
  }

  // ─── 已过期 ───
  if (state === 'expired') {
    return (
      <main className="min-h-screen bg-paper-white flex items-center justify-center px-6">
        <div className="text-center">
          <div className="text-5xl mb-4">🍂</div>
          <h2 className="font-calligraphy text-xl text-ink-black mb-3">对话通道已关闭</h2>
          <p className="text-ink-gray text-sm leading-relaxed mb-6">
            7 天的对话窗口已经结束。
            <br />
            如果有缘，你们会在未来的匹配中再次相遇。
          </p>
          <button onClick={() => router.push('/garden')} className="btn-primary w-full max-w-xs">
            回到花园
          </button>
        </div>
      </main>
    );
  }

  // ─── 聊天界面 ───
  return (
    <main className="min-h-screen bg-paper-white flex flex-col">
      {/* 顶栏 */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-paper-aged">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => router.push('/garden')}
            className="text-ink-light hover:text-ink-black text-sm shrink-0"
          >
            ←
          </button>
          {matchPhoto ? (
            <div className="w-9 h-9 rounded-full overflow-hidden border border-paper-aged shrink-0">
              <img src={matchPhoto} alt="" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-full bg-paper-aged flex items-center justify-center shrink-0">
              <span className="text-sm">👤</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink-black truncate">{matchName}</p>
            {remainingDays <= 3 && (
              <p className="text-[10px] text-seal-red">
                对话通道将在 {remainingDays} 天后关闭
              </p>
            )}
          </div>
        </div>
      </header>

      {/* 消息区 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ maxHeight: 'calc(100vh - 140px)' }}>
        {/* 破冰提示（首条消息引导） */}
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">💌</div>
            <p className="text-ink-gray text-sm leading-relaxed mb-4">
              你们匹配成功了！
              <br />
              用这个问题开始你们的第一次对话吧：
            </p>
            <div className="garden-card text-left">
              <p className="text-xs text-ink-light mb-1">破冰问题</p>
              <p className="text-sm text-ink-black font-medium leading-relaxed italic">
                &ldquo;{icebreaker}&rdquo;
              </p>
            </div>
            <button
              onClick={() => {
                setInput(icebreaker);
                inputRef.current?.focus();
              }}
              className="mt-3 text-xs text-sky-blue underline hover:text-sky-dark"
            >
              用这个问题开始对话
            </button>
          </div>
        )}

        {/* 消息列表 */}
        {messages.map((msg) => {
          const isMe = msg.senderId === 'me';
          const time = new Date(msg.createdAt).toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
          });
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] ${isMe ? 'items-end' : 'items-start'}`}>
                {!isMe && (
                  <p className="text-[10px] text-ink-light mb-0.5 ml-1">{matchName}</p>
                )}
                <div
                  className={`rounded-petal px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                    isMe
                      ? 'bg-ink-black text-paper-white rounded-br-sm'
                      : 'bg-paper-cream text-ink-black rounded-bl-sm'
                  } ${msg.type === 'nvc' ? 'border-l-2 border-garden-bloom' : ''}`}
                >
                  {msg.type === 'nvc' && (
                    <span className="inline-block text-[10px] text-garden-bloom font-medium mb-1">
                      NVC 表达
                    </span>
                  )}
                  {msg.text}
                </div>
                <p className={`text-[10px] text-ink-light mt-0.5 ${isMe ? 'text-right mr-1' : 'ml-1'}`}>
                  {time}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />

        {/* 发送中指示 */}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-paper-cream rounded-petal rounded-bl-sm px-3.5 py-2">
              <span className="text-sm text-ink-light animate-pulse">对方正在输入...</span>
            </div>
          </div>
        )}
      </div>

      {/* 输入区 */}
      <div className="border-t border-paper-aged bg-white px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`给 ${matchName} 写句话...`}
            rows={1}
            maxLength={500}
            className="input-field flex-1 resize-none text-sm min-h-[40px] max-h-[120px] py-2.5"
          />
          <div className="flex flex-col gap-1.5 shrink-0">
            <button
              onClick={() => setShowNvc(true)}
              disabled={sending}
              className="px-2.5 py-2 rounded-petal text-xs border border-paper-aged text-ink-light hover:border-garden-bloom hover:text-garden-bloom transition-colors disabled:opacity-30"
              title="使用 NVC 模板发送"
            >
              NVC
            </button>
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className={`px-4 py-2 rounded-petal text-sm font-medium transition-all ${
                input.trim() && !sending
                  ? 'bg-ink-black text-paper-white hover:opacity-80'
                  : 'bg-paper-aged text-ink-light cursor-not-allowed'
              }`}
            >
              发送
            </button>
          </div>
        </div>
        <p className="text-[10px] text-ink-light mt-1.5 text-center">
          Enter 发送 · Shift+Enter 换行 · NVC 按钮使用结构化沟通 · 对话通道 {remainingDays} 天后关闭
        </p>
      </div>

      {/* NVC 模板弹窗 */}
      {showNvc && (
        <NvcModal
          matchName={matchName}
          onSend={handleNvcSend}
          onClose={() => setShowNvc(false)}
        />
      )}
    </main>
  );
}
