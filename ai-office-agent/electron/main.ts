import { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage, shell, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import WebSocket from 'ws';

const CONFIG_DIR = path.join(os.homedir(), '.ai-office');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

interface AgentConfig {
  server: string;
  token: string;
  projectDir: string;
  lastGoalId?: string;
}

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let ws: WebSocket | null = null;
let isConnected = false;

function loadConfig(): AgentConfig | null {
  try {
    if (!fs.existsSync(CONFIG_FILE)) return null;
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
  } catch { return null; }
}

function saveConfig(config: AgentConfig): void {
  if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

function sendToRenderer(channel: string, data: any): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, data);
  }
}

function addLog(msg: string, type: 'info' | 'success' | 'error' | 'tool' = 'info'): void {
  sendToRenderer('log', { time: new Date().toLocaleTimeString(), msg, type });
}

function connectToServer(serverUrl: string, goalId: string, token: string, projectDir: string): void {
  if (ws) { ws.close(); ws = null; }

  const wsProtocol = serverUrl.startsWith('https') ? 'wss' : 'ws';
  const host = serverUrl.replace(/^https?:\/\//, '');
  const wsUrl = `${wsProtocol}://${host}/ws/agent/${goalId}?token=${token}`;

  addLog(`Connecting to ${serverUrl}...`);
  sendToRenderer('status', 'connecting');

  ws = new WebSocket(wsUrl);

  ws.on('open', () => {
    isConnected = true;
    sendToRenderer('status', 'connected');
    addLog('Connected to XeroCode', 'success');

    ws!.send(JSON.stringify({
      type: 'agent_connect',
      goal_id: goalId,
      capabilities: ['write_file', 'read_file', 'run_command', 'list_files', 'search_code'],
    }));

    if (tray) tray.setToolTip('XeroCode Agent — Connected');
  });

  ws.on('message', async (data: WebSocket.Data) => {
    try {
      const msg = JSON.parse(data.toString());

      if (msg.action === 'execute_tool' && msg.tool && msg.arguments && msg.request_id) {
        addLog(`Executing: ${msg.tool}`, 'tool');

        const { executeToolCall } = require('../dist/executor');
        const result = await executeToolCall(msg.tool, msg.arguments, projectDir);

        ws!.send(JSON.stringify({
          action: 'tool_result',
          request_id: msg.request_id,
          success: result.success,
          output: result.output,
          error: result.error || null,
        }));

        addLog(`${msg.tool}: ${result.success ? 'OK' : 'FAIL'}`, result.success ? 'success' : 'error');
      } else if (msg.action === 'ping') {
        ws!.send(JSON.stringify({ action: 'pong' }));
      } else if (msg.action === 'goal_complete') {
        addLog('All tasks completed!', 'success');
      }
    } catch (err: any) {
      addLog(`Error: ${err.message}`, 'error');
    }
  });

  ws.on('close', (code: number) => {
    isConnected = false;
    sendToRenderer('status', 'disconnected');
    if (tray) tray.setToolTip('XeroCode Agent — Disconnected');

    if (code === 4001) {
      addLog('Invalid token. Please login again.', 'error');
      return;
    }

    addLog('Disconnected. Reconnecting in 3s...');
    setTimeout(() => {
      if (!isConnected) connectToServer(serverUrl, goalId, token, projectDir);
    }, 3000);
  });

  ws.on('error', (err: Error) => {
    addLog(`Connection error: ${err.message}`, 'error');
  });
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 480,
    height: 640,
    minWidth: 380,
    minHeight: 500,
    title: 'XeroCode Agent',
    backgroundColor: '#0a0a0a',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    show: false,
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow!.show();
    const config = loadConfig();
    if (config) sendToRenderer('config', config);
  });

  mainWindow.on('close', (e) => {
    if (!(app as any).isQuitting) {
      e.preventDefault();
      mainWindow?.hide();
    }
  });
}

function createTray(): void {
  const icon = nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAARklEQVQ4T2NkoBAwUqifAY8B/xkYGBhJdQPIAEZSXQAygJFUF8BcQLQhMAOINgRmAMxkYg2BuYBol8BcQLQhpIYDLBwAAPpaDhGMIhcAAAAASUVORK5CYII='
  );

  tray = new Tray(icon);
  tray.setToolTip('XeroCode Agent');

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show', click: () => mainWindow?.show() },
    { type: 'separator' },
    { label: isConnected ? 'Connected' : 'Disconnected', enabled: false },
    { type: 'separator' },
    { label: 'Open XeroCode', click: () => shell.openExternal('https://xerocode.space') },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        (app as any).isQuitting = true;
        if (ws) ws.close();
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('click', () => mainWindow?.show());
}

// IPC handlers
ipcMain.on('connect', (_event, data: { server: string; goalId: string; token: string; projectDir: string }) => {
  saveConfig({ server: data.server, token: data.token, projectDir: data.projectDir, lastGoalId: data.goalId });
  connectToServer(data.server, data.goalId, data.token, data.projectDir);
});

ipcMain.on('disconnect', () => {
  if (ws) { ws.close(); ws = null; }
  isConnected = false;
  sendToRenderer('status', 'disconnected');
  addLog('Disconnected by user');
});

ipcMain.on('login', async (_event, data: { server: string; email: string; password: string }) => {
  const httpModule = data.server.startsWith('https') ? require('https') : require('http');
  const url = new URL(`${data.server}/api/auth/login`);
  const postData = JSON.stringify({ email: data.email, password: data.password });

  const req = httpModule.request({
    hostname: url.hostname,
    port: url.port || (data.server.startsWith('https') ? 443 : 80),
    path: url.pathname,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) },
  }, (res: any) => {
    let body = '';
    res.on('data', (chunk: string) => { body += chunk; });
    res.on('end', () => {
      try {
        const result = JSON.parse(body);
        if (res.statusCode === 200 && result.access_token) {
          saveConfig({ server: data.server, token: result.access_token, projectDir: process.cwd() });
          sendToRenderer('login-success', { token: result.access_token });
          addLog(`Logged in as ${data.email}`, 'success');
        } else {
          sendToRenderer('login-error', result.detail || 'Login failed');
          addLog(`Login failed: ${result.detail || res.statusCode}`, 'error');
        }
      } catch {
        sendToRenderer('login-error', 'Invalid server response');
      }
    });
  });

  req.on('error', (err: Error) => { sendToRenderer('login-error', err.message); });
  req.write(postData);
  req.end();
});

ipcMain.on('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory'],
    title: 'Select Project Folder',
  });
  if (!result.canceled && result.filePaths[0]) {
    sendToRenderer('folder-selected', result.filePaths[0]);
  }
});

// App lifecycle
app.whenReady().then(() => {
  createTray();
  createWindow();
});

app.on('window-all-closed', () => { /* stay in tray */ });

app.on('activate', () => {
  if (!mainWindow) createWindow();
  else mainWindow.show();
});

app.on('before-quit', () => {
  (app as any).isQuitting = true;
  if (ws) ws.close();
});
