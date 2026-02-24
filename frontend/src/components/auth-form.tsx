'use client';
import { api, getUserFriendlyError } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import PasswordField from './password-field';

declare global {
  interface Window {
    desktop?: {
      mode: string;
      getConfig?: () => Promise<{ mode: 'host' | 'client'; serverUrl: string }>;
      setConfig?: (cfg: { mode: 'host' | 'client'; serverUrl: string }) => Promise<{ mode: 'host' | 'client'; serverUrl: string }>;
      getDefaultUrl?: () => Promise<string>;
    };
  }
}

const DESKTOP_KEY = 'desktopServerUrl';

export default function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const [form, setForm] = useState({ displayName: '', username: '', login: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [desktopMode, setDesktopMode] = useState<'host' | 'client'>('host');
  const [serverUrl, setServerUrl] = useState('http://127.0.0.1:4010');
  const [hostInfo, setHostInfo] = useState<any>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsDesktop(typeof window !== 'undefined' && !!window.desktop);
  }, []);

  useEffect(() => {
    if (!isDesktop) return;
    (async () => {
      const cfg = (await window.desktop?.getConfig?.()) || { mode: 'host', serverUrl: 'http://127.0.0.1:4010' };
      const defaultUrl = (await window.desktop?.getDefaultUrl?.()) || 'http://127.0.0.1:4010';
      const resolvedUrl = cfg.mode === 'host' ? defaultUrl : cfg.serverUrl || defaultUrl;
      setDesktopMode(cfg.mode);
      setServerUrl(resolvedUrl);
      window.localStorage.setItem(DESKTOP_KEY, resolvedUrl);
      if (cfg.mode === 'host') {
        try {
          const health = await api.get('/host-info');
          setHostInfo(health.data);
        } catch {
          setHostInfo(null);
        }
      }
    })();
  }, [isDesktop]);

  async function saveDesktopConfig(nextMode: 'host' | 'client') {
    const finalUrl = nextMode === 'host' ? (await window.desktop?.getDefaultUrl?.()) || 'http://127.0.0.1:4010' : serverUrl;
    setDesktopMode(nextMode);
    window.localStorage.setItem(DESKTOP_KEY, finalUrl);
    await window.desktop?.setConfig?.({ mode: nextMode, serverUrl: finalUrl });
  }

  const submit = async () => {
    setError('');
    setLoading(true);
    try {
      if (mode === 'register') {
        if (form.password !== form.confirmPassword) throw new Error('Пароли не совпадают');
        await api.post('/auth/register', { email: form.email, password: form.password, username: form.username, displayName: form.displayName });
      } else {
        await api.post('/auth/login', { login: form.login, password: form.password });
      }
      router.push('/app');
    } catch (e) {
      const friendly = getUserFriendlyError(e);
      setError(friendly);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen grid place-items-center bg-gradient-to-br from-indigo-100 to-slate-100 p-4'>
      <div className='w-[460px] max-w-full rounded-[20px] border border-slate-200 bg-white p-6 shadow-2xl'>
        <h1 className='text-[28px] leading-[36px] font-bold'>Messenger</h1>
        <p className='text-slate-600'>{mode === 'register' ? 'Создайте аккаунт' : 'Войдите в аккаунт'}</p>

        {isDesktop && (
          <div className='mt-3 rounded-xl border border-slate-200 p-3 text-sm space-y-2'>
            <div className='flex gap-2'>
              <button type='button' onClick={() => saveDesktopConfig('host')} className={`px-3 py-1 rounded ${desktopMode === 'host' ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}>Host</button>
              <button type='button' onClick={() => saveDesktopConfig('client')} className={`px-3 py-1 rounded ${desktopMode === 'client' ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}>Client</button>
            </div>
            {desktopMode === 'host' ? (
              <div className='text-slate-600'>
                <div>Адрес хоста: {serverUrl}</div>
                {hostInfo?.ips?.length ? <div>LAN/Tailscale IP: {hostInfo.ips.join(', ')}</div> : <div>LAN IP будет доступен после старта backend.</div>}
              </div>
            ) : (
              <div className='space-y-2'>
                <input className='h-10 w-full rounded-lg border px-3' value={serverUrl} onChange={(e) => setServerUrl(e.target.value)} placeholder='http://192.168.1.10:4000' />
                <button
                  type='button'
                  className='px-3 py-1 rounded bg-slate-100'
                  onClick={async () => {
                    await saveDesktopConfig('client');
                    setError('Сервер сохранён. Если уже открыта страница, повторите вход.');
                  }}
                >
                  Сохранить сервер
                </button>
              </div>
            )}
          </div>
        )}

        <div className='mt-4 space-y-3'>
          {mode === 'register' && <input className='h-11 w-full rounded-xl border px-3' placeholder='Имя' onChange={(e) => setForm({ ...form, displayName: e.target.value })} />}
          {mode === 'register' && <input className='h-11 w-full rounded-xl border px-3' placeholder='@username' onChange={(e) => setForm({ ...form, username: e.target.value })} />}
          {mode === 'register' ? (
            <input className='h-11 w-full rounded-xl border px-3' placeholder='Email' onChange={(e) => setForm({ ...form, email: e.target.value })} />
          ) : (
            <input className='h-11 w-full rounded-xl border px-3' placeholder='Email или username' onChange={(e) => setForm({ ...form, login: e.target.value })} />
          )}
          <PasswordField value={form.password} placeholder='Пароль' onChange={(value) => setForm({ ...form, password: value })} />
          {mode === 'register' && <PasswordField value={form.confirmPassword} placeholder='Повторите пароль' onChange={(value) => setForm({ ...form, confirmPassword: value })} />}
          {error && <p className='text-red-600 text-xs'>{error}</p>}
          <button disabled={loading} onClick={submit} className='h-11 w-full rounded-xl bg-brand text-white font-semibold disabled:opacity-70'>
            {loading ? 'Подождите…' : mode === 'register' ? 'Зарегистрироваться' : 'Войти'}
          </button>
          <p className='text-sm'>
            {mode === 'register' ? 'Уже есть аккаунт?' : 'Нет аккаунта?'}{' '}
            <Link className='text-brand' href={mode === 'register' ? '/auth/login' : '/auth/register'}>
              {mode === 'register' ? 'Войти' : 'Регистрация'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
