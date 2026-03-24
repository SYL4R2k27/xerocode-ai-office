import { program } from 'commander';
import WebSocket from 'ws';
import * as path from 'path';
import * as fs from 'fs';
import { executeToolCall } from './executor';
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

    // Announce as agent
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
        showError(msg.message || 'Неизвестная ошибка сервера');
      }
    } catch (err: any) {
      showError(`Ошибка обработки сообщения: ${err.message}`);
    }
  });

  ws.on('close', (code: number) => {
    if (isShuttingDown) return;

    if (code === 4001) {
      showError('Невалидный токен. Получите новый через /api/auth/login');
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
  showInfo('Завершение работы...');
  if (reconnectTimer) clearTimeout(reconnectTimer);
  if (ws) ws.close();
  process.exit(0);
}

// CLI
program
  .name('ai-office-agent')
  .description('Локальный агент для ИИ Офис — подключи свой компьютер к ИИ моделям')
  .version('0.1.0')
  .requiredOption('-g, --goal <id>', 'ID цели (goal_id)')
  .requiredOption('-t, --token <jwt>', 'JWT токен авторизации')
  .option('-s, --server <url>', 'URL сервера', 'https://xerocode.space')
  .option('-p, --project <path>', 'Путь к проекту', process.cwd())
  .parse(process.argv);

const opts = program.opts();

// Validate project path
const projectDir = path.resolve(opts.project);
if (!fs.existsSync(projectDir)) {
  showError(`Папка проекта не найдена: ${projectDir}`);
  process.exit(1);
}

// Graceful shutdown
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start
showBanner();
showInfo(`Проект: ${projectDir}`);
showInfo(`Сервер: ${opts.server}`);
connect(opts.server, opts.goal, opts.token, projectDir);
