'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<'invite' | 'phone' | 'otp'>('invite');
  const [inviteCode, setInviteCode] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!inviteCode.trim()) {
      setError('请输入邀请码');
      return;
    }

    // TODO: 验证邀请码
    setStep('phone');
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!/^1\d{10}$/.test(phone)) {
      setError('请输入正确的手机号');
      return;
    }

    // TODO: 发送 OTP — 对接 Supabase Auth
    setStep('otp');
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (otp.length !== 6) {
      setError('请输入6位验证码');
      return;
    }

    // TODO: 验证 OTP — 对接 Supabase Auth
    // 注册完成，跳转引导页
    router.push('/guide');
  };

  return (
    <main className="min-h-screen bg-paper-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center mb-8">
          <h1 className="font-calligraphy text-3xl text-ink-black tracking-wider">
            等你
          </h1>
        </Link>

        {step === 'invite' && (
          <form onSubmit={handleInviteSubmit} className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-lg font-medium text-ink-black">进入花园</h2>
              <p className="text-sm text-ink-gray">
                「等你」目前仅限邀请制。请输入你的邀请码。
              </p>
            </div>

            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="邀请码"
              className="input-field text-center text-lg tracking-widest"
              autoFocus
            />

            {error && (
              <p className="text-seal-red text-sm text-center">{error}</p>
            )}

            <button type="submit" className="btn-primary w-full">
              验证邀请码
            </button>
          </form>
        )}

        {step === 'phone' && (
          <form onSubmit={handlePhoneSubmit} className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-lg font-medium text-ink-black">验证手机号</h2>
              <p className="text-sm text-ink-gray">
                我们将发送验证码到你的手机。
              </p>
            </div>

            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="手机号"
              className="input-field text-center text-lg"
              maxLength={11}
              autoFocus
            />

            {error && (
              <p className="text-seal-red text-sm text-center">{error}</p>
            )}

            <button type="submit" className="btn-primary w-full">
              发送验证码
            </button>

            <button
              type="button"
              onClick={() => setStep('invite')}
              className="w-full text-sm text-ink-light underline hover:text-ink-gray"
            >
              返回上一步
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleOtpSubmit} className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-lg font-medium text-ink-black">输入验证码</h2>
              <p className="text-sm text-ink-gray">
                验证码已发送至 {phone}
              </p>
            </div>

            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="6位验证码"
              className="input-field text-center text-lg tracking-[0.5em]"
              maxLength={6}
              autoFocus
            />

            {error && (
              <p className="text-seal-red text-sm text-center">{error}</p>
            )}

            <button type="submit" className="btn-primary w-full">
              验证并注册
            </button>

            <button
              type="button"
              onClick={() => setStep('phone')}
              className="w-full text-sm text-ink-light underline hover:text-ink-gray"
            >
              返回上一步
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
