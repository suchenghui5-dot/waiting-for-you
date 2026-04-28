'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loginByPhone } from '@/lib/garden-store';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!/^1\d{10}$/.test(phone)) {
      setError('请输入正确的手机号');
      return;
    }

    // 测试模式：直接进入 OTP 步骤
    setStep('otp');
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (otp.length !== 6) {
      setError('请输入6位验证码');
      setLoading(false);
      return;
    }

    // 测试模式：任意 6 位验证码通过，按手机号登录
    try {
      const data = loginByPhone(phone);
      if (data) {
        router.push('/garden');
      } else {
        setError('该手机号尚未注册，请先注册');
        setLoading(false);
      }
    } catch {
      setError('登录失败，请重试');
      setLoading(false);
    }
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
              disabled={loading}
            />

            {error && (
              <p className="text-seal-red text-sm text-center">{error}</p>
            )}

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? '登录中...' : '登录'}
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
