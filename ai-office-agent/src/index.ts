import { program } from 'commander';
import WebSocket from 'ws';
import * as path from 'path';
import * as fs from 'fs';
import * as readline from 'readline';
import { executeToolCall } from './executor';
import { loadConfig, saveConfig, clearConfig, getConfigPath } from './config';
import {
  showBanner,
  showConnected,
  showDisconnected,
  showReconnecting,
  showError,
  showInfo,
  showSuccess,
  showComplete,
  showGoalsList,
} from './ui';

interface ServerMessage {
  action: string;
  tool?: string;
  arguments?: Record<string, any>;
  request_id?: string;
  [key: string]: any;
}

let ws: WebSocket | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;
let isShuttingDown = false;
let tasksCompleted = 0;
let tasksTotal = 0;

function connect(serverUrl: string, goalId: string, token: string, projectDir: string): void {
  const wsProtocol = serverUrl.startsWith('https') ? 'wss' : 'ws';
  const host = serverUrl.replace(/^https?:\/\//, '');
  const wsUrl = `${wsProtocol}://${host}/ws/agent/${goalId}?token=${token}`;

  showReconnecting();

  ws = new WebSocket(wsUrl);

  ws.on('open', () => {
    showConnected(serverUrl, projectDir, goalId);

    ws!.send(JSON.stringify({
      type: 'agent_connect',
      goal_id: goalId,
      capabilities: ['write_file', 'read_file', 'run_command', 'list_files', 'search_code'],
    }));
  });

  ws.on('message', async (data: WebSocket.Data) => {
    try {
      const msg: ServerMessage = JSON.parse(data.toString());

      if (msg.action === 'execute_tool' && msg.tool && msg.arguments && msg.request_id) {
        const result = await executeToolCall(msg.tool, msg.arguments, projectDir);

        tasksCompleted++;

        ws!.send(JSON.stringify({
          action: 'tool_result',
          request_id: msg.request_id,
          success: result.success,
          output: result.output,
          error: result.error || null,
        }));
      } else if (msg.action === 'ping') {
        ws!.send(JSON.stringify({ action: 'pong' }));
      } else if (msg.action === 'task_count') {
        tasksTotal = msg.total || 0;
      } else if (msg.action === 'goal_complete') {
        showComplete();
      } else if (msg.action === 'error') {
        showError(msg.message || 'Unknown server error');
      }
    } catch (err: any) {
      showError(`Message error: ${err.message}`);
    }
  });

  ws.on('close', (code: number) => {
    if (isShuttingDown) return;

    if (code === 4001) {
      showError('Invalid token. Run: xerocode-agent login');
      process.exit(1);
    }

    showDisconnected();
    scheduleReconnect(serverUrl, goalId, token, projectDir);
  });

  ws.on('error', (err: Error) => {
    if (!isShuttingDown) {
      showError(err.message);
    }
  });
}

function scheduleReconnect(serverUrl: string, goalId: string, token: string, projectDir: string): void {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(() => {
    connect(serverUrl, goalId, token, projectDir);
  }, 3000);
}

function shutdown(): void {
  isShuttingDown = true;
  showInfo('Shutting down...');
  if (reconnectTimer) clearTimeout(reconnectTimer);
  if (ws) ws.close();
  process.exit(0);
}

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function httpRequest(url: string, options: any, postData?: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const httpModule = url.startsWith('https') ? require('https') : require('http');
    const parsed = new URL(url);
    const req = httpModule.request(
      {
        hostname: parsed.hostname,
        port: parsed.port || (url.startsWith('https') ? 443 : 80),
        path: parsed.pathname + parsed.search,
        ...options,
      },
      (res: any) => {
        let body = '';
        res.on('data', (chunk: string) => { body += chunk; });
        res.on('end', () => resolve({ status: res.statusCode, body }));
      }
    );
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

// ── Commands ────────────────────────────────────────────

async function loginCommand(serverUrl: string): Promise<void> {
  showBanner();
  showInfo(`Server: ${serverUrl}`);
  console.log('');

  const email = await prompt('  Email: ');
  const password = await prompt('  Password: ');

  if (!email || !password) {
    showError('Email and password required');
    process.exit(1);
  }

  try {
    const { status, body } = await httpRequest(
      `${serverUrl}/api/auth/login`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(JSON.stringify({ email, password })),
        },
      },
      JSON.stringify({ email, password })
    );

    const data = JSON.parse(body);
    if (status === 200 && data.access_token) {
      saveConfig({
        server: serverUrl,
        token: data.access_token,
        projectDir: process.cwd(),
        email,
      });
      showSuccess(`Logged in as ${email}`);
      showInfo(`Token saved to ${getConfigPath()}`);
      showInfo('Run: xerocode-agent connect -g <goal_id>');
    } else {
      showError(data.detail || data.message || `Login failed (${status})`);
    }
  } catch (err: any) {
    showError(`Connection failed: ${err.message}`);
  }
}

