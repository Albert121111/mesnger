const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;
let backendProc;
let frontendProc;

const isDev = process.env.DESKTOP_DEV === '1';
const backendPort = process.env.DESKTOP_BACKEND_PORT || '4010';
const frontendPort = process.env.DESKTOP_FRONTEND_PORT || '3001';
const defaultServerUrl = `http://127.0.0.1:${backendPort}`;

const getConfigPath = () => path.join(app.getPath('userData'), 'desktop-config.json');
const readConfig = () => {
  const configPath = getConfigPath();
  if (!fs.existsSync(configPath)) return { mode: 'host', serverUrl: defaultServerUrl };
  try {
    const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return { mode: parsed.mode || 'host', serverUrl: parsed.serverUrl || defaultServerUrl };
  } catch {
    return { mode: 'host', serverUrl: defaultServerUrl };
  }
};
const writeConfig = (cfg) => fs.writeFileSync(getConfigPath(), JSON.stringify(cfg, null, 2));

function startProcesses() {
  const root = path.resolve(__dirname, '..');
  const userData = app.getPath('userData');
  backendProc = spawn('npm', ['run', 'desktop:backend:start'], {
    cwd: root,
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      DATABASE_URL: `file:${path.join(userData, 'desktop.db')}`,
      DESKTOP_BACKEND_PORT: backendPort,
      DESKTOP_BACKEND_HOST: '0.0.0.0',
      UPLOAD_DIR: path.join(userData, 'uploads')
    }
  });

  const cfg = readConfig();
  const env = {
    ...process.env,
    NEXT_PUBLIC_API_URL: cfg.mode === 'client' ? cfg.serverUrl : defaultServerUrl,
    PORT: frontendPort
  };
  frontendProc = spawn('npm', ['run', isDev ? 'desktop:frontend:dev' : 'desktop:frontend:start'], {
    cwd: root,
    stdio: 'inherit',
    shell: true,
    env
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    webPreferences: { preload: path.join(__dirname, 'preload.js') }
  });
  mainWindow.loadURL(`http://localhost:${frontendPort}`);
}

app.whenReady().then(() => {
  startProcesses();
  setTimeout(createWindow, isDev ? 5000 : 8000);
});

ipcMain.handle('desktop:get-config', () => readConfig());
ipcMain.handle('desktop:set-config', (_e, cfg) => {
  const normalized = {
    mode: cfg?.mode === 'client' ? 'client' : 'host',
    serverUrl: typeof cfg?.serverUrl === 'string' && cfg.serverUrl.trim() ? cfg.serverUrl.trim() : defaultServerUrl
  };
  writeConfig(normalized);
  return normalized;
});
ipcMain.handle('desktop:get-default-url', () => defaultServerUrl);

app.on('window-all-closed', () => {
  backendProc && backendProc.kill();
  frontendProc && frontendProc.kill();
  if (process.platform !== 'darwin') app.quit();
});
