export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4,
}

export interface LogContext {
  [key: string]: any;
}

export interface LoggerOptions {
  level?: LogLevel;
  service?: string;
  environment?: string;
}

export class Logger {
  private level: LogLevel;
  private service: string;
  private environment: string;

  constructor(options: LoggerOptions = {}) {
    this.level = options.level ?? LogLevel.INFO;
    this.service = options.service ?? "api";
    this.environment = options.environment ?? "development";
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.level;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const parts: string[] = [];
    parts.push(`[${new Date().toISOString()}]`);
    parts.push(`[${LogLevel[level]}]`);
    parts.push(`[${this.service}]`);
    parts.push(`[${this.environment}]`);
    parts.push(message);

    if (context && Object.keys(context).length > 0) {
      parts.push(JSON.stringify(context));
    }

    return parts.join(" ");
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const formattedMessage = this.formatMessage(level, message, context);

    switch (level) {
      case LogLevel.ERROR:
        console.error(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.DEBUG:
        console.debug(formattedMessage);
        break;
      case LogLevel.TRACE:
        console.trace(formattedMessage);
        break;
    }
  }

  error(message: string, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  trace(message: string, context?: LogContext): void {
    this.log(LogLevel.TRACE, message, context);
  }

  logRequest(
    method: string,
    url: string,
    statusCode?: number,
    duration?: number,
    context?: LogContext,
  ): void {
    const message = `${method} ${url}`;
    const requestContext = {
      method,
      url,
      statusCode,
      duration: duration ? `${duration}ms` : undefined,
      ...context,
    };

    if (statusCode && statusCode >= 400) {
      this.error(message, requestContext);
    } else if (statusCode && statusCode >= 300) {
      this.warn(message, requestContext);
    } else {
      this.info(message, requestContext);
    }
  }

  logError(error: Error, context?: LogContext): void {
    this.error(error.message, {
      name: error.name,
      stack: error.stack,
      ...context,
    });
  }

  child(additionalContext: LogContext): Logger {
    const childLogger = new Logger({
      level: this.level,
      service: this.service,
      environment: this.environment,
    });

    const originalLog = childLogger.log.bind(childLogger);
    childLogger.log = (level: LogLevel, message: string, context?: LogContext) => {
      const mergedContext = { ...additionalContext, ...context };
      originalLog(level, message, mergedContext);
    };

    return childLogger;
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  getLevel(): LogLevel {
    return this.level;
  }
}

export const logger = new Logger({
  level: process.env.NODE_ENV === "production" ? LogLevel.INFO : LogLevel.DEBUG,
  environment: process.env.NODE_ENV || "development",
});

export const logError = (message: string, context?: LogContext) => logger.error(message, context);
export const logWarn = (message: string, context?: LogContext) => logger.warn(message, context);
export const logInfo = (message: string, context?: LogContext) => logger.info(message, context);
export const logDebug = (message: string, context?: LogContext) => logger.debug(message, context);
export const logTrace = (message: string, context?: LogContext) => logger.trace(message, context);
