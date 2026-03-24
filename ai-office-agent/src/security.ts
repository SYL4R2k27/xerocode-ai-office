import * as path from 'path';

const BLOCKED_COMMANDS = [
  'rm -rf /',
  'rm -rf /*',
  'mkfs',
  'dd if=',
  '> /dev/sd',
  'chmod 777',
  'chown',
  'sudo',
  'su -',
  'passwd',
  'shutdown',
  'reboot',
  'init ',
  'kill -9 1',
  'killall',
  'cat /etc/shadow',
  'cat /etc/passwd',
  'curl | sh',
  'curl | bash',
  'wget | sh',
  'wget | bash',
  '| sh',
  '| bash',
  '| zsh',
  'python -c',
  'python3 -c',
  'node -e',
  'eval ',
  'exec(',
  'nc -l',
  'ncat ',
  'mount ',
  'umount ',
];

const BLOCKED_PATTERNS = [
  /`[^`]+`/,           // backtick execution
  /\$\([^)]+\)/,       // $() subshell
  />\s*\/etc\//,        // write to /etc
  />\s*\/var\/log/,     // write to logs
  />\s*\/usr\//,        // write to system dirs
];

export function validatePath(filePath: string, projectDir: string): { valid: boolean; error?: string } {
  const resolved = path.resolve(projectDir, filePath);
  const normalizedProject = path.resolve(projectDir);

  if (!resolved.startsWith(normalizedProject)) {
    return { valid: false, error: `Путь ${filePath} выходит за пределы проекта` };
  }

  // Block hidden system files
  const parts = filePath.split(path.sep);
  for (const part of parts) {
    if (part === '.git' || part === 'node_modules') continue; // allow these
    if (part.startsWith('.') && part !== '.' && part !== '..') {
      // Allow .env, .gitignore etc but block .ssh, .aws
      const blocked = ['.ssh', '.aws', '.gnupg', '.config'];
      if (blocked.includes(part)) {
        return { valid: false, error: `Доступ к ${part} запрещён` };
      }
    }
  }

  return { valid: true };
}

export function validateCommand(command: string): { valid: boolean; error?: string } {
  if (command.length > 1000) {
    return { valid: false, error: 'Команда слишком длинная (макс 1000 символов)' };
  }

  const lower = command.toLowerCase();

  for (const blocked of BLOCKED_COMMANDS) {
    if (lower.includes(blocked.toLowerCase())) {
      return { valid: false, error: `Команда заблокирована: содержит "${blocked}"` };
    }
  }

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(command)) {
      return { valid: false, error: `Команда заблокирована: опасный паттерн` };
    }
  }

  return { valid: true };
}
