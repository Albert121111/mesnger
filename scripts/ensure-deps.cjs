const { spawnSync } = require('child_process');

const required = [
  ['electron/package.json', 'electron'],
  ['electron-builder/package.json', 'electron-builder'],
  ['typescript/package.json', 'typescript'],
  ['tsx/package.json', 'tsx'],
  ['next/package.json', 'next'],
  ['cross-env/package.json', 'cross-env']
];

const missing = required
  .map(([pkg]) => {
    try {
      require.resolve(pkg, { paths: [process.cwd()] });
      return null;
    } catch {
      return pkg;
    }
  })
  .filter(Boolean);

if (missing.length === 0) {
  console.log('[deps] all required packages are installed');
  process.exit(0);
}

console.log('[deps] missing packages detected, installing dev dependencies...');
const res = spawnSync('npm', ['install', '--include=dev'], { stdio: 'inherit', shell: true });
if (res.status !== 0) {
  process.exit(res.status ?? 1);
}

console.log('[deps] install completed');
