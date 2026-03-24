import chalk from 'chalk';

export function showBanner(): void {
  console.log(chalk.cyan.bold(`
  ╔══════════════════════════════════╗
  ║       🏢 AI Office Agent        ║
  ║   Локальный агент для ИИ Офис   ║
  ╚══════════════════════════════════╝
  `));
}

export function showConnected(server: string, project: string, goalId: string): void {
  console.log(chalk.green('🔌 Подключен к ИИ Офис'));
  console.log(chalk.gray(`   Сервер:  ${server}`));
  console.log(chalk.gray(`   Проект:  ${project}`));
  console.log(chalk.gray(`   Цель:    ${goalId}`));
  console.log(chalk.gray('   Ожидаю задачи от моделей...\n'));
}

export function showDisconnected(): void {
  console.log(chalk.yellow('⚠️  Отключен. Переподключение через 3 сек...'));
}

export function showReconnecting(): void {
  console.log(chalk.yellow('🔄 Переподключаюсь...'));
}

export function showToolExecution(tool: string, args: Record<string, any>): void {
  const argsStr = Object.entries(args)
    .map(([k, v]) => `${k}=${typeof v === 'string' && v.length > 50 ? v.slice(0, 50) + '...' : v}`)
    .join(', ');
  console.log(chalk.blue(`⚡ [${tool}] ${argsStr}`));
}

export function showToolResult(tool: string, success: boolean, output: string): void {
  const icon = success ? chalk.green('✅') : chalk.red('❌');
  const preview = output.length > 200 ? output.slice(0, 200) + '...' : output;
  console.log(`${icon} [${tool}] ${chalk.gray(preview)}`);
}

export function showError(msg: string): void {
  console.log(chalk.red(`❌ Ошибка: ${msg}`));
}

export function showInfo(msg: string): void {
  console.log(chalk.gray(`ℹ️  ${msg}`));
}

export function showComplete(): void {
  console.log(chalk.green.bold('\n✅ Все задачи выполнены.\n'));
}
