import chalk from 'chalk';
import ora, { Ora } from 'ora';

let activeSpinner: Ora | null = null;

// ── Header ──────────────────────────────────────────────

export function showBanner(): void {
  console.log('');
  console.log(chalk.bold(`  XeroCode Agent`) + chalk.gray(` v0.2.0`));
}

export function showConnected(server: string, project: string, goalId: string): void {
  stopSpinner();
  console.log(chalk.green(`  ● Connected to ${server}`));
  console.log(chalk.gray(`  Project: ${project}`));
  console.log(chalk.gray(`  Goal:    ${goalId}`));
  console.log('');
}

export function showDisconnected(): void {
  stopSpinner();
  console.log(chalk.yellow(`  ○ Disconnected`));
}

export function showReconnecting(): void {
  activeSpinner = ora({
    text: chalk.yellow('Reconnecting...'),
    prefixText: ' ',
    color: 'yellow',
  }).start();
}

// ── Tool execution ──────────────────────────────────────

export function showToolStart(tool: string, args: Record<string, any>): Ora {
  stopSpinner();
  const argsPreview = formatArgs(args);
  activeSpinner = ora({
    text: chalk.blue(`${tool}`) + chalk.gray(` ${argsPreview}`),
    prefixText: '  ',
    color: 'blue',
  }).start();
  return activeSpinner;
}

export function showToolSuccess(tool: string, output: string, durationMs: number): void {
  const duration = chalk.gray(`(${(durationMs / 1000).toFixed(1)}s)`);
  const preview = output.length > 100 ? output.slice(0, 100) + '...' : output;
  if (activeSpinner) {
    activeSpinner.succeed(chalk.green(tool) + ' ' + chalk.gray(preview) + ' ' + duration);
    activeSpinner = null;
  } else {
    console.log(`  ${chalk.green('✓')} ${tool} ${chalk.gray(preview)} ${duration}`);
  }
}

export function showToolFail(tool: string, error: string, durationMs: number): void {
  const duration = chalk.gray(`(${(durationMs / 1000).toFixed(1)}s)`);
  const preview = error.length > 100 ? error.slice(0, 100) + '...' : error;
  if (activeSpinner) {
    activeSpinner.fail(chalk.red(tool) + ' ' + chalk.gray(preview) + ' ' + duration);
    activeSpinner = null;
  } else {
    console.log(`  ${chalk.red('✗')} ${tool} ${chalk.gray(preview)} ${duration}`);
  }
}

export function showProgress(completed: number, total: number): void {
  console.log(chalk.gray(`  ${chalk.green('✓')} ${completed}/${total} tasks complete`));
}

// ── Tool execution (legacy compat) ──────────────────────

export function showToolExecution(tool: string, args: Record<string, any>): void {
  showToolStart(tool, args);
}

export function showToolResult(tool: string, success: boolean, output: string): void {
  if (success) {
    showToolSuccess(tool, output, 0);
  } else {
    showToolFail(tool, output, 0);
  }
}

// ── Status messages ─────────────────────────────────────

export function showError(msg: string): void {
  stopSpinner();
  console.log(`  ${chalk.red('✗')} ${msg}`);
}

export function showInfo(msg: string): void {
  console.log(chalk.gray(`  ${msg}`));
}

export function showSuccess(msg: string): void {
  console.log(`  ${chalk.green('✓')} ${msg}`);
}

export function showComplete(): void {
  stopSpinner();
  console.log('');
  console.log(`  ${chalk.green.bold('✅ All tasks complete')}`);
  console.log('');
}

export function showGoalsList(goals: any[]): void {
  if (goals.length === 0) {
    showInfo('No goals found');
    return;
  }
  console.log('');
  console.log(chalk.bold('  Goals:'));
  for (const goal of goals) {
    const status = goal.status === 'completed'
      ? chalk.green('✓')
      : goal.status === 'in_progress'
        ? chalk.blue('●')
        : chalk.gray('○');
    const id = chalk.gray(goal.id.slice(0, 8));
    const title = goal.title || 'Untitled';
    console.log(`  ${status} ${id} ${title}`);
  }
  console.log('');
}

// ── Helpers ─────────────────────────────────────────────

function formatArgs(args: Record<string, any>): string {
  return Object.entries(args)
    .map(([k, v]) => {
      const val = typeof v === 'string' ? (v.length > 40 ? v.slice(0, 40) + '...' : v) : String(v);
      return `${k}=${val}`;
    })
    .join(' ');
}

function stopSpinner(): void {
  if (activeSpinner) {
    activeSpinner.stop();
    activeSpinner = null;
  }
}
