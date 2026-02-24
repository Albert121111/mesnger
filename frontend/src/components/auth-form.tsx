'use client';
import { api, getUserFriendlyError } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import PasswordField from './password-field';

export default function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const [form, setForm] = useState({ displayName: '', username: '', login: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
      if (process.env.NODE_ENV !== 'production') {
        console.error('[AUTH ERROR]', e);
        console.info(`[AUTH DEBUG] API URL: ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return <div className='min-h-screen grid place-items-center bg-gradient-to-br from-indigo-100 to-slate-100 p-4'>
    <div className='w-[420px] max-w-full rounded-[20px] border border-slate-200 bg-white p-6 shadow-2xl'>
      <h1 className='text-[28px] leading-[36px] font-bold'>Messenger</h1>
      <p className='text-slate-600'>{mode === 'register' ? 'Создайте аккаунт' : 'Войдите в аккаунт'}</p>
      <div className='mt-4 space-y-3'>
        {mode === 'register' && <input className='h-11 w-full rounded-xl border px-3' placeholder='Имя' onChange={(e)=>setForm({...form,displayName:e.target.value})} />}
        {mode === 'register' && <input className='h-11 w-full rounded-xl border px-3' placeholder='@username' onChange={(e)=>setForm({...form,username:e.target.value})} />}
        {mode === 'register' ? <input className='h-11 w-full rounded-xl border px-3' placeholder='Email' onChange={(e)=>setForm({...form,email:e.target.value})} /> : <input className='h-11 w-full rounded-xl border px-3' placeholder='Email или username' onChange={(e)=>setForm({...form,login:e.target.value})} />}
        <PasswordField value={form.password} placeholder='Пароль' onChange={(value)=>setForm({...form,password:value})} />
        {mode === 'register' && <PasswordField value={form.confirmPassword} placeholder='Повторите пароль' onChange={(value)=>setForm({...form,confirmPassword:value})} />}
        {error && <p className='text-red-600 text-xs'>{error}</p>}
        <button disabled={loading} onClick={submit} className='h-11 w-full rounded-xl bg-brand text-white font-semibold disabled:opacity-70'>
          {loading ? 'Подождите…' : mode === 'register' ? 'Зарегистрироваться' : 'Войти'}
        </button>
        <p className='text-sm'>{mode === 'register' ? 'Уже есть аккаунт?' : 'Нет аккаунта?'} <Link className='text-brand' href={mode==='register'?'/auth/login':'/auth/register'}>{mode==='register'?'Войти':'Регистрация'}</Link></p>
      </div>
    </div>
  </div>;
}