async function goalsCommand(serverUrl: string, token: string): Promise<void> {
  showBanner();

  try {
    const { status, body } = await httpRequest(
      `${serverUrl}/api/goals/`,
      {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      }
    );

    if (status === 200) {
      const goals = JSON.parse(body);
      showGoalsList(goals);
    } else if (status === 401) {
      showError('Token expired. Run: xerocode-agent login');
    } else {
      showError(`Failed to fetch goals (${status})`);
    }
  } catch (err: any) {
    showError(`Connection failed: ${err.message}`);
  }
}

async function interactiveMode(): Promise<void> {
  showBanner();
  const config = loadConfig();

  if (!config?.token) {
    console.log('');
    showInfo('Not logged in. Starting login...');
    console.log('');
    await loginCommand(config?.server || 'https://xerocode.space');
    return;
  }

  showInfo(`Server: ${config.server}`);
  if (config.email) showInfo(`User: ${config.email}`);
  console.log('');

  const inquirer = require('inquirer');
  const { action } = await inquirer.prompt([{
    type: 'list',
    name: 'action',
    message: 'What do you want to do?',
    choices: [
      { name: '🔌 Connect to goal', value: 'connect' },
      { name: '📋 List goals', value: 'goals' },
      { name: '⚙️  Status', value: 'status' },
      { name: '🔑 Re-login', value: 'login' },
      { name: '🚪 Logout', value: 'logout' },
    ],
  }]);

  switch (action) {
    case 'connect': {
      const goalId = config.lastGoalId
        ? await prompt(`  Goal ID [${config.lastGoalId}]: `) || config.lastGoalId
        : await prompt('  Goal ID: ');
      if (!goalId) { showError('Goal ID required'); return; }
      saveConfig({ ...config, lastGoalId: goalId });
      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);
      connect(config.server, goalId, config.token, config.projectDir);
      break;
    }
    case 'goals':
      await goalsCommand(config.server, config.token);
      break;
    case 'status':
      showInfo(`Server:    ${config.server}`);
      showInfo(`Project:   ${config.projectDir}`);
      showInfo(`Last goal: ${config.lastGoalId || 'none'}`);
      showInfo(`Token:     ${config.token.slice(0, 20)}...`);
      showInfo(`Config:    ${getConfigPath()}`);
      break;
    case 'login':
      await loginCommand(config.server);
      break;
    case 'logout':
      clearConfig();
      showSuccess('Credentials cleared');
      break;
  }
}

// ── CLI ─────────────────────────────────────────────────

program
  .name('xerocode-agent')
  .description('XeroCode Agent — connect your computer to AI models')
  .version('0.2.0');

program
  .command('login')
  .description('Login to XeroCode and save credentials')
  .option('-s, --server <url>', 'Server URL', 'https://xerocode.space')
  .action(async (opts) => {
    await loginCommand(opts.server);
  });

program
  .command('connect')
  .description('Connect to a goal and execute tasks locally')
  .requiredOption('-g, --goal <id>', 'Goal ID')
  .option('-t, --token <jwt>', 'JWT token (uses saved if omitted)')
  .option('-s, --server <url>', 'Server URL (uses saved if omitted)')
  .option('-p, --project <path>', 'Project directory', process.cwd())
  .action((opts) => {
    const config = loadConfig();

    const token = opts.token || config?.token;
    const server = opts.server || config?.server || 'https://xerocode.space';
    const projectDir = path.resolve(opts.project);

    if (!token) {
      showError('No token. Run: xerocode-agent login');
      process.exit(1);
    }

    if (!fs.existsSync(projectDir)) {
      showError(`Project directory not found: ${projectDir}`);
      process.exit(1);
    }

    saveConfig({ server, token, projectDir, lastGoalId: opts.goal });

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    showBanner();
    showInfo(`Project: ${projectDir}`);
    showInfo(`Server: ${server}`);
    console.log('');
    connect(server, opts.goal, token, projectDir);
  });

program
  .command('goals')
  .description('List your goals')
  .option('-s, --server <url>', 'Server URL')
  .action(async (opts) => {
    const config = loadConfig();
    const server = opts.server || config?.server || 'https://xerocode.space';
    const token = config?.token;
    if (!token) { showError('Not logged in. Run: xerocode-agent login'); process.exit(1); }
    await goalsCommand(server, token);
  });

program
  .command('status')
  .description('Show saved configuration')
  .action(() => {
    const config = loadConfig();
    if (!config) {
      showInfo('Not configured. Run: xerocode-agent login');
      return;
    }
    showBanner();
    console.log('');
    showInfo(`Server:    ${config.server}`);
    showInfo(`Project:   ${config.projectDir}`);
    showInfo(`Last goal: ${config.lastGoalId || 'none'}`);
    showInfo(`Token:     ${config.token.slice(0, 20)}...`);
    showInfo(`Config:    ${getConfigPath()}`);
  });

program
  .command('logout')
  .description('Clear saved credentials')
  .action(() => {
    clearConfig();
    showSuccess('Credentials cleared');
  });

program.parse(process.argv);

// If no command → interactive mode
if (!process.argv.slice(2).length) {
  interactiveMode().catch((err) => {
    showError(err.message);
    process.exit(1);
  });
}
