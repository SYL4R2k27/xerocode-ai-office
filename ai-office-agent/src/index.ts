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
  showComplete,
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

        ws!.send(JSON.stringify({
          action: 'tool_result',
          request_id: msg.request_id,
          success: result.success,
          output: result.output,
          error: result.error || null,
        }));
      } else if (msg.action === 'ping') {
        ws!.send(JSON.stringify({ action: 'pong' }));
      } else if (msg.action === 'goal_complete') {
        showComplete();
      } else if (msg.action === 'error') {
        showError(msg.message || 'Unknown server error');
      }
    } catch (err: any) {
      showError(`Message processing error: ${err.message}`);
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

async function loginCommand(serverUrl: string): Promise<void> {
  showBanner();
  showInfo(`Server: ${serverUrl}`);

  const email = await prompt('Email: ');
  const password = await prompt('Password: ');

  if (!email || !password) {
    showError('Email and password are required');
    process.exit(1);
  }

  const postData = JSON.stringify({ email, password });
  const url = new URL(`${serverUrl}/api/auth/login`);

  const httpModule = serverUrl.startsWith('https') ? require('https') : require('http');

  const req = httpModule.request(
    {
      hostname: url.hostname,
      port: url.port || (serverUrl.startsWith('https') ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    },
    (res: any) => {
      let body = '';
      res.on('data', (chunk: string) => { body += chunk; });
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (res.statusCode === 200 && data.access_token) {
            saveConfig({
              server: serverUrl,
              token: data.access_token,
              projectDir: process.cwd(),
            });
            showInfo(`Logged in as ${email}`);
            showInfo(`Token saved to ${getConfigPath()}`);
            showInfo('Now run: xerocode-agent connect -g <goal_id>');
          } else {
            showError(data.detail || data.message || `Login failed (${res.statusCode})`);
          }
        } catch {
          showError(`Invalid server response (${res.statusCode})`);
        }
      });
    }
  );

  req.on('error', (err: Error) => {
    showError(`Connection failed: ${err.message}`);
  });

  req.write(postData);
  req.end();
}

// CLI
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

    // Save config with latest goal
    saveConfig({ server, token, projectDir, lastGoalId: opts.goal });

    // Graceful shutdown
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    showBanner();
    showInfo(`Project: ${projectDir}`);
    showInfo(`Server: ${server}`);
    connect(server, opts.goal, token, projectDir);
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
    showInfo('Credentials cleared');
  });

program.parse(process.argv);

// If no command provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
