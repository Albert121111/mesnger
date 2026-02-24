const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let backendProc;
let frontendProc;

const isDev = process.env.DESKTOP_DEV === '1';
const backendPort = process.env.DESKTOP_BACKEND_PORT || '4010';
const frontendPort = process.env.DESKTOP_FRONTEND_PORT || '3001';

function startProcesses() {
  const root = path.resolve(__dirname, '..');
  backendProc = spawn('npm', ['run', 'desktop:backend:start'], { cwd: root, stdio: 'inherit', shell: true, env: { ...process.env, DATABASE_URL: `file:${path.join(app.getPath('userData'),'desktop.db')}`, DESKTOP_BACKEND_PORT: backendPort } });
  if (isDev) {
    frontendProc = spawn('npm', ['run', 'desktop:frontend:dev'], { cwd: root, stdio: 'inherit', shell: true, env: { ...process.env, NEXT_PUBLIC_API_URL: `http://localhost:${backendPort}`, PORT: frontendPort } });
  } else {
    frontendProc = spawn('npm', ['run', 'desktop:frontend:start'], { cwd: root, stdio: 'inherit', shell: true, env: { ...process.env, NEXT_PUBLIC_API_URL: `http://localhost:${backendPort}`, PORT: frontendPort } });
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({ width: 1440, height: 900, webPreferences: { preload: path.join(__dirname, 'preload.js') } });
  mainWindow.loadURL(`http://localhost:${frontendPort}`);
}

app.whenReady().then(() => { startProcesses(); setTimeout(createWindow, isDev ? 5000 : 8000); });
app.on('window-all-closed', () => { backendProc && backendProc.kill(); frontendProc && frontendProc.kill(); if (process.platform !== 'darwin') app.quit(); });
