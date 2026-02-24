'use client';
import { api } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const [form, setForm] = useState({ displayName: '', username: '', login: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const router = useRouter();
  const submit = async () => {
    setError('');
    try {
      if (mode === 'register') {
        if (form.password !== form.confirmPassword) throw new Error('Пароли не совпадают');
        await api.post('/auth/register', { email: form.email, password: form.password, username: form.username, displayName: form.displayName });
      } else {
        await api.post('/auth/login', { login: form.login, password: form.password });
      }
      router.push('/app');
    } catch (e: any) { setError(e.response?.data?.message || e.message); }
  };
  return <div className='min-h-screen grid place-items-center bg-gradient-to-br from-indigo-100 to-slate-100 p-4'>
    <div className='w-[420px] max-w-full rounded-[20px] border border-slate-200 bg-white p-6 shadow-2xl'>
      <h1 className='text-[28px] leading-[36px] font-bold'>Messenger</h1>
      <p className='text-slate-600'>{mode === 'register' ? 'Создайте аккаунт' : 'Войдите в аккаунт'}</p>
      <div className='mt-4 space-y-3'>
        {mode === 'register' && <input className='h-11 w-full rounded-xl border px-3' placeholder='Имя' onChange={(e)=>setForm({...form,displayName:e.target.value})} />}
        {mode === 'register' && <input className='h-11 w-full rounded-xl border px-3' placeholder='@username' onChange={(e)=>setForm({...form,username:e.target.value})} />}
        {mode === 'register' ? <input className='h-11 w-full rounded-xl border px-3' placeholder='Email' onChange={(e)=>setForm({...form,email:e.target.value})} /> : <input className='h-11 w-full rounded-xl border px-3' placeholder='Email или username' onChange={(e)=>setForm({...form,login:e.target.value})} />}
        <input className='h-11 w-full rounded-xl border px-3' type='password' placeholder='Пароль' onChange={(e)=>setForm({...form,password:e.target.value})} />
        {mode === 'register' && <input className='h-11 w-full rounded-xl border px-3' type='password' placeholder='Повторите пароль' onChange={(e)=>setForm({...form,confirmPassword:e.target.value})} />}
        {error && <p className='text-red-600 text-xs'>{error}</p>}
        <button onClick={submit} className='h-11 w-full rounded-xl bg-brand text-white font-semibold'>{mode === 'register' ? 'Зарегистрироваться' : 'Войти'}</button>
        <p className='text-sm'>{mode === 'register' ? 'Уже есть аккаунт?' : 'Нет аккаунта?'} <Link className='text-brand' href={mode==='register'?'/auth/login':'/auth/register'}>{mode==='register'?'Войти':'Регистрация'}</Link></p>
      </div>
    </div>
  </div>;
}
