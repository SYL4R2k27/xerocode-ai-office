import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { validatePath, validateCommand } from './security';
import { showToolExecution, showToolResult } from './ui';

export interface ToolResult {
  success: boolean;
  output: string;
  error?: string;
}

const MAX_OUTPUT = 100 * 1024; // 100KB

export async function executeToolCall(
  tool: string,
  args: Record<string, any>,
  projectDir: string
): Promise<ToolResult> {
  showToolExecution(tool, args);

  try {
    let result: ToolResult;

    switch (tool) {
      case 'write_file':
        result = writeFile(args.path, args.content, projectDir);
        break;
      case 'read_file':
        result = readFile(args.path, projectDir);
        break;
      case 'run_command':
        result = runCommand(args.command, projectDir);
        break;
      case 'list_files':
        result = listFiles(args.directory || '.', projectDir);
        break;
      case 'search_code':
        result = searchCode(args.query, args.path || '.', projectDir);
        break;
      default:
        result = { success: false, output: '', error: `Неизвестный инструмент: ${tool}` };
    }

    showToolResult(tool, result.success, result.output || result.error || '');
    return result;
  } catch (err: any) {
    const error = err.message || String(err);
    showToolResult(tool, false, error);
    return { success: false, output: '', error };
  }
}

function writeFile(filePath: string, content: string, projectDir: string): ToolResult {
  const check = validatePath(filePath, projectDir);
  if (!check.valid) return { success: false, output: '', error: check.error };

  const fullPath = path.resolve(projectDir, filePath);
  const dir = path.dirname(fullPath);

  // Create directories if needed
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(fullPath, content, 'utf-8');
  const size = Buffer.byteLength(content, 'utf-8');
  return { success: true, output: `Файл создан: ${filePath} (${size} байт)` };
}

function readFile(filePath: string, projectDir: string): ToolResult {
  const check = validatePath(filePath, projectDir);
  if (!check.valid) return { success: false, output: '', error: check.error };

  const fullPath = path.resolve(projectDir, filePath);

  if (!fs.existsSync(fullPath)) {
    return { success: false, output: '', error: `Файл не найден: ${filePath}` };
  }

  const stat = fs.statSync(fullPath);
  if (stat.size > MAX_OUTPUT) {
    return { success: false, output: '', error: `Файл слишком большой: ${stat.size} байт (макс ${MAX_OUTPUT})` };
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  return { success: true, output: content };
}

function runCommand(command: string, projectDir: string): ToolResult {
  const check = validateCommand(command);
  if (!check.valid) return { success: false, output: '', error: check.error };

  try {
    const output = execSync(command, {
      cwd: projectDir,
      timeout: 30000, // 30 seconds
      maxBuffer: MAX_OUTPUT,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    return { success: true, output: output.trim() };
  } catch (err: any) {
    const stderr = err.stderr?.toString() || '';
    const stdout = err.stdout?.toString() || '';
    return {
      success: false,
      output: stdout,
      error: stderr || err.message,
    };
  }
}

function listFiles(directory: string, projectDir: string): ToolResult {
  const check = validatePath(directory, projectDir);
  if (!check.valid) return { success: false, output: '', error: check.error };

  const fullPath = path.resolve(projectDir, directory);

  if (!fs.existsSync(fullPath)) {
    return { success: false, output: '', error: `Директория не найдена: ${directory}` };
  }

  const files: string[] = [];
  const walk = (dir: string, prefix: string = '') => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      // Skip heavy dirs
      if (['node_modules', '.git', '__pycache__', '.venv', 'dist', 'build'].includes(entry.name)) continue;

      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        files.push(`${rel}/`);
        if (files.length < 500) walk(path.join(dir, entry.name), rel);
      } else {
        files.push(rel);
      }
      if (files.length >= 500) return;
    }
  };

  walk(fullPath);
  return { success: true, output: files.join('\n') };
}

function searchCode(query: string, searchPath: string, projectDir: string): ToolResult {
  const check = validatePath(searchPath, projectDir);
  if (!check.valid) return { success: false, output: '', error: check.error };

  const fullPath = path.resolve(projectDir, searchPath);

  try {
    // Use grep if available
    const output = execSync(
      `grep -rn --include="*.{py,js,ts,tsx,jsx,html,css,json,md,txt,yaml,yml}" "${query}" "${fullPath}" 2>/dev/null | head -50`,
      { cwd: projectDir, timeout: 10000, maxBuffer: MAX_OUTPUT, encoding: 'utf-8' }
    );
    return { success: true, output: output.trim() || 'Совпадений не найдено' };
  } catch {
    return { success: true, output: 'Совпадений не найдено' };
  }
}
