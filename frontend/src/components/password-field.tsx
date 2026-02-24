'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

type Props = {
  value?: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
};

export default function PasswordField({ value, onChange, placeholder, className = '' }: Props) {
  const [show, setShow] = useState(false);

  return (
    <div className='relative'>
      <input
        value={value}
        className={`h-11 w-full rounded-xl border px-3 pr-11 ${className}`}
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type='button'
        className='absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 hover:bg-slate-100'
        onClick={() => setShow((s) => !s)}
        aria-label={show ? 'Скрыть пароль' : 'Показать пароль'}
        title={show ? 'Скрыть пароль' : 'Показать пароль'}
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
