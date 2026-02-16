import { LoggerService, LogLevel } from '@nestjs/common';

type JsonLogLevel = 'DEBUG' | 'ERROR' | 'FATAL' | 'INFO' | 'VERBOSE' | 'WARN';

type JsonLogRecord = {
  timestamp: string;
  level: JsonLogLevel;
  message: string;
  context?: string;
  trace?: string;
};

export class JsonLogger implements LoggerService {
  log(message: unknown, context?: string): void {
    this.write('INFO', message, context);
  }

  error(message: unknown, trace?: string, context?: string): void {
    this.write('ERROR', message, context, trace);
  }

  warn(message: unknown, context?: string): void {
    this.write('WARN', message, context);
  }

  debug(message: unknown, context?: string): void {
    this.write('DEBUG', message, context);
  }

  verbose(message: unknown, context?: string): void {
    this.write('VERBOSE', message, context);
  }

  fatal(message: unknown, trace?: string, context?: string): void {
    this.write('FATAL', message, context, trace);
  }

  // Optional LoggerService API; included for compatibility with Nest internals.
  setLogLevels(levels: LogLevel[]): void {
    void levels;
    return;
  }

  private write(
    level: JsonLogLevel,
    message: unknown,
    context?: string,
    trace?: string,
  ): void {
    const record: JsonLogRecord = {
      timestamp: new Date().toISOString(),
      level,
      message: this.toMessage(message),
      ...(context ? { context } : {}),
      ...(trace ? { trace } : {}),
    };

    process.stdout.write(`${JSON.stringify(record)}\n`);
  }

  private toMessage(message: unknown): string {
    if (typeof message === 'string') {
      return message;
    }
    if (message instanceof Error) {
      return message.message;
    }

    try {
      return JSON.stringify(message);
    } catch {
      return String(message);
    }
  }
}
