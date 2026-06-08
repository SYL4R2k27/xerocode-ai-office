"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const ws_1 = __importDefault(require("ws"));
const CONFIG_DIR = path.join(os.homedir(), '.ai-office');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
let mainWindow = null;
let tray = null;
let ws = null;
let isConnected = false;
function loadConfig() {
    try {
        if (!fs.existsSync(CONFIG_FILE))
            return null;
        return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    }
    catch {
        return null;
    }
}
function saveConfig(config) {
    if (!fs.existsSync(CONFIG_DIR))
        fs.mkdirSync(CONFIG_DIR, { recursive: true });
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}
function sendToRenderer(channel, data) {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(channel, data);
    }
}
function addLog(msg, type = 'info') {
    sendToRenderer('log', { time: new Date().toLocaleTimeString(), msg, type });
}
function connectToServer(serverUrl, goalId, token, projectDir) {
    if (ws) {
        ws.close();
        ws = null;
    }
    const wsProtocol = serverUrl.startsWith('https') ? 'wss' : 'ws';
    const host = serverUrl.replace(/^https?:\/\//, '');
    const wsUrl = `${wsProtocol}://${host}/ws/agent/${goalId}?token=${token}`;
    addLog(`Connecting to ${serverUrl}...`);
    sendToRenderer('status', 'connecting');
    ws = new ws_1.default(wsUrl);
    ws.on('open', () => {
        isConnected = true;
        sendToRenderer('status', 'connected');
        addLog('Connected to XeroCode', 'success');
        ws.send(JSON.stringify({
            type: 'agent_connect',
            goal_id: goalId,
            capabilities: ['write_file', 'read_file', 'run_command', 'list_files', 'search_code'],
        }));
        if (tray)
            tray.setToolTip('XeroCode Agent — Connected');
    });
    ws.on('message', async (data) => {
        try {
            const msg = JSON.parse(data.toString());
            if (msg.action === 'execute_tool' && msg.tool && msg.arguments && msg.request_id) {
                addLog(`Executing: ${msg.tool}`, 'tool');
                const { executeToolCall } = require('../dist/executor');
                const result = await executeToolCall(msg.tool, msg.arguments, projectDir);
                ws.send(JSON.stringify({
                    action: 'tool_result',
                    request_id: msg.request_id,
                    success: result.success,
                    output: result.output,
                    error: result.error || null,
                }));
                addLog(`${msg.tool}: ${result.success ? 'OK' : 'FAIL'}`, result.success ? 'success' : 'error');
            }
            else if (msg.action === 'ping') {
                ws.send(JSON.stringify({ action: 'pong' }));
            }
            else if (msg.action === 'goal_complete') {
                addLog('All tasks completed!', 'success');
            }
        }
        catch (err) {
            addLog(`Error: ${err.message}`, 'error');
        }
    });
    ws.on('close', (code) => {
        isConnected = false;
        sendToRenderer('status', 'disconnected');
        if (tray)
            tray.setToolTip('XeroCode Agent — Disconnected');
        if (code === 4001) {
            addLog('Invalid token. Please login again.', 'error');
            return;
        }
        addLog('Disconnected. Reconnecting in 3s...');
        setTimeout(() => {
            if (!isConnected)
                connectToServer(serverUrl, goalId, token, projectDir);
        }, 3000);
    });
    ws.on('error', (err) => {
        addLog(`Connection error: ${err.message}`, 'error');
    });
}
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
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
        mainWindow.show();
        const config = loadConfig();
        if (config)
            sendToRenderer('config', config);
    });
    mainWindow.on('close', (e) => {
        if (!electron_1.app.isQuitting) {
            e.preventDefault();
            mainWindow?.hide();
        }
    });
}
function createTray() {
    const icon = electron_1.nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAARklEQVQ4T2NkoBAwUqifAY8B/xkYGBhJdQPIAEZSXQAygJFUF8BcQLQhMAOINgRmAMxkYg2BuYBol8BcQLQhpIYDLBwAAPpaDhGMIhcAAAAASUVORK5CYII=');
    tray = new electron_1.Tray(icon);
    tray.setToolTip('XeroCode Agent');
    const contextMenu = electron_1.Menu.buildFromTemplate([
        { label: 'Show', click: () => mainWindow?.show() },
        { type: 'separator' },
        { label: isConnected ? 'Connected' : 'Disconnected', enabled: false },
        { type: 'separator' },
        { label: 'Open XeroCode', click: () => electron_1.shell.openExternal('https://xerocode.space') },
        { type: 'separator' },
        {
            label: 'Quit',
            click: () => {
                electron_1.app.isQuitting = true;
                if (ws)
                    ws.close();
                electron_1.app.quit();
            },
        },
    ]);
    tray.setContextMenu(contextMenu);
    tray.on('click', () => mainWindow?.show());
}
// IPC handlers
electron_1.ipcMain.on('connect', (_event, data) => {
    saveConfig({ server: data.server, token: data.token, projectDir: data.projectDir, lastGoalId: data.goalId });
    connectToServer(data.server, data.goalId, data.token, data.projectDir);
});
electron_1.ipcMain.on('disconnect', () => {
    if (ws) {
        ws.close();
        ws = null;
    }
    isConnected = false;
    sendToRenderer('status', 'disconnected');
    addLog('Disconnected by user');
});
electron_1.ipcMain.on('login', async (_event, data) => {
    const httpModule = data.server.startsWith('https') ? require('https') : require('http');
    const url = new URL(`${data.server}/api/auth/login`);
    const postData = JSON.stringify({ email: data.email, password: data.password });
    const req = httpModule.request({
        hostname: url.hostname,
        port: url.port || (data.server.startsWith('https') ? 443 : 80),
        path: url.pathname,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) },
    }, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
            try {
                const result = JSON.parse(body);
                if (res.statusCode === 200 && result.access_token) {
                    saveConfig({ server: data.server, token: result.access_token, projectDir: process.cwd() });
                    sendToRenderer('login-success', { token: result.access_token });
                    addLog(`Logged in as ${data.email}`, 'success');
                }
                else {
                    sendToRenderer('login-error', result.detail || 'Login failed');
                    addLog(`Login failed: ${result.detail || res.statusCode}`, 'error');
                }
            }
            catch {
                sendToRenderer('login-error', 'Invalid server response');
            }
        });
    });
    req.on('error', (err) => { sendToRenderer('login-error', err.message); });
    req.write(postData);
    req.end();
});
electron_1.ipcMain.on('select-folder', async () => {
    const result = await electron_1.dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'],
        title: 'Select Project Folder',
    });
    if (!result.canceled && result.filePaths[0]) {
        sendToRenderer('folder-selected', result.filePaths[0]);
    }
});
// App lifecycle
electron_1.app.whenReady().then(() => {
    createTray();
    createWindow();
});
electron_1.app.on('window-all-closed', () => { });
electron_1.app.on('activate', () => {
    if (!mainWindow)
        createWindow();
    else
        mainWindow.show();
});
electron_1.app.on('before-quit', () => {
    electron_1.app.isQuitting = true;
    if (ws)
        ws.close();
});
