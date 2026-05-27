export class Logger {
  constructor(public readonly name: string) {}

  debug(message: string, ...args: unknown[]) {
    console.debug(`[${this.name}] ${message}`, ...args);
  }

  info(message: string, ...args: unknown[]) {
    console.info(`[${this.name}] ${message}`, ...args);
  }

  warn(message: string, ...args: unknown[]) {
    console.warn(`[${this.name}] ${message}`, ...args);
  }

  error(message: string, ...args: unknown[]) {
    console.error(`[${this.name}] ${message}`, ...args);
  }
}
