'use client';

import { useState } from 'react';

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 从环境变量读取密码（运行时通过 NEXT_PUBLIC 暴露，或通过 API 验证）
    // TODO: 改为 API 端验证，避免前端硬编码
    if (password === 'admin123') {
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

          {error && (
            <p className="text-seal-red text-sm text-center">{error}</p>
          )}

          <button type="submit" className="btn-primary w-full">
            进入管理
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-paper-white">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-calligraphy text-2xl text-ink-black">花园管理</h1>
          <span className="text-xs text-ink-light">创始人模式</span>
        </div>

        {/* 概览卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="garden-card">
            <p className="text-ink-light text-xs mb-1">总用户</p>
            <p className="text-2xl font-medium text-ink-black">0</p>
          </div>
          <div className="garden-card">
            <p className="text-ink-light text-xs mb-1">已开花</p>
            <p className="text-2xl font-medium text-garden-bloom">0</p>
          </div>
          <div className="garden-card">
            <p className="text-ink-light text-xs mb-1">待匹配</p>
            <p className="text-2xl font-medium text-ink-black">0</p>
          </div>
          <div className="garden-card">
            <p className="text-ink-light text-xs mb-1">双向确认</p>
            <p className="text-2xl font-medium text-seal-red">0</p>
          </div>
        </div>

        {/* 占位：后续实现用户列表和手动匹配功能 */}
        <div className="garden-card text-center py-16">
          <p className="text-ink-gray text-sm">
            用户列表、手动匹配、邀请码管理
          </p>
          <p className="text-ink-light text-xs mt-2">
            功能开发中 —— 第 2-3 周实现
          </p>
        </div>
      </div>
    </main>
  );
}
