import { ConsoleLogger, Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FileLoggerService extends ConsoleLogger {
  private logDirectory = path.join(process.cwd(), 'logs');
  private logFile = path.join(this.logDirectory, 'app.log');

  constructor() {
    super();
    this.ensureLogDirectoryExists();
  }

  private ensureLogDirectoryExists() {
    if (!fs.existsSync(this.logDirectory)) {
      fs.mkdirSync(this.logDirectory, { recursive: true });
    }
  }

  private writeToFile(level: string, message: any, stack?: string, context?: string) {
    const timestamp = new Date().toISOString();
    const cleanMessage = typeof message === 'object' ? JSON.stringify(message) : message;
    let logLine = `[${timestamp}] [${level.toUpperCase()}]`;
    if (context) logLine += ` [${context}]`;
    logLine += ` ${cleanMessage}`;
    if (stack) logLine += `\nStack Trace:\n${stack}`;
    logLine += '\n';

    try {
      this.ensureLogDirectoryExists();
      fs.appendFileSync(this.logFile, logLine, 'utf8');
    } catch (err) {
      console.error('Error writing to log file:', err);
    }
  }

  log(message: any, context?: string) {
    super.log(message, context);
    this.writeToFile('log', message, undefined, context);
  }

  error(message: any, stack?: string, context?: string) {
    super.error(message, stack, context);
    this.writeToFile('error', message, stack, context);
  }

  warn(message: any, context?: string) {
    super.warn(message, context);
    this.writeToFile('warn', message, undefined, context);
  }

  debug(message: any, context?: string) {
    super.debug(message, context);
    this.writeToFile('debug', message, undefined, context);
  }

  verbose(message: any, context?: string) {
    super.verbose(message, context);
    this.writeToFile('verbose', message, undefined, context);
  }
}
