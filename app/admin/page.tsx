'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  loadSharedUsers,
  createMatch,
  getCurrentMatch,
  confirmMutual,
  type SharedUserData,
  type MatchData,
} from '@/lib/garden-store';
import { getNextDefaultQuestion } from '@/lib/icebreaker';

type Tab = 'users' | 'match' | 'history';

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('users');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password === (process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123')) {
      setAuthenticated(true);
    } else {
      setError('密码错误');
    }
  };

  if (!authenticated) {
    return (
      <main className="min-h-screen bg-paper-white flex items-center justify-center px-6">
        <form onSubmit={handleLogin} className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-2">
            <h1 className="font-calligraphy text-3xl text-ink-black">花园管理</h1>
            <p className="text-sm text-ink-gray">请输入管理密码</p>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="密码"
            className="input-field text-center"
            autoFocus
          />
          {error && <p className="text-seal-red text-sm text-center">{error}</p>}
          <button type="submit" className="btn-primary w-full">进入管理</button>
        </form>
      </main>
    );
  }

  return <AdminDashboard />;
}

function AdminDashboard() {
  const [users, setUsers] = useState<SharedUserData[]>([]);
  const [selectedA, setSelectedA] = useState<string>('');
  const [selectedB, setSelectedB] = useState<string>('');
  const [curatorNote, setCuratorNote] = useState('');
  const [icebreaker, setIcebreaker] = useState('');
  const [matchResult, setMatchResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('users');

  const loadUsers = useCallback(() => {
    setUsers(loadSharedUsers());
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // 自动刷新（每 3 秒）
  useEffect(() => {
    const interval = setInterval(loadUsers, 3000);
    return () => clearInterval(interval);
  }, [loadUsers]);

  const bloomedUsers = users.filter((u) => u.coolingCompleted);
  const pendingMatch = users.filter((u) => u.coolingCompleted && !u.matchId);
  const mutualCount = users.filter((u) => {
    if (!u.matchId) return false;
    const m = getCurrentMatch(u.id);
    return m?.status === 'mutual';
  }).length / 2;

  const handleGenerateIcebreaker = () => {
    setIcebreaker(getNextDefaultQuestion());
  };

  const handleCreateMatch = () => {
    setMatchResult(null);
    if (!selectedA || !selectedB || !curatorNote || !icebreaker) {
      setMatchResult({ ok: false, msg: '请填写完整信息' });
      return;
    }
    if (selectedA === selectedB) {
      setMatchResult({ ok: false, msg: '不能匹配同一个用户' });
      return;
    }

    const result = createMatch(selectedA, selectedB, curatorNote, icebreaker);
    if (result) {
      setMatchResult({
        ok: true,
        msg: `匹配成功！${result.userAMatch.matchedUserName} ↔ ${result.userBMatch.matchedUserName}`,
      });
      setSelectedA('');
      setSelectedB('');
      setCuratorNote('');
      setIcebreaker('');
      loadUsers();
    } else {
      setMatchResult({ ok: false, msg: '匹配失败，请检查用户数据' });
    }
  };

  return (
    <main className="min-h-screen bg-paper-white">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-calligraphy text-2xl text-ink-black">花园管理</h1>
          <span className="text-xs text-ink-light bg-paper-cream px-3 py-1 rounded-full">创始人模式</span>
        </div>

        {/* 概览卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          <div className="garden-card text-center py-4">
            <p className="text-ink-light text-xs mb-1">总用户</p>
            <p className="text-xl font-medium text-ink-black">{users.length}</p>
          </div>
          <div className="garden-card text-center py-4">
            <p className="text-ink-light text-xs mb-1">已开花</p>
            <p className="text-xl font-medium text-garden-bloom">{bloomedUsers.length}</p>
          </div>
          <div className="garden-card text-center py-4">
            <p className="text-ink-light text-xs mb-1">待匹配</p>
            <p className="text-xl font-medium text-sky-blue">{pendingMatch.length}</p>
          </div>
          <div className="garden-card text-center py-4">
            <p className="text-ink-light text-xs mb-1">已匹配</p>
            <p className="text-xl font-medium text-garden-leaf">
              {bloomedUsers.filter((u) => u.matchId).length / 2}
            </p>
          </div>
          <div className="garden-card text-center py-4">
            <p className="text-ink-light text-xs mb-1">双向确认</p>
            <p className="text-xl font-medium text-seal-red">{mutualCount}</p>
          </div>
        </div>

        {/* Tab 导航 */}
        <div className="flex gap-4 mb-6 border-b border-paper-aged">
          {[
            { key: 'users' as Tab, label: '用户列表' },
            { key: 'match' as Tab, label: '手动匹配' },
            { key: 'history' as Tab, label: '匹配记录' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-2 text-sm border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-ink-black text-ink-black font-medium'
                  : 'border-transparent text-ink-light hover:text-ink-gray'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── Tab: 用户列表 ─── */}
        {activeTab === 'users' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-ink-light text-xs border-b border-paper-aged">
                  <th className="text-left py-2 pr-4">用户</th>
                  <th className="text-center py-2 px-2">冷却期</th>
                  <th className="text-center py-2 px-2">测评</th>
                  <th className="text-center py-2 px-2">照片</th>
                  <th className="text-center py-2 px-2">徽章</th>
                  <th className="text-center py-2 px-2">匹配</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-ink-light text-xs">
                      暂无用户数据 — 新用户注册后会自动出现
                    </td>
                  </tr>
                )}
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-paper-aged/50 hover:bg-paper-cream/30">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-ink-black">{u.name}</span>
                        <span className="text-ink-light text-[10px] font-mono">{u.id.slice(-6)}</span>
                      </div>
                    </td>
                    <td className="text-center py-3 px-2">
                      {u.coolingCompleted ? (
                        <span className="text-garden-bloom text-xs">✅ 已开花</span>
                      ) : (
                        <span className="text-ink-light text-xs">
                          {u.coolingMinutes}m / {u.activeDays}d
                        </span>
                      )}
                    </td>
                    <td className="text-center py-3 px-2">
                      <span className={`text-xs ${u.testCompleted ? 'text-garden-leaf' : 'text-ink-light'}`}>
                        {u.testCompleted ? '✅' : '—'}
                      </span>
                    </td>
                    <td className="text-center py-3 px-2">
                      <span className={`text-xs ${u.photoDataUrl ? 'text-garden-leaf' : 'text-ink-light'}`}>
                        {u.photoDataUrl ? '✅' : '—'}
                      </span>
                    </td>
                    <td className="text-center py-3 px-2">
                      <span className="text-xs text-ink-light">
                        {u.badges?.length || 0}
                      </span>
                    </td>
                    <td className="text-center py-3 px-2">
                      {u.matchId ? (
                        <span className="text-sky-blue text-xs">已匹配</span>
                      ) : u.coolingCompleted ? (
                        <span className="text-ink-light text-xs">待匹配</span>
                      ) : (
                        <span className="text-ink-light text-xs" style={{ opacity: 0.3 }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-ink-light text-[10px] mt-4 text-center">
              数据自动刷新 · 共 {users.length} 人 · 已开花 {bloomedUsers.length} 人
            </p>
          </div>
        )}

        {/* ─── Tab: 手动匹配 ─── */}
        {activeTab === 'match' && (
          <div className="max-w-lg space-y-6">
            {matchResult && (
              <div className={`px-4 py-3 rounded-petal text-sm ${
                matchResult.ok ? 'bg-garden-leaf/10 text-garden-leaf' : 'bg-seal-red/10 text-seal-red'
              }`}>
                {matchResult.msg}
              </div>
            )}

            {/* 选择用户 A */}
            <div>
              <label className="text-xs text-ink-light mb-2 block">用户 A</label>
              <select
                value={selectedA}
                onChange={(e) => setSelectedA(e.target.value)}
                className="input-field w-full"
              >
                <option value="">选择用户...</option>
                {bloomedUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} {u.matchId ? '(已匹配)' : ''}
                  </option>
                ))}
              </select>
              {selectedA && !bloomedUsers.find((u) => u.id === selectedA) && (
                <p className="text-seal-red text-xs mt-1">该用户尚未开花，不可匹配</p>
              )}
            </div>

            {/* 选择用户 B */}
            <div>
              <label className="text-xs text-ink-light mb-2 block">用户 B</label>
              <select
                value={selectedB}
                onChange={(e) => setSelectedB(e.target.value)}
                className="input-field w-full"
              >
                <option value="">选择用户...</option>
                {bloomedUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} {u.matchId ? '(已匹配)' : ''}
                  </option>
                ))}
              </select>
              {selectedB && !bloomedUsers.find((u) => u.id === selectedB) && (
                <p className="text-seal-red text-xs mt-1">该用户尚未开花，不可匹配</p>
              )}
            </div>

            {/* 参与者预览 */}
            {selectedA && selectedB && selectedA !== selectedB && (
              <div className="garden-card text-sm">
                <p className="text-ink-light text-xs mb-2">匹配预览</p>
                <div className="flex items-center justify-center gap-4">
                  <span className="text-ink-black font-medium">
                    {bloomedUsers.find((u) => u.id === selectedA)?.name}
                  </span>
                  <span className="text-ink-light">💞</span>
                  <span className="text-ink-black font-medium">
                    {bloomedUsers.find((u) => u.id === selectedB)?.name}
                  </span>
                </div>
              </div>
            )}

            {/* 馆长笔记 */}
            <div>
              <label className="text-xs text-ink-light mb-2 block">馆长笔记</label>
              <textarea
                value={curatorNote}
                onChange={(e) => setCuratorNote(e.target.value)}
                placeholder="写下你为他们匹配的理由..."
                className="input-field w-full h-24 resize-none"
                maxLength={300}
              />
              <p className="text-ink-light text-[10px] mt-1 text-right">{curatorNote.length}/300</p>
            </div>

            {/* 破冰问题 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-ink-light">破冰问题</label>
                <button
                  onClick={handleGenerateIcebreaker}
                  className="text-xs text-sky-blue hover:text-sky-dark underline"
                >
                  自动生成
                </button>
              </div>
              <textarea
                value={icebreaker}
                onChange={(e) => setIcebreaker(e.target.value)}
                placeholder="输入或自动生成一个破冰问题..."
                className="input-field w-full h-20 resize-none"
              />
            </div>

            {/* 创建匹配 */}
            <button
              onClick={handleCreateMatch}
              disabled={!selectedA || !selectedB || !curatorNote || !icebreaker}
              className={`btn-primary w-full ${
                !selectedA || !selectedB || !curatorNote || !icebreaker
                  ? 'opacity-30 cursor-not-allowed'
                  : ''
              }`}
            >
              创建匹配
            </button>

            <p className="text-ink-light text-[10px] text-center">
              匹配后双方会看到彼此的信息和破冰问题 · 匹配不可撤销
            </p>
          </div>
        )}

        {/* ─── Tab: 匹配记录 ─── */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            {users.filter((u) => u.matchId).length === 0 ? (
              <div className="text-center py-12">
                <p className="text-ink-light text-sm">暂无匹配记录</p>
                <p className="text-ink-light text-xs mt-2">创建第一批匹配后，这里会显示所有匹配的状态</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-ink-light text-xs border-b border-paper-aged">
                      <th className="text-left py-2 pr-4">匹配对</th>
                      <th className="text-center py-2 px-2">A 决定</th>
                      <th className="text-center py-2 px-2">B 决定</th>
                      <th className="text-center py-2 px-2">总状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* 按 matchId 分组展示 */}
                    {Array.from(new Set(users.filter((u) => u.matchId).map((u) => u.matchId)))
                      .map((matchId) => {
                        const pair = users.filter((u) => u.matchId === matchId);
                        if (pair.length !== 2) return null;
                        const [uA, uB] = pair;
                        const mA = getCurrentMatch(uA.id);
                        const mB = getCurrentMatch(uB.id);
                        const statusA = mA?.status || 'pending';
                        const statusB = mB?.status || 'pending';
                        let totalStatus: string;
                        let color: string;
                        let canConfirm = false;
                        if (statusA === 'mutual' || statusB === 'mutual') {
                          totalStatus = '双向确认 ✅';
                          color = 'text-seal-red';
                        } else if (statusA === 'accepted' && statusB === 'accepted') {
                          totalStatus = '双方已接受';
                          color = 'text-garden-bloom';
                          canConfirm = true;
                        } else if (statusA === 'skipped' || statusB === 'skipped') {
                          totalStatus = '已跳过';
                          color = 'text-ink-light';
                        } else if (statusA === 'accepted' || statusB === 'accepted') {
                          totalStatus = '一方已接受';
                          color = 'text-sky-blue';
                        } else {
                          totalStatus = '等待决定';
                          color = 'text-ink-light';
                        }
                        return (
                          <tr key={matchId} className="border-b border-paper-aged/50">
                            <td className="py-3 pr-4">
                              <span className="text-ink-black text-xs font-medium">
                                {uA.name} ↔ {uB.name}
                              </span>
                            </td>
                            <td className="text-center py-3 px-2">
                              <span className={`text-xs ${
                                statusA === 'accepted' ? 'text-garden-leaf' :
                                statusA === 'skipped' ? 'text-ink-light' :
                                statusA === 'mutual' ? 'text-seal-red' :
                                'text-sky-blue'
                              }`}>
                                {statusA === 'accepted' ? '已接受' :
                                 statusA === 'skipped' ? '已跳过' :
                                 statusA === 'mutual' ? '已确认' : '待决定'}
                              </span>
                            </td>
                            <td className="text-center py-3 px-2">
                              <span className={`text-xs ${
                                statusB === 'accepted' ? 'text-garden-leaf' :
                                statusB === 'skipped' ? 'text-ink-light' :
                                statusB === 'mutual' ? 'text-seal-red' :
                                'text-sky-blue'
                              }`}>
                                {statusB === 'accepted' ? '已接受' :
                                 statusB === 'skipped' ? '已跳过' :
                                 statusB === 'mutual' ? '已确认' : '待决定'}
                              </span>
                            </td>
                            <td className="text-center py-3 px-2">
                              <span className={`text-xs font-medium ${color}`}>
                                {canConfirm ? (
                                  <button
                                    onClick={() => {
                                      if (confirmMutual(uA.id, uB.id, matchId!)) {
                                        loadUsers();
                                      }
                                    }}
                                    className="text-xs bg-garden-bloom text-white px-3 py-1 rounded-full hover:opacity-80"
                                  >
                                    确认双向
                                  </button>
                                ) : totalStatus}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
