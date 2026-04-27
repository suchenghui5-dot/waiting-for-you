'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!/^1\d{10}$/.test(phone)) {
      setError('请输入正确的手机号');
      return;
    }

    // TODO: 发送 OTP
    setStep('otp');
  };

  return (
    <main className="min-h-screen bg-paper-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center mb-8">
          <h1 className="font-calligraphy text-3xl text-ink-black tracking-wider">
            等你
          </h1>
        </Link>

        {step === 'phone' && (
          <form onSubmit={handlePhoneSubmit} className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-lg font-medium text-ink-black">欢迎回来</h2>
              <p className="text-sm text-ink-gray">
                输入注册时的手机号登录。
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

            <Link
              href="/register"
              className="block w-full text-center text-sm text-ink-light underline hover:text-ink-gray"
            >
              还没有种子？进入花园
            </Link>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
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
              登录
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
