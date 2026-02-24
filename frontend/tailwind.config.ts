import type { Config } from 'tailwindcss';
export default { content: ['./src/**/*.{ts,tsx}'], theme: { extend: { colors: { appbg: '#F4F7FB', surface: '#fff', brand: '#2563EB', border: '#E2E8F0' } } }, darkMode: 'class' } satisfies Config;
